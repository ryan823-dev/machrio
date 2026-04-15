import { NextResponse } from 'next/server'
import { getPool } from '@/lib/db'

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

  // Check if DATABASE_URI is configured
  if (!process.env.DATABASE_URI) {
    console.warn('[check-product] DATABASE_URI not configured, assuming product exists')
    return NextResponse.json({ exists: true })
  }

  try {
    const pool = getPool()

    const result = await pool.query(
      "SELECT id FROM products WHERE slug = $1 AND status = 'published' LIMIT 1",
      [slug]
    )

    // 注意：不要调用 pool.end()！在 serverless 环境中连接池应该被复用

    return NextResponse.json({
      exists: result.rows.length > 0,
    })
  } catch (error) {
    console.error('[check-product] Error checking product:', error)
    // Return true to avoid breaking the site - let the product page handle 404
    return NextResponse.json({ exists: true, error: 'Database error' })
  }
}
