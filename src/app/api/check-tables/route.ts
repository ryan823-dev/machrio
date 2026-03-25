import { NextResponse } from 'next/server'
import { Pool } from 'pg'

export const dynamic = 'force-dynamic'

export async function GET() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URI,
    max: 1,
  })

  try {
    // Get tables
    const tablesResult = await pool.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name
    `)

    // Check products table structure and sample data
    const productsResult = await pool.query(`
      SELECT id, name, slug, status, primary_category_id
      FROM products
      LIMIT 10
    `)

    // Check product slugs
    const slugResult = await pool.query(`
      SELECT slug, COUNT(*) as count
      FROM products
      GROUP BY slug
      HAVING COUNT(*) > 1
    `)

    await pool.end()

    return NextResponse.json({
      tables: tablesResult.rows.map(r => r.table_name),
      sampleProducts: productsResult.rows,
      duplicateSlugs: slugResult.rows,
    })
  } catch (error) {
    await pool.end()
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
