import { NextRequest, NextResponse } from 'next/server'
import { getPool } from '@/lib/db'

/**
 * GET /api/category-products/[categoryId]/random-products
 * Fetch random products from a category and its subcategories
 * 
 * Query params:
 * - limit: number (default: 8, max: 12)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ categoryId: string }> }
) {
  try {
    const { categoryId } = await params
    const { searchParams } = new URL(request.url)
    const limit = Math.min(parseInt(searchParams.get('limit') || '8', 10), 12)
    
    const pool = getPool()
    
    // Query random products from category and child categories
    const result = await pool.query(
      `SELECT p.id, p.name, p.slug, p.sku, p.short_description, 
              p.pricing, p.external_image_url, p.status
       FROM products p
       WHERE p.primary_category_id IN (
         -- Get category and all descendant categories (recursive)
         WITH RECURSIVE category_tree AS (
           SELECT id FROM categories WHERE id = $1
           UNION ALL
           SELECT c.id FROM categories c
           INNER JOIN category_tree ct ON c.parent_id = ct.id
         )
         SELECT id FROM category_tree
       )
       AND p.status = 'published'
       ORDER BY RANDOM()
       LIMIT $2`,
      [categoryId, limit]
    )
    
    const products = result.rows.map((p) => {
      // Parse pricing
      let basePrice: number | undefined
      try {
        let pricingData = p.pricing
        if (typeof pricingData === 'string') {
          pricingData = JSON.parse(pricingData)
        }
        if (pricingData && typeof pricingData === 'object' && 'basePrice' in pricingData) {
          const rawPrice = pricingData.basePrice
          if (typeof rawPrice === 'number' && !isNaN(rawPrice)) {
            basePrice = rawPrice
          } else if (typeof rawPrice === 'string') {
            const parsed = parseFloat(rawPrice)
            if (!isNaN(parsed)) {
              basePrice = parsed
            }
          }
        }
      } catch {
        basePrice = undefined
      }
      
      return {
        id: p.id,
        name: p.name,
        slug: p.slug,
        sku: p.sku,
        primaryImage: p.external_image_url || undefined,
        pricing: {
          basePrice,
          currency: 'USD',
        },
      }
    })
    
    return NextResponse.json({ products }, { 
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
      }
    })
    
  } catch (error) {
    console.error('Error fetching random products:', error)
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    )
  }
}
