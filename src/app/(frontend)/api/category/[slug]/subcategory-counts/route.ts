import { NextRequest, NextResponse } from 'next/server'
import { getPool } from '@/lib/db'

/**
 * GET /api/category/[slug]/subcategory-counts
 * Fetch product counts for all subcategories of a category
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    const pool = getPool()
    
    // Get category ID
    const categoryResult = await pool.query<{ id: string }>(
      'SELECT id FROM categories WHERE slug = $1',
      [slug]
    )
    
    if (categoryResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 }
      )
    }
    
    const categoryId = categoryResult.rows[0].id
    
    // Get product counts for all direct children
    const result = await pool.query(
      `SELECT c.id, COUNT(p.id) as product_count
       FROM categories c
       LEFT JOIN products p ON p.primary_category_id = c.id 
         AND p.status = 'published'
       WHERE c.parent_id = $1
       GROUP BY c.id`,
      [categoryId]
    )
    
    // Convert to map
    const counts: Record<string, number> = {}
    for (const row of result.rows) {
      counts[row.id] = parseInt(row.product_count, 10)
    }
    
    return NextResponse.json(
      { counts },
      { 
        headers: {
          'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=3600',
        }
      }
    )
    
  } catch (error) {
    console.error('Error fetching subcategory counts:', error)
    return NextResponse.json(
      { error: 'Failed to fetch product counts' },
      { status: 500 }
    )
  }
}
