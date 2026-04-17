import { NextRequest, NextResponse } from 'next/server'
import {
  ACCOUNT_SESSION_COOKIE,
  clearAccountSessionCookie,
  deleteAccountSession,
  ensureAccountAuthTables,
} from '@/lib/account-session'

export async function POST(request: NextRequest) {
  try {
    await ensureAccountAuthTables()

    const token = request.cookies.get(ACCOUNT_SESSION_COOKIE)?.value
    await deleteAccountSession(token)

    const response = NextResponse.json({ success: true })
    clearAccountSessionCookie(response)

    return response
  } catch (err) {
    console.error('Logout error:', err)
    return NextResponse.json({ error: 'Logout failed' }, { status: 500 })
  }
}
