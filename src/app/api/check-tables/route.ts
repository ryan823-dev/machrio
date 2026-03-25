import { NextResponse } from 'next/server'
import { Pool } from 'pg'

export const dynamic = 'force-dynamic'

export async function GET() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URI,
    max: 1,
  })

  try {
    // Check for specific product slug
    const targetProduct = await pool.query(`
      SELECT p.id, p.name, p.slug, p.primary_category_id, c.slug as category_slug, c.name as category_name
      FROM products p
      LEFT JOIN categories c ON p.primary_category_id = c.id
      WHERE p.slug = 'surface-protection-tape'
    `)

    // Get categories to check hierarchy
    const categoriesResult = await pool.query(`
      SELECT id, name, slug, parent_id, level
      FROM categories
      WHERE slug IN ('surface-protection-tape', 'tape', 'packing-tape')
    `)

    await pool.end()

    return NextResponse.json({
      targetProduct: targetProduct.rows,
      categories: categoriesResult.rows,
    })
  } catch (error) {
    await pool.end()
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
