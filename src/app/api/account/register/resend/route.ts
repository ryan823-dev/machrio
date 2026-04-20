import { NextResponse } from 'next/server'
import { AccountChallengeRateLimitError, createAccountChallenge } from '@/lib/account-challenges'
import { findCustomerAccountByEmail } from '@/lib/customer-auth'
import { sendRegisterVerificationEmail } from '@/lib/email'

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : ''

    if (!isValidEmail(email)) {
      return NextResponse.json({ error: 'Valid email is required.' }, { status: 400 })
    }

    const account = await findCustomerAccountByEmail(email)
    if (!account || account.emailVerifiedAt) {
      return NextResponse.json({
        success: true,
        message: 'If a pending account exists for this email, a new verification code has been sent.',
      })
    }

    const challenge = await createAccountChallenge({
      email,
      purpose: 'register_verify',
    })
    const emailResult = await sendRegisterVerificationEmail(email, challenge.code)

    if (!emailResult.success) {
      const isEmailServiceUnavailable = emailResult.error === 'Resend not configured'

      return NextResponse.json(
        {
          error: isEmailServiceUnavailable
            ? 'Email service is not configured. Please contact support.'
            : 'Failed to resend the verification email. Please try again later.',
        },
        { status: isEmailServiceUnavailable ? 503 : 502 },
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Verification code sent to your email.',
    })
  } catch (error) {
    if (error instanceof AccountChallengeRateLimitError) {
      return NextResponse.json(
        {
          error: error.message,
          retryAfterSeconds: error.retryAfterSeconds,
        },
        { status: 429 },
      )
    }

    console.error('Register resend error:', error)
    return NextResponse.json({ error: 'Failed to resend verification code.' }, { status: 500 })
  }
}
