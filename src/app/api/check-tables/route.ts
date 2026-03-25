import { NextResponse } from 'next/server'
import { Pool } from 'pg'

export const dynamic = 'force-dynamic'

export async function GET() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URI,
    max: 1,
  })

  try {
    const result = await pool.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name
    `)

    await pool.end()
    return NextResponse.json({ tables: result.rows.map(r => r.table_name) })
  } catch (error) {
    await pool.end()
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
