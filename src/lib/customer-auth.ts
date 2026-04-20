import crypto from 'crypto'
import { getPool } from '@/lib/db'
import { ensureAccountAuthTables } from '@/lib/account-session'
import { ensureCustomerAccount } from '@/lib/customer-service'

const MAX_LOGIN_ATTEMPTS = 5
const LOGIN_LOCK_MINUTES = 15

export interface CustomerAccountRecord {
  id: string
  customerId: string
  email: string
  passwordHash: string | null
  emailVerifiedAt: string | null
  passwordSetAt: string | null
  failedLoginAttempts: number
  lockedUntil: string | null
  lastLoginAt: string | null
  createdAt: string
  updatedAt: string
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

function mapCustomerAccountRow(row: Record<string, unknown> | undefined): CustomerAccountRecord | null {
  if (!row) return null

  return {
    id: String(row.id),
    customerId: String(row.customer_id),
    email: normalizeEmail(String(row.email || '')),
    passwordHash: row.password_hash ? String(row.password_hash) : null,
    emailVerifiedAt: row.email_verified_at ? new Date(String(row.email_verified_at)).toISOString() : null,
    passwordSetAt: row.password_set_at ? new Date(String(row.password_set_at)).toISOString() : null,
    failedLoginAttempts: Number(row.failed_login_attempts || 0),
    lockedUntil: row.locked_until ? new Date(String(row.locked_until)).toISOString() : null,
    lastLoginAt: row.last_login_at ? new Date(String(row.last_login_at)).toISOString() : null,
    createdAt: new Date(String(row.created_at)).toISOString(),
    updatedAt: new Date(String(row.updated_at)).toISOString(),
  }
}

export function isCustomerAccountLocked(account: CustomerAccountRecord): boolean {
  return Boolean(account.lockedUntil && new Date(account.lockedUntil).getTime() > Date.now())
}

export function getCustomerAccountLockSeconds(account: CustomerAccountRecord): number {
  if (!account.lockedUntil) return 0

  return Math.max(0, Math.ceil((new Date(account.lockedUntil).getTime() - Date.now()) / 1000))
}

export async function findCustomerAccountByEmail(email: string): Promise<CustomerAccountRecord | null> {
  await ensureAccountAuthTables()

  const pool = getPool()
  const result = await pool.query(
    `SELECT
       id::text AS id,
       customer_id::text AS customer_id,
       email,
       password_hash,
       email_verified_at,
       password_set_at,
       failed_login_attempts,
       locked_until,
       last_login_at,
       created_at,
       updated_at
     FROM customer_accounts
     WHERE LOWER(email) = $1
     LIMIT 1`,
    [normalizeEmail(email)],
  )

  return mapCustomerAccountRow(result.rows[0])
}

export async function ensureCustomerLoginAccount(email: string): Promise<CustomerAccountRecord> {
  await ensureAccountAuthTables()

  const normalizedEmail = normalizeEmail(email)
  const existing = await findCustomerAccountByEmail(normalizedEmail)
  if (existing) return existing

  const customer = await ensureCustomerAccount(normalizedEmail)
  const pool = getPool()
  const result = await pool.query(
    `INSERT INTO customer_accounts (
      id,
      customer_id,
      email,
      created_at,
      updated_at
    ) VALUES ($1, $2::uuid, $3, NOW(), NOW())
    ON CONFLICT (email) DO UPDATE
    SET updated_at = NOW()
    RETURNING
      id::text AS id,
      customer_id::text AS customer_id,
      email,
      password_hash,
      email_verified_at,
      password_set_at,
      failed_login_attempts,
      locked_until,
      last_login_at,
      created_at,
      updated_at`,
    [crypto.randomUUID(), customer.id, normalizedEmail],
  )

  const account = mapCustomerAccountRow(result.rows[0])
  if (!account) {
    throw new Error('Failed to ensure customer login account')
  }

  return account
}

export async function setCustomerAccountPassword(
  email: string,
  passwordHash: string,
): Promise<CustomerAccountRecord> {
  const account = await ensureCustomerLoginAccount(email)
  const pool = getPool()
  const result = await pool.query(
    `UPDATE customer_accounts
     SET password_hash = $2,
         password_set_at = NOW(),
         updated_at = NOW()
     WHERE id = $1::uuid
     RETURNING
       id::text AS id,
       customer_id::text AS customer_id,
       email,
       password_hash,
       email_verified_at,
       password_set_at,
       failed_login_attempts,
       locked_until,
       last_login_at,
       created_at,
       updated_at`,
    [account.id, passwordHash],
  )

  const updatedAccount = mapCustomerAccountRow(result.rows[0])
  if (!updatedAccount) {
    throw new Error('Failed to update customer account password')
  }

  return updatedAccount
}

export async function markCustomerAccountEmailVerified(email: string): Promise<CustomerAccountRecord> {
  const account = await ensureCustomerLoginAccount(email)
  const pool = getPool()
  const result = await pool.query(
    `UPDATE customer_accounts
     SET email_verified_at = COALESCE(email_verified_at, NOW()),
         updated_at = NOW()
     WHERE id = $1::uuid
     RETURNING
       id::text AS id,
       customer_id::text AS customer_id,
       email,
       password_hash,
       email_verified_at,
       password_set_at,
       failed_login_attempts,
       locked_until,
       last_login_at,
       created_at,
       updated_at`,
    [account.id],
  )

  const updatedAccount = mapCustomerAccountRow(result.rows[0])
  if (!updatedAccount) {
    throw new Error('Failed to mark customer account as verified')
  }

  return updatedAccount
}

export async function recordCustomerLoginFailure(account: CustomerAccountRecord): Promise<CustomerAccountRecord> {
  const nextAttempts = account.failedLoginAttempts + 1
  const lockedUntil = nextAttempts >= MAX_LOGIN_ATTEMPTS
    ? new Date(Date.now() + LOGIN_LOCK_MINUTES * 60 * 1000).toISOString()
    : null
  const pool = getPool()
  const result = await pool.query(
    `UPDATE customer_accounts
     SET failed_login_attempts = $2,
         locked_until = $3,
         updated_at = NOW()
     WHERE id = $1::uuid
     RETURNING
       id::text AS id,
       customer_id::text AS customer_id,
       email,
       password_hash,
       email_verified_at,
       password_set_at,
       failed_login_attempts,
       locked_until,
       last_login_at,
       created_at,
       updated_at`,
    [account.id, nextAttempts, lockedUntil],
  )

  const updatedAccount = mapCustomerAccountRow(result.rows[0])
  if (!updatedAccount) {
    throw new Error('Failed to record login failure')
  }

  return updatedAccount
}

export async function clearCustomerLoginFailures(email: string): Promise<CustomerAccountRecord> {
  const account = await ensureCustomerLoginAccount(email)
  const pool = getPool()
  const result = await pool.query(
    `UPDATE customer_accounts
     SET failed_login_attempts = 0,
         locked_until = NULL,
         last_login_at = NOW(),
         updated_at = NOW()
     WHERE id = $1::uuid
     RETURNING
       id::text AS id,
       customer_id::text AS customer_id,
       email,
       password_hash,
       email_verified_at,
       password_set_at,
       failed_login_attempts,
       locked_until,
       last_login_at,
       created_at,
       updated_at`,
    [account.id],
  )

  const updatedAccount = mapCustomerAccountRow(result.rows[0])
  if (!updatedAccount) {
    throw new Error('Failed to clear customer login failures')
  }

  return updatedAccount
}
