import { NextResponse } from 'next/server'
import { getPool } from '@/lib/db'
import { sendVerificationCodeEmail } from '@/lib/email'

export async function POST(request: Request) {
  try {
    const { email } = await request.json()

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Valid email is required' }, { status: 400 })
    }

    const normalizedEmail = email.toLowerCase().trim()
    const pool = getPool()

    // Rate limit: max 3 codes per email per 15 min
    const fifteenMinAgo = new Date(Date.now() - 15 * 60 * 1000).toISOString()
    const recentResult = await pool.query(
      `SELECT COUNT(*) as count FROM verification_codes
       WHERE email = $1 AND created_at > $2`,
      [normalizedEmail, fifteenMinAgo]
    )

    if (parseInt(recentResult.rows[0]?.count || '0', 10) >= 3) {
      return NextResponse.json({ success: true, message: 'Verification code sent to your email' })
    }

    // Generate 6-digit code
    const code = String(Math.floor(100000 + Math.random() * 900000))
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString()

    // Store in database
    await pool.query(
      `INSERT INTO verification_codes (id, email, code, expires_at, created_at)
       VALUES (gen_random_uuid(), $1, $2, $3, NOW())`,
      [normalizedEmail, code, expiresAt]
    )

    // Send email
    await sendVerificationCodeEmail(normalizedEmail, code)

    return NextResponse.json({ success: true, message: 'Verification code sent to your email' })
  } catch (err) {
    console.error('Send code error:', err)
    return NextResponse.json({ error: 'Failed to send verification code' }, { status: 500 })
  }
}