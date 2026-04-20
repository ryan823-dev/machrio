import crypto from 'crypto'
import { cookies } from 'next/headers'
import type { NextRequest, NextResponse } from 'next/server'
import { getPool } from '@/lib/db'

export const ACCOUNT_SESSION_COOKIE = 'machrio_account_session'

const SESSION_TTL_HOURS = Number(process.env.CUSTOMER_ACCOUNT_SESSION_TTL_HOURS || 24 * 7)
const SESSION_TTL_MS = SESSION_TTL_HOURS * 60 * 60 * 1000

let accountAuthTablesReady = false

export interface AccountSession {
  email: string
  token: string
  expiresAt: string
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

function getSessionCookieMaxAge(): number {
  return Math.max(60, Math.floor(SESSION_TTL_MS / 1000))
}

export async function ensureAccountAuthTables() {
  if (accountAuthTablesReady) return

  const pool = getPool()

  await pool.query(`
    CREATE TABLE IF NOT EXISTS verification_codes (
      id UUID PRIMARY KEY,
      email TEXT NOT NULL,
      code TEXT NOT NULL,
      attempts INTEGER NOT NULL DEFAULT 0,
      verified BOOLEAN NOT NULL DEFAULT false,
      expires_at TIMESTAMPTZ NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `)

  await pool.query(`
    CREATE TABLE IF NOT EXISTS account_sessions (
      id UUID PRIMARY KEY,
      email TEXT NOT NULL,
      token TEXT UNIQUE,
      verification_code TEXT,
      expires_at TIMESTAMPTZ NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `)

  await pool.query(`
    CREATE TABLE IF NOT EXISTS customer_accounts (
      id UUID PRIMARY KEY,
      customer_id UUID NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT,
      email_verified_at TIMESTAMPTZ,
      password_set_at TIMESTAMPTZ,
      failed_login_attempts INTEGER NOT NULL DEFAULT 0,
      locked_until TIMESTAMPTZ,
      last_login_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `)

  await pool.query(`
    CREATE TABLE IF NOT EXISTS account_challenges (
      id UUID PRIMARY KEY,
      email TEXT NOT NULL,
      purpose TEXT NOT NULL,
      code_hash TEXT NOT NULL,
      attempts INTEGER NOT NULL DEFAULT 0,
      max_attempts INTEGER NOT NULL DEFAULT 5,
      expires_at TIMESTAMPTZ NOT NULL,
      consumed_at TIMESTAMPTZ,
      metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `)

  await pool.query(`ALTER TABLE verification_codes ADD COLUMN IF NOT EXISTS attempts INTEGER NOT NULL DEFAULT 0`)
  await pool.query(`ALTER TABLE verification_codes ADD COLUMN IF NOT EXISTS verified BOOLEAN NOT NULL DEFAULT false`)
  await pool.query(`ALTER TABLE account_sessions ADD COLUMN IF NOT EXISTS token TEXT`)
  await pool.query(`ALTER TABLE account_sessions ADD COLUMN IF NOT EXISTS verification_code TEXT`)
  await pool.query(`ALTER TABLE customer_accounts ADD COLUMN IF NOT EXISTS customer_id UUID`)
  await pool.query(`ALTER TABLE customer_accounts ADD COLUMN IF NOT EXISTS password_hash TEXT`)
  await pool.query(`ALTER TABLE customer_accounts ADD COLUMN IF NOT EXISTS email_verified_at TIMESTAMPTZ`)
  await pool.query(`ALTER TABLE customer_accounts ADD COLUMN IF NOT EXISTS password_set_at TIMESTAMPTZ`)
  await pool.query(`ALTER TABLE customer_accounts ADD COLUMN IF NOT EXISTS failed_login_attempts INTEGER NOT NULL DEFAULT 0`)
  await pool.query(`ALTER TABLE customer_accounts ADD COLUMN IF NOT EXISTS locked_until TIMESTAMPTZ`)
  await pool.query(`ALTER TABLE customer_accounts ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ`)
  await pool.query(`ALTER TABLE customer_accounts ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`)
  await pool.query(`ALTER TABLE account_challenges ADD COLUMN IF NOT EXISTS purpose TEXT`)
  await pool.query(`ALTER TABLE account_challenges ADD COLUMN IF NOT EXISTS code_hash TEXT`)
  await pool.query(`ALTER TABLE account_challenges ADD COLUMN IF NOT EXISTS attempts INTEGER NOT NULL DEFAULT 0`)
  await pool.query(`ALTER TABLE account_challenges ADD COLUMN IF NOT EXISTS max_attempts INTEGER NOT NULL DEFAULT 5`)
  await pool.query(`ALTER TABLE account_challenges ADD COLUMN IF NOT EXISTS consumed_at TIMESTAMPTZ`)
  await pool.query(`ALTER TABLE account_challenges ADD COLUMN IF NOT EXISTS metadata JSONB NOT NULL DEFAULT '{}'::jsonb`)
  await pool.query(`ALTER TABLE account_challenges ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`)

  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_verification_codes_email_created_at
    ON verification_codes(email, created_at DESC)
  `)
  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_verification_codes_email_expires_at
    ON verification_codes(email, expires_at DESC)
  `)
  await pool.query(`
    CREATE UNIQUE INDEX IF NOT EXISTS idx_account_sessions_token
    ON account_sessions(token)
    WHERE token IS NOT NULL
  `)
  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_account_sessions_email_created_at
    ON account_sessions(email, created_at DESC)
  `)
  await pool.query(`
    CREATE UNIQUE INDEX IF NOT EXISTS idx_customer_accounts_email
    ON customer_accounts(email)
  `)
  await pool.query(`
    CREATE UNIQUE INDEX IF NOT EXISTS idx_customer_accounts_customer_id
    ON customer_accounts(customer_id)
  `)
  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_account_challenges_email_purpose_created_at
    ON account_challenges(email, purpose, created_at DESC)
  `)
  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_account_challenges_email_purpose_expires_at
    ON account_challenges(email, purpose, expires_at DESC)
  `)

  accountAuthTablesReady = true
}

export async function createAccountSession(email: string): Promise<AccountSession> {
  await ensureAccountAuthTables()

  const sessionId = crypto.randomUUID()
  const token = crypto.randomBytes(32).toString('hex')
  const normalizedEmail = normalizeEmail(email)
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS).toISOString()
  const pool = getPool()

  await pool.query(
    `INSERT INTO account_sessions (id, email, token, expires_at, created_at)
     VALUES ($1, $2, $3, $4, NOW())`,
    [sessionId, normalizedEmail, token, expiresAt],
  )

  return {
    email: normalizedEmail,
    token,
    expiresAt,
  }
}

export async function deleteAccountSession(token: string | null | undefined) {
  if (!token) return

  await ensureAccountAuthTables()

  const pool = getPool()
  await pool.query(`DELETE FROM account_sessions WHERE token = $1`, [token])
}

export async function getAccountSessionByToken(
  token: string | null | undefined,
): Promise<AccountSession | null> {
  if (!token || token.length !== 64) return null

  await ensureAccountAuthTables()

  const pool = getPool()
  const result = await pool.query(
    `SELECT email, token, expires_at
     FROM account_sessions
     WHERE token = $1 AND expires_at > NOW()
     ORDER BY created_at DESC
     LIMIT 1`,
    [token],
  )

  const row = result.rows[0]
  if (!row) return null

  return {
    email: normalizeEmail(String(row.email)),
    token: String(row.token),
    expiresAt: new Date(row.expires_at).toISOString(),
  }
}

export async function getAccountSessionFromRequest(request: NextRequest): Promise<AccountSession | null> {
  return getAccountSessionByToken(request.cookies.get(ACCOUNT_SESSION_COOKIE)?.value)
}

export async function getAccountSessionFromCookieStore(): Promise<AccountSession | null> {
  const cookieStore = await cookies()
  return getAccountSessionByToken(cookieStore.get(ACCOUNT_SESSION_COOKIE)?.value)
}

export function setAccountSessionCookie(response: NextResponse, session: AccountSession) {
  response.cookies.set({
    name: ACCOUNT_SESSION_COOKIE,
    value: session.token,
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: getSessionCookieMaxAge(),
    expires: new Date(session.expiresAt),
  })
}

export function clearAccountSessionCookie(response: NextResponse) {
  response.cookies.set({
    name: ACCOUNT_SESSION_COOKIE,
    value: '',
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 0,
    expires: new Date(0),
  })
}
