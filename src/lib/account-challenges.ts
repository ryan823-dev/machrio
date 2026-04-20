import crypto from 'crypto'
import { getPool } from '@/lib/db'
import { ensureAccountAuthTables } from '@/lib/account-session'

export type AccountChallengePurpose =
  | 'register_verify'
  | 'reset_password'

export interface AccountChallengeRecord {
  id: string
  email: string
  purpose: AccountChallengePurpose
  attempts: number
  maxAttempts: number
  expiresAt: string
  consumedAt: string | null
  metadata: Record<string, unknown>
  createdAt: string
}

type VerifyChallengeFailureReason = 'not_found' | 'invalid_code' | 'too_many_attempts'

export class AccountChallengeRateLimitError extends Error {
  retryAfterSeconds: number

  constructor(retryAfterSeconds: number) {
    super('Too many verification code requests. Please wait before trying again.')
    this.retryAfterSeconds = retryAfterSeconds
  }
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

function hashChallengeCode(code: string): string {
  return crypto.createHash('sha256').update(code).digest('hex')
}

function generateChallengeCode() {
  return String(Math.floor(100000 + Math.random() * 900000))
}

function parseMetadata(value: unknown): Record<string, unknown> {
  if (!value) return {}
  if (typeof value === 'string') {
    try {
      return JSON.parse(value) as Record<string, unknown>
    } catch {
      return {}
    }
  }

  return typeof value === 'object' ? value as Record<string, unknown> : {}
}

function mapChallengeRow(row: Record<string, unknown> | undefined): AccountChallengeRecord | null {
  if (!row) return null

  return {
    id: String(row.id),
    email: normalizeEmail(String(row.email || '')),
    purpose: String(row.purpose) as AccountChallengePurpose,
    attempts: Number(row.attempts || 0),
    maxAttempts: Number(row.max_attempts || 5),
    expiresAt: new Date(String(row.expires_at)).toISOString(),
    consumedAt: row.consumed_at ? new Date(String(row.consumed_at)).toISOString() : null,
    metadata: parseMetadata(row.metadata),
    createdAt: new Date(String(row.created_at)).toISOString(),
  }
}

export async function createAccountChallenge(input: {
  email: string
  purpose: AccountChallengePurpose
  ttlMinutes?: number
  maxAttempts?: number
  metadata?: Record<string, unknown>
}) {
  await ensureAccountAuthTables()

  const normalizedEmail = normalizeEmail(input.email)
  const ttlMinutes = input.ttlMinutes ?? 5
  const maxAttempts = input.maxAttempts ?? 5
  const code = generateChallengeCode()
  const expiresAt = new Date(Date.now() + ttlMinutes * 60 * 1000).toISOString()
  const pool = getPool()

  const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000).toISOString()
  const recentResult = await pool.query<{ count: number; oldest_created_at: string | null }>(
    `SELECT COUNT(*)::int as count, MIN(created_at) as oldest_created_at
     FROM account_challenges
     WHERE email = $1
       AND purpose = $2
       AND created_at > $3`,
    [normalizedEmail, input.purpose, fifteenMinutesAgo],
  )

  const recentCount = recentResult.rows[0]?.count || 0
  if (recentCount >= 3) {
    const oldestCreatedAt = recentResult.rows[0]?.oldest_created_at
      ? new Date(recentResult.rows[0].oldest_created_at)
      : new Date()
    const retryAfterSeconds = Math.max(
      1,
      Math.ceil((oldestCreatedAt.getTime() + 15 * 60 * 1000 - Date.now()) / 1000),
    )

    throw new AccountChallengeRateLimitError(retryAfterSeconds)
  }

  const challengeId = crypto.randomUUID()
  const metadata = input.metadata || {}
  await pool.query(
    `INSERT INTO account_challenges (
      id,
      email,
      purpose,
      code_hash,
      attempts,
      max_attempts,
      expires_at,
      metadata,
      created_at
    ) VALUES ($1, $2, $3, $4, 0, $5, $6, $7::jsonb, NOW())`,
    [
      challengeId,
      normalizedEmail,
      input.purpose,
      hashChallengeCode(code),
      maxAttempts,
      expiresAt,
      JSON.stringify(metadata),
    ],
  )

  return {
    code,
    challengeId,
    expiresAt,
  }
}

export async function verifyAccountChallenge(input: {
  email: string
  purpose: AccountChallengePurpose
  code: string
  consume?: boolean
}): Promise<
  | { success: true; challenge: AccountChallengeRecord }
  | { success: false; reason: VerifyChallengeFailureReason }
> {
  await ensureAccountAuthTables()

  const normalizedEmail = normalizeEmail(input.email)
  const pool = getPool()
  const result = await pool.query(
    `SELECT *
     FROM account_challenges
     WHERE email = $1
       AND purpose = $2
       AND consumed_at IS NULL
       AND expires_at > NOW()
     ORDER BY created_at DESC
     LIMIT 1`,
    [normalizedEmail, input.purpose],
  )

  const challenge = mapChallengeRow(result.rows[0])
  if (!challenge) {
    return { success: false, reason: 'not_found' }
  }

  if (challenge.attempts >= challenge.maxAttempts) {
    return { success: false, reason: 'too_many_attempts' }
  }

  if (hashChallengeCode(input.code.trim()) !== String(result.rows[0].code_hash || '')) {
    await pool.query(
      `UPDATE account_challenges
       SET attempts = attempts + 1
       WHERE id = $1::uuid`,
      [challenge.id],
    )

    return { success: false, reason: 'invalid_code' }
  }

  if (input.consume !== false) {
    await pool.query(
      `UPDATE account_challenges
       SET consumed_at = NOW()
       WHERE id = $1::uuid`,
      [challenge.id],
    )
  }

  return {
    success: true,
    challenge,
  }
}
