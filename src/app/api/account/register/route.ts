import { NextResponse } from 'next/server'
import { createAccountChallenge, AccountChallengeRateLimitError } from '@/lib/account-challenges'
import {
  findCustomerAccountByEmail,
  setCustomerAccountPassword,
} from '@/lib/customer-auth'
import { sendRegisterVerificationEmail } from '@/lib/email'
import { getPasswordValidationError } from '@/lib/password'
import { hashPassword } from '@/lib/password'

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : ''
    const password = typeof body?.password === 'string' ? body.password : ''
    const confirmPassword = typeof body?.confirmPassword === 'string' ? body.confirmPassword : ''

    if (!isValidEmail(email)) {
      return NextResponse.json({ error: 'Valid email is required.' }, { status: 400 })
    }

    if (password !== confirmPassword) {
      return NextResponse.json({ error: 'Passwords do not match.' }, { status: 400 })
    }

    const passwordError = getPasswordValidationError(password)
    if (passwordError) {
      return NextResponse.json({ error: passwordError }, { status: 400 })
    }

    const existingAccount = await findCustomerAccountByEmail(email)
    if (existingAccount?.passwordHash && existingAccount.emailVerifiedAt) {
      return NextResponse.json(
        { error: 'An account with this email already exists. Please sign in instead.' },
        { status: 409 },
      )
    }

    const passwordHash = await hashPassword(password)
    await setCustomerAccountPassword(email, passwordHash)

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
            : 'Failed to send the verification email. Please try again later.',
        },
        { status: isEmailServiceUnavailable ? 503 : 502 },
      )
    }

    return NextResponse.json({
      success: true,
      pendingVerification: true,
      email,
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

    console.error('Register error:', error)
    return NextResponse.json({ error: 'Failed to create account.' }, { status: 500 })
  }
}
