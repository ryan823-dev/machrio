import { NextResponse } from 'next/server'
import { createAccountSession, setAccountSessionCookie } from '@/lib/account-session'
import { verifyAccountChallenge } from '@/lib/account-challenges'
import {
  clearCustomerLoginFailures,
  ensureCustomerLoginAccount,
  markCustomerAccountEmailVerified,
  setCustomerAccountPassword,
} from '@/lib/customer-auth'
import { syncCustomerLinksByEmail } from '@/lib/customer-service'
import { getPasswordValidationError, hashPassword } from '@/lib/password'

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : ''
    const code = typeof body?.code === 'string' ? body.code.trim() : ''
    const newPassword = typeof body?.newPassword === 'string' ? body.newPassword : ''
    const confirmPassword = typeof body?.confirmPassword === 'string' ? body.confirmPassword : ''

    if (!isValidEmail(email) || !/^\d{6}$/.test(code)) {
      return NextResponse.json({ error: 'Valid email and 6-digit code are required.' }, { status: 400 })
    }

    if (newPassword !== confirmPassword) {
      return NextResponse.json({ error: 'Passwords do not match.' }, { status: 400 })
    }

    const passwordError = getPasswordValidationError(newPassword)
    if (passwordError) {
      return NextResponse.json({ error: passwordError }, { status: 400 })
    }

    const challengeResult = await verifyAccountChallenge({
      email,
      purpose: 'reset_password',
      code,
    })

    if (!challengeResult.success) {
      if (challengeResult.reason === 'too_many_attempts') {
        return NextResponse.json(
          { error: 'Too many failed attempts. Please request a new reset code.' },
          { status: 400 },
        )
      }

      return NextResponse.json(
        { error: 'Invalid or expired reset code. Please request a new one.' },
        { status: 400 },
      )
    }

    await ensureCustomerLoginAccount(email)
    const passwordHash = await hashPassword(newPassword)
    await setCustomerAccountPassword(email, passwordHash)
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
        console.error('Failed to sync customer links after password reset:', error)
      })
    })

    return response
  } catch (error) {
    console.error('Password reset error:', error)
    return NextResponse.json({ error: 'Failed to reset password.' }, { status: 500 })
  }
}
