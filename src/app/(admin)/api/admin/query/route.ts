import { NextRequest, NextResponse } from 'next/server'
import { Pool } from 'pg'

// Only allow queries in production with proper authentication
const ALLOWED_ORIGINS = [
  'http://localhost:3000',
  'https://machrio.com',
  'https://www.machrio.com',
]

export async function POST(request: NextRequest) {
  try {
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

    // Connect to database
    const databaseUri = process.env.DATABASE_URI
    if (!databaseUri) {
      return NextResponse.json(
        { error: 'Database connection not configured' },
        { status: 500 }
      )
    }

    const pool = new Pool({
      connectionString: databaseUri,
      ssl:
        process.env.NODE_ENV === 'production'
          ? { rejectUnauthorized: false }
          : false,
    })

    try {
      const result = await pool.query(sql)
      return NextResponse.json({ rows: result.rows })
    } finally {
      await pool.end()
    }
  } catch (error) {
    console.error('Database query error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Query failed' },
      { status: 500 }
    )
  }
}
