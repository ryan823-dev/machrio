import { NextResponse } from 'next/server'
import { createAccountSession, setAccountSessionCookie } from '@/lib/account-session'
import { verifyAccountChallenge } from '@/lib/account-challenges'
import {
  clearCustomerLoginFailures,
  findCustomerAccountByEmail,
  markCustomerAccountEmailVerified,
} from '@/lib/customer-auth'
import { syncCustomerLinksByEmail } from '@/lib/customer-service'

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : ''
    const code = typeof body?.code === 'string' ? body.code.trim() : ''

    if (!isValidEmail(email) || !/^\d{6}$/.test(code)) {
      return NextResponse.json({ error: 'Valid email and 6-digit code are required.' }, { status: 400 })
    }

    const account = await findCustomerAccountByEmail(email)
    if (!account?.passwordHash) {
      return NextResponse.json({ error: 'No pending account was found for this email.' }, { status: 400 })
    }

    const challengeResult = await verifyAccountChallenge({
      email,
      purpose: 'register_verify',
      code,
    })

    if (!challengeResult.success) {
      if (challengeResult.reason === 'too_many_attempts') {
        return NextResponse.json(
          { error: 'Too many failed attempts. Please request a new verification code.' },
          { status: 400 },
        )
      }

      return NextResponse.json(
        { error: 'Invalid or expired code. Please request a new verification code.' },
        { status: 400 },
      )
    }

    await markCustomerAccountEmailVerified(email)
    await clearCustomerLoginFailures(email)

    const session = await createAccountSession(email)
    const response = NextResponse.json({
      success: true,
      expiresAt: session.expiresAt,
    })

    setAccountSessionCookie(response, session)

    queueMicrotask(() => {
      void syncCustomerLinksByEmail(email, { markAccountLinked: true }).catch((error) => {
        console.error('Failed to sync customer links after registration verification:', error)
      })
    })

    return response
  } catch (error) {
    console.error('Register verify error:', error)
    return NextResponse.json({ error: 'Verification failed.' }, { status: 500 })
  }
}
