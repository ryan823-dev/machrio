import { NextRequest, NextResponse } from 'next/server'
import { getPool, getCategoryBySlug } from '@/lib/db'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const query = searchParams.get('q')?.trim()
  const limit = Math.min(parseInt(searchParams.get('limit') || '24'), 100)
  const page = Math.max(parseInt(searchParams.get('page') || '1'), 1)
  const offset = (page - 1) * limit
  const categoryFilter = searchParams.get('category') || ''

  if (!query || query.length < 2) {
    return NextResponse.json({
      products: [],
      facets: { brands: [], categories: [], priceRange: { min: 0, max: 0 }, availability: [] },
      totalDocs: 0,
      totalPages: 0,
      page: 1,
      hasNextPage: false,
      hasPrevPage: false,
      query: '',
    })
  }

  try {
    const pool = getPool()
    const searchTerm = `%${query.toLowerCase()}%`

    // Build WHERE conditions
    let whereClause = `WHERE status = 'published' AND (LOWER(name) LIKE $1 OR LOWER(short_description) LIKE $1 OR LOWER(sku) LIKE $1)`
    const params: any[] = [searchTerm]
    let paramIndex = 2

    // Category filter
    if (categoryFilter) {
      const cat = await getCategoryBySlug(categoryFilter)
      if (cat) {
        whereClause += ` AND primary_category_id::text = $${paramIndex}`
        params.push(cat.id)
        paramIndex++
      }
    }

    // Count total
    const countResult = await pool.query(
      `SELECT COUNT(*) as total FROM products ${whereClause}`,
      params
    )
    const totalDocs = parseInt(countResult.rows[0]?.total || '0', 10)
    const totalPages = Math.ceil(totalDocs / limit) || 1

    // Fetch products
    const dataResult = await pool.query(
      `SELECT * FROM products ${whereClause} ORDER BY created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...params, limit, offset]
    )

    // Transform results
    const products = dataResult.rows.map((p) => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      sku: p.sku,
      shortDescription: p.short_description,
      externalImageUrl: p.external_image_url,
      brand: null,
      category: null,
      pricing: null,
      packageQty: p.package_qty,
      availability: p.availability,
      purchaseMode: p.purchase_mode || 'both',
    }))

    return NextResponse.json({
      products,
      facets: {
        brands: [],
        categories: [],
        priceRange: { min: 0, max: 0 },
        availability: [],
      },
      totalDocs,
      totalPages,
      page,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
      query,
    })
  } catch (error) {
    console.error('Search error:', error)
    return NextResponse.json(
      { error: 'Search failed' },
      { status: 500 }
    )
  }
}