import { NextRequest, NextResponse } from 'next/server'
import {
  ensureAccountAuthTables,
  getAccountSessionFromRequest,
} from '@/lib/account-session'
import { findCustomerAccountByEmail } from '@/lib/customer-auth'

export async function GET(request: NextRequest) {
  try {
    await ensureAccountAuthTables()

    const session = await getAccountSessionFromRequest(request)
    if (!session) {
      return NextResponse.json({
        authenticated: false,
        hasPassword: false,
        emailVerified: false,
      })
    }

    const account = await findCustomerAccountByEmail(session.email)

    return NextResponse.json({
      authenticated: true,
      email: session.email,
      expiresAt: session.expiresAt,
      hasPassword: Boolean(account?.passwordHash),
      emailVerified: Boolean(account?.emailVerifiedAt),
    })
  } catch (error) {
    console.error('Account me error:', error)
    return NextResponse.json(
      { error: 'Failed to read account session' },
      { status: 500 },
    )
  }
}
