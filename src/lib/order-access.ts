import crypto from 'crypto'
import type { NextRequest } from 'next/server'
import { getPool, type OrderRow } from '@/lib/db'
import {
  buildInvoicePath,
  buildOrderPath,
  toAbsoluteUrl,
} from '@/lib/order-access-links'
import {
  getAccountSessionFromCookieStore,
  getAccountSessionFromRequest,
} from '@/lib/account-session'

export type OrderAccessPurpose =
  | 'order-access'
  | 'invoice-access'
  | 'receipt-upload'
  | 'payment-retry'

const ORDER_ACCESS_TOKEN_TTL_HOURS = Number(process.env.ORDER_ACCESS_TOKEN_TTL_HOURS || 24 * 30)
const ORDER_ACCESS_TOKEN_TTL_MS = ORDER_ACCESS_TOKEN_TTL_HOURS * 60 * 60 * 1000

let orderAccessTablesReady = false

function normalizeEmail(email: string | null | undefined): string | null {
  if (!email) return null
  return email.trim().toLowerCase()
}

function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex')
}

function getOrderAccessExpiresAt(): string {
  return new Date(Date.now() + ORDER_ACCESS_TOKEN_TTL_MS).toISOString()
}

export async function ensureOrderAccessTables() {
  if (orderAccessTablesReady) return

  const pool = getPool()

  await pool.query(`
    CREATE TABLE IF NOT EXISTS order_access_tokens (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      order_number TEXT NOT NULL,
      email TEXT NOT NULL,
      purpose TEXT NOT NULL DEFAULT 'order-access',
      token_hash TEXT NOT NULL UNIQUE,
      expires_at TIMESTAMPTZ NOT NULL,
      last_used_at TIMESTAMPTZ,
      used_count INTEGER NOT NULL DEFAULT 0,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      metadata JSONB NOT NULL DEFAULT '{}'::jsonb
    )
  `)

  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_order_access_tokens_order_number
    ON order_access_tokens(order_number, expires_at DESC)
  `)
  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_order_access_tokens_email
    ON order_access_tokens(email, expires_at DESC)
  `)

  orderAccessTablesReady = true
}

export async function createOrderAccessToken(input: {
  orderNumber: string
  email: string
  purpose?: OrderAccessPurpose
  metadata?: Record<string, unknown>
}) {
  await ensureOrderAccessTables()

  const token = crypto.randomBytes(24).toString('base64url')
  const tokenHash = hashToken(token)
  const expiresAt = getOrderAccessExpiresAt()
  const purpose = input.purpose || 'order-access'
  const email = normalizeEmail(input.email)

  if (!email) {
    throw new Error('Order access tokens require a customer email')
  }

  const pool = getPool()
  await pool.query(
    `INSERT INTO order_access_tokens (
      id,
      order_number,
      email,
      purpose,
      token_hash,
      expires_at,
      metadata,
      created_at
    )
    VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6::jsonb, NOW())`,
    [
      input.orderNumber,
      email,
      purpose,
      tokenHash,
      expiresAt,
      JSON.stringify(input.metadata || {}),
    ],
  )

  return {
    token,
    expiresAt,
  }
}

export async function revokeOrderAccessTokensForOrder(orderNumber: string) {
  await ensureOrderAccessTables()

  const pool = getPool()
  await pool.query(`DELETE FROM order_access_tokens WHERE order_number = $1`, [orderNumber])
}

export async function issueOrderAccessLinks(input: {
  orderNumber: string
  email: string
  baseUrl: string
  accessToken?: string
}) {
  const accessToken = input.accessToken || (await createOrderAccessToken({
    orderNumber: input.orderNumber,
    email: input.email,
  })).token

  const orderPath = buildOrderPath(input.orderNumber, accessToken)
  const invoicePath = buildInvoicePath(input.orderNumber, accessToken)

  return {
    accessToken,
    orderPath,
    invoicePath,
    orderUrl: toAbsoluteUrl(orderPath, input.baseUrl),
    invoiceUrl: toAbsoluteUrl(invoicePath, input.baseUrl),
  }
}

async function validateOrderAccessToken(input: {
  orderNumber: string
  email: string | null | undefined
  accessToken: string | null | undefined
  allowedPurposes?: OrderAccessPurpose[]
}): Promise<boolean> {
  const normalizedEmail = normalizeEmail(input.email)
  if (!normalizedEmail || !input.accessToken) return false

  await ensureOrderAccessTables()

  const allowedPurposes = input.allowedPurposes || ['order-access']
  const pool = getPool()
  const tokenHash = hashToken(input.accessToken)
  const result = await pool.query(
    `SELECT id
     FROM order_access_tokens
     WHERE order_number = $1
       AND email = $2
       AND token_hash = $3
       AND purpose = ANY($4::text[])
       AND expires_at > NOW()
     ORDER BY created_at DESC
     LIMIT 1`,
    [input.orderNumber, normalizedEmail, tokenHash, allowedPurposes],
  )

  const tokenId = result.rows[0]?.id
  if (!tokenId) return false

  await pool.query(
    `UPDATE order_access_tokens
     SET last_used_at = NOW(), used_count = used_count + 1
     WHERE id = $1`,
    [tokenId],
  )

  return true
}

export async function authorizeOrderAccess(input: {
  order: OrderRow
  request?: NextRequest
  accessToken?: string | null
  allowedPurposes?: OrderAccessPurpose[]
}): Promise<{ via: 'session' | 'token'; email: string } | null> {
  const customerEmail = normalizeEmail(input.order.customer_email)

  if (!customerEmail) return null

  const session = input.request
    ? await getAccountSessionFromRequest(input.request)
    : await getAccountSessionFromCookieStore()

  if (session && normalizeEmail(session.email) === customerEmail) {
    return {
      via: 'session',
      email: customerEmail,
    }
  }

  const tokenIsValid = await validateOrderAccessToken({
    orderNumber: input.order.order_number,
    email: customerEmail,
    accessToken: input.accessToken,
    allowedPurposes: input.allowedPurposes,
  })

  if (!tokenIsValid) return null

  return {
    via: 'token',
    email: customerEmail,
  }
}
