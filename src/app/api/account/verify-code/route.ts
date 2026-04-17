import { NextResponse } from 'next/server'
import { getPool } from '@/lib/db'
import {
  createAccountSession,
  ensureAccountAuthTables,
  setAccountSessionCookie,
} from '@/lib/account-session'

export async function POST(request: Request) {
  try {
    await ensureAccountAuthTables()

    const { email, code } = await request.json()

    if (!email || !code || !/^\d{6}$/.test(code)) {
      return NextResponse.json({ error: 'Valid email and 6-digit code are required' }, { status: 400 })
    }

    const normalizedEmail = email.toLowerCase().trim()
    const pool = getPool()

    // Find latest unexpired, unverified code for this email
    const result = await pool.query(
      `SELECT * FROM verification_codes
       WHERE email = $1 AND verified = false AND expires_at > NOW()
       ORDER BY created_at DESC LIMIT 1`,
      [normalizedEmail]
    )

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Invalid or expired code. Please request a new one.' }, { status: 400 })
    }

    const verification = result.rows[0]

    // Check max attempts
    if ((verification.attempts || 0) >= 3) {
      return NextResponse.json({ error: 'Too many failed attempts. Please request a new code.' }, { status: 400 })
    }

    // Check code match
    if (verification.code !== code) {
      await pool.query(
        `UPDATE verification_codes SET attempts = attempts + 1 WHERE id = $1`,
        [verification.id]
      )
      return NextResponse.json({ error: 'Invalid code. Please try again.' }, { status: 400 })
    }

    // Code matches - mark as verified
    await pool.query(
      `UPDATE verification_codes SET verified = true WHERE id = $1`,
      [verification.id]
    )

    const session = await createAccountSession(normalizedEmail)
    const response = NextResponse.json({
      success: true,
      expiresAt: session.expiresAt,
    })

    setAccountSessionCookie(response, session)

    return response
  } catch (err) {
    console.error('Verify code error:', err)
    return NextResponse.json({ error: 'Verification failed' }, { status: 500 })
  }
}
