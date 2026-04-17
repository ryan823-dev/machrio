import crypto from 'crypto'
import { NextResponse } from 'next/server'
import { getPool } from '@/lib/db'
import { sendVerificationCodeEmail } from '@/lib/email'
import { ensureAccountAuthTables } from '@/lib/account-session'

export async function POST(request: Request) {
  try {
    await ensureAccountAuthTables()

    const { email } = await request.json()

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Valid email is required' }, { status: 400 })
    }

    const normalizedEmail = email.toLowerCase().trim()
    const pool = getPool()

    // Rate limit: max 3 codes per email per 15 min
    const fifteenMinAgo = new Date(Date.now() - 15 * 60 * 1000).toISOString()
    const recentResult = await pool.query(
      `SELECT COUNT(*)::int as count, MIN(created_at) as oldest_created_at
       FROM verification_codes
       WHERE email = $1 AND created_at > $2`,
      [normalizedEmail, fifteenMinAgo]
    )

    const recentCount = recentResult.rows[0]?.count || 0

    if (recentCount >= 3) {
      const oldestCreatedAt = recentResult.rows[0]?.oldest_created_at
        ? new Date(recentResult.rows[0].oldest_created_at)
        : new Date()
      const retryAfterSeconds = Math.max(
        1,
        Math.ceil((oldestCreatedAt.getTime() + 15 * 60 * 1000 - Date.now()) / 1000)
      )

      return NextResponse.json(
        {
          error: 'Too many verification code requests. Please wait before trying again.',
          retryAfterSeconds,
        },
        { status: 429 }
      )
    }

    // Generate 6-digit code
    const code = String(Math.floor(100000 + Math.random() * 900000))
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString()
    const verificationId = crypto.randomUUID()

    // Store in database
    await pool.query(
      `INSERT INTO verification_codes (id, email, code, expires_at, created_at)
       VALUES ($1, $2, $3, $4, NOW())`,
      [verificationId, normalizedEmail, code, expiresAt]
    )

    // Send email
    const emailResult = await sendVerificationCodeEmail(normalizedEmail, code)

    if (!emailResult.success) {
      await pool.query(`DELETE FROM verification_codes WHERE id = $1`, [verificationId])

      const isEmailServiceUnavailable = emailResult.error === 'Resend not configured'

      return NextResponse.json(
        {
          error: isEmailServiceUnavailable
            ? 'Email service is not configured. Please contact support.'
            : 'Failed to send the verification email. Please try again later.',
        },
        { status: isEmailServiceUnavailable ? 503 : 502 }
      )
    }

    return NextResponse.json({ success: true, message: 'Verification code sent to your email' })
  } catch (err) {
    console.error('Send code error:', err)
    return NextResponse.json({ error: 'Failed to send verification code' }, { status: 500 })
  }
}
