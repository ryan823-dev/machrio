import { NextResponse } from 'next/server'
import { getPool } from '@/lib/db'

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.slice(7)
    const pool = getPool()

    // Delete the session
    await pool.query(
      `DELETE FROM account_sessions WHERE token = $1`,
      [token]
    )

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Logout error:', err)
    return NextResponse.json({ error: 'Logout failed' }, { status: 500 })
  }
}