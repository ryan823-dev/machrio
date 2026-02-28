import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import crypto from 'crypto'

export async function POST(request: Request) {
  try {
    const { email, code } = await request.json()

    if (!email || !code || !/^\d{6}$/.test(code)) {
      return NextResponse.json({ error: 'Valid email and 6-digit code are required' }, { status: 400 })
    }

    const normalizedEmail = email.toLowerCase().trim()
    const payload = await getPayload({ config })

    // Find latest unexpired, unverified code for this email
    const result = await payload.find({
      collection: 'verification-codes' as any as any,
      where: {
        email: { equals: normalizedEmail },
        verified: { equals: false },
        expiresAt: { greater_than: new Date().toISOString() },
      },
      sort: '-createdAt',
      limit: 1,
    })

    if (result.docs.length === 0) {
      return NextResponse.json({ error: 'Invalid or expired code. Please request a new one.' }, { status: 400 })
    }

    const verificationDoc = result.docs[0] as any

    // Check max attempts
    if ((verificationDoc.attempts || 0) >= 3) {
      return NextResponse.json({ error: 'Too many failed attempts. Please request a new code.' }, { status: 400 })
    }

    // Check code match
    if (verificationDoc.code !== code) {
      await payload.update({
        collection: 'verification-codes' as any as any,
        id: verificationDoc.id,
        data: { attempts: (verificationDoc.attempts || 0) + 1 },
      })
      return NextResponse.json({ error: 'Invalid code. Please try again.' }, { status: 400 })
    }

    // Code matches - mark as verified
    await payload.update({
      collection: 'verification-codes' as any as any,
      id: verificationDoc.id,
      data: { verified: true },
    })

    // Generate session token
    const token = crypto.randomBytes(32).toString('hex')
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()

    // Create session
    await payload.create({
      collection: 'account-sessions' as any as any,
      data: {
        email: normalizedEmail,
        token,
        expiresAt,
      },
    })

    return NextResponse.json({ success: true, token, expiresAt })
  } catch (err) {
    console.error('Verify code error:', err)
    return NextResponse.json({ error: 'Verification failed' }, { status: 500 })
  }
}
