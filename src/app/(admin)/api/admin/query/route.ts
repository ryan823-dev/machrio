import { NextRequest, NextResponse } from 'next/server'
import { getPool } from '@/lib/db'
import { getPayload } from 'payload'
import config from '@payload-config'

// Only allow queries in production with proper authentication
const ALLOWED_ORIGINS = [
  'http://localhost:3000',
  'https://machrio.com',
  'https://www.machrio.com',
]

export async function POST(request: NextRequest) {
  try {
    const payload = await getPayload({ config })
    const authResult = await payload.auth({ headers: request.headers })
    const user = authResult.user as { role?: string } | null

    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    if (user.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    // CORS check
    const origin = request.headers.get('origin') || ''
    if (!ALLOWED_ORIGINS.includes(origin)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { sql } = await request.json()

    if (!sql || typeof sql !== 'string') {
      return NextResponse.json({ error: 'SQL query is required' }, { status: 400 })
    }

    // Security: Only allow SELECT queries
    const normalizedSql = sql.trim().toUpperCase()
    if (
      !normalizedSql.startsWith('SELECT') &&
      !normalizedSql.startsWith('WITH')
    ) {
      return NextResponse.json(
        { error: 'Only SELECT queries are allowed for security' },
        { status: 403 }
      )
    }

    // Block dangerous patterns
    const dangerousPatterns = [
      'DROP',
      'DELETE',
      'TRUNCATE',
      'ALTER',
      'INSERT',
      'UPDATE',
      'GRANT',
      'REVOKE',
      '--',
      ';',
    ]

    for (const pattern of dangerousPatterns) {
      if (normalizedSql.includes(pattern)) {
        return NextResponse.json(
          { error: 'Query contains forbidden operation' },
          { status: 403 }
        )
      }
    }

    // Connect to database using global pool
    const pool = getPool()

    const result = await pool.query(sql)
    // 注意：不要调用 pool.end()！在 serverless 环境中连接池应该被复用
    return NextResponse.json({ rows: result.rows })
  } catch (error) {
    console.error('Database query error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Query failed' },
      { status: 500 }
    )
  }
}
