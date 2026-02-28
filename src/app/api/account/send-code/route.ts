import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import { sendVerificationCodeEmail } from '@/lib/email'

export async function POST(request: Request) {
  try {
    const { email } = await request.json()

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Valid email is required' }, { status: 400 })
    }

    const normalizedEmail = email.toLowerCase().trim()
    const payload = await getPayload({ config })

    // Rate limit: max 3 codes per email per 15 min
    const fifteenMinAgo = new Date(Date.now() - 15 * 60 * 1000).toISOString()
    const recentCodes = await payload.find({
      collection: 'verification-codes' as any,
      where: {
        email: { equals: normalizedEmail },
        createdAt: { greater_than: fifteenMinAgo },
      },
      limit: 0,
    })

    if (recentCodes.totalDocs >= 3) {
      // Still return success to prevent email enumeration
      return NextResponse.json({ success: true, message: 'Verification code sent to your email' })
    }

    // Generate 6-digit code
    const code = String(Math.floor(100000 + Math.random() * 900000))

    // Store in database
    await payload.create({
      collection: 'verification-codes' as any,
      data: {
        email: normalizedEmail,
        code,
        expiresAt: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
        attempts: 0,
        verified: false,
      },
    })

    // Send email
    await sendVerificationCodeEmail(normalizedEmail, code)

    return NextResponse.json({ success: true, message: 'Verification code sent to your email' })
  } catch (err) {
    console.error('Send code error:', err)
    return NextResponse.json({ error: 'Failed to send verification code' }, { status: 500 })
  }
}
