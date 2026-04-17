import { NextRequest, NextResponse } from 'next/server'
import {
  ensureAccountAuthTables,
  getAccountSessionFromRequest,
} from '@/lib/account-session'

export async function GET(request: NextRequest) {
  try {
    await ensureAccountAuthTables()

    const session = await getAccountSessionFromRequest(request)
    if (!session) {
      return NextResponse.json({
        authenticated: false,
      })
    }

    return NextResponse.json({
      authenticated: true,
      email: session.email,
      expiresAt: session.expiresAt,
    })
  } catch (error) {
    console.error('Account me error:', error)
    return NextResponse.json(
      { error: 'Failed to read account session' },
      { status: 500 },
    )
  }
}
