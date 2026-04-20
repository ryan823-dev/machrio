import { NextResponse } from 'next/server'
import { createAccountSession, setAccountSessionCookie } from '@/lib/account-session'
import {
  clearCustomerLoginFailures,
  findCustomerAccountByEmail,
  getCustomerAccountLockSeconds,
  isCustomerAccountLocked,
  recordCustomerLoginFailure,
} from '@/lib/customer-auth'
import { verifyPassword } from '@/lib/password'
import { syncCustomerLinksByEmail } from '@/lib/customer-service'

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : ''
    const password = typeof body?.password === 'string' ? body.password : ''

    if (!isValidEmail(email) || !password) {
      return NextResponse.json({ error: 'Valid email and password are required.' }, { status: 400 })
    }

    const account = await findCustomerAccountByEmail(email)
    if (!account?.passwordHash) {
      return NextResponse.json(
        { error: 'No password is set for this email yet. Use email code sign-in or create an account.' },
        { status: 400 },
      )
    }

    if (!account.emailVerifiedAt) {
      return NextResponse.json(
        { error: 'Please verify your email before signing in.' },
        { status: 403 },
      )
    }

    if (isCustomerAccountLocked(account)) {
      return NextResponse.json(
        {
          error: 'Too many failed sign-in attempts. Please try again later.',
          retryAfterSeconds: getCustomerAccountLockSeconds(account),
        },
        { status: 423 },
      )
    }

    const passwordIsValid = await verifyPassword(password, account.passwordHash)
    if (!passwordIsValid) {
      const updatedAccount = await recordCustomerLoginFailure(account)

      if (isCustomerAccountLocked(updatedAccount)) {
        return NextResponse.json(
          {
            error: 'Too many failed sign-in attempts. Please try again later.',
            retryAfterSeconds: getCustomerAccountLockSeconds(updatedAccount),
          },
          { status: 423 },
        )
      }

      return NextResponse.json({ error: 'Incorrect email or password.' }, { status: 400 })
    }

    await clearCustomerLoginFailures(email)

    const session = await createAccountSession(email)
    const response = NextResponse.json({
      success: true,
      expiresAt: session.expiresAt,
    })

    setAccountSessionCookie(response, session)

    queueMicrotask(() => {
      void syncCustomerLinksByEmail(email, { markAccountLinked: true }).catch((error) => {
        console.error('Failed to sync customer links after password login:', error)
      })
    })

    return response
  } catch (error) {
    console.error('Account login error:', error)
    return NextResponse.json({ error: 'Failed to sign in.' }, { status: 500 })
  }
}
