import { NextRequest, NextResponse } from 'next/server'
import {
  ACCOUNT_SESSION_COOKIE,
  createAccountSession,
  deleteAccountSession,
  ensureAccountAuthTables,
  getAccountSessionFromRequest,
  setAccountSessionCookie,
} from '@/lib/account-session'
import {
  clearCustomerLoginFailures,
  ensureCustomerLoginAccount,
  markCustomerAccountEmailVerified,
  setCustomerAccountPassword,
} from '@/lib/customer-auth'
import { getPasswordValidationError, hashPassword, verifyPassword } from '@/lib/password'

export async function POST(request: NextRequest) {
  try {
    await ensureAccountAuthTables()

    const session = await getAccountSessionFromRequest(request)
    if (!session) {
      return NextResponse.json({ error: 'Session expired. Please sign in again.' }, { status: 401 })
    }

    const body = await request.json()
    const currentPassword = typeof body?.currentPassword === 'string' ? body.currentPassword : ''
    const newPassword = typeof body?.newPassword === 'string' ? body.newPassword : ''
    const confirmPassword = typeof body?.confirmPassword === 'string' ? body.confirmPassword : ''

    if (newPassword !== confirmPassword) {
      return NextResponse.json({ error: 'Passwords do not match.' }, { status: 400 })
    }

    const passwordError = getPasswordValidationError(newPassword)
    if (passwordError) {
      return NextResponse.json({ error: passwordError }, { status: 400 })
    }

    const account = await ensureCustomerLoginAccount(session.email)
    if (account.passwordHash) {
      const passwordIsValid = await verifyPassword(currentPassword, account.passwordHash)
      if (!passwordIsValid) {
        return NextResponse.json({ error: 'Current password is incorrect.' }, { status: 400 })
      }
    }

    const passwordHash = await hashPassword(newPassword)
    await setCustomerAccountPassword(session.email, passwordHash)
    await markCustomerAccountEmailVerified(session.email)
    await clearCustomerLoginFailures(session.email)

    await deleteAccountSession(request.cookies.get(ACCOUNT_SESSION_COOKIE)?.value)

    const nextSession = await createAccountSession(session.email)
    const response = NextResponse.json({
      success: true,
      expiresAt: nextSession.expiresAt,
    })

    setAccountSessionCookie(response, nextSession)

    return response
  } catch (error) {
    console.error('Password change error:', error)
    return NextResponse.json({ error: 'Failed to update password.' }, { status: 500 })
  }
}
