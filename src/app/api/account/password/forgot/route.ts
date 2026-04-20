import { NextResponse } from 'next/server'
import { AccountChallengeRateLimitError, createAccountChallenge } from '@/lib/account-challenges'
import { findCustomerAccountByEmail } from '@/lib/customer-auth'
import { sendPasswordResetCodeEmail } from '@/lib/email'

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

const GENERIC_RESPONSE = {
  success: true,
  message: 'If an account exists for this email, a reset code has been sent.',
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : ''

    if (!isValidEmail(email)) {
      return NextResponse.json({ error: 'Valid email is required.' }, { status: 400 })
    }

    const account = await findCustomerAccountByEmail(email)
    if (!account) {
      return NextResponse.json(GENERIC_RESPONSE)
    }

    const challenge = await createAccountChallenge({
      email,
      purpose: 'reset_password',
    })
    const emailResult = await sendPasswordResetCodeEmail(email, challenge.code)

    if (!emailResult.success) {
      const isEmailServiceUnavailable = emailResult.error === 'Resend not configured'

      return NextResponse.json(
        {
          error: isEmailServiceUnavailable
            ? 'Email service is not configured. Please contact support.'
            : 'Failed to send the reset code. Please try again later.',
        },
        { status: isEmailServiceUnavailable ? 503 : 502 },
      )
    }

    return NextResponse.json(GENERIC_RESPONSE)
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

    console.error('Password forgot error:', error)
    return NextResponse.json({ error: 'Failed to start password reset.' }, { status: 500 })
  }
}
