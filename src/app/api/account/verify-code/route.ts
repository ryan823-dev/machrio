import { NextResponse } from 'next/server'
import { getPool } from '@/lib/db'
import crypto from 'crypto'

export async function POST(request: Request) {
  try {
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

    // Generate session token
    const token = crypto.randomBytes(32).toString('hex')
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()

    // Create session
    await pool.query(
      `INSERT INTO account_sessions (id, email, token, expires_at, created_at)
       VALUES (gen_random_uuid(), $1, $2, $3, NOW())`,
      [normalizedEmail, token, expiresAt]
    )

    return NextResponse.json({ success: true, token, expiresAt })
  } catch (err) {
    console.error('Verify code error:', err)
    return NextResponse.json({ error: 'Verification failed' }, { status: 500 })
  }
}