import { NextResponse } from 'next/server'
import { Pool } from 'pg'

/**
 * Internal API to check if a product exists
 * Used by middleware to determine if a product page should return 410 Gone
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const slug = searchParams.get('slug')

  if (!slug) {
    return NextResponse.json({ exists: false, error: 'Missing slug parameter' }, { status: 400 })
  }

  const pool = new Pool({
    connectionString: process.env.DATABASE_URI,
    max: 1,
  })

  try {
    const result = await pool.query(
      'SELECT id FROM products WHERE slug = $1 LIMIT 1',
      [slug]
    )

    return NextResponse.json({
      exists: result.rows.length > 0,
    })
  } catch (error) {
    console.error('Error checking product:', error)
    return NextResponse.json({ exists: true, error: 'Database error' }, { status: 500 })
  } finally {
    await pool.end()
  }
}