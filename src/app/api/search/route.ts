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
    // Normalize search term: replace hyphens with spaces to match product names
    // e.g., "insulated-steel-lockout-padlock" → "insulated steel lockout padlock"
    const normalizedQuery = query.toLowerCase().replace(/-/g, ' ')
    const searchTerm = `%${normalizedQuery}%`
    // Also search original query with hyphens for products that have hyphens in name
    const originalTerm = `%${query.toLowerCase()}%`

    // Build WHERE conditions - match both hyphenated and space-separated versions
    // Use p. prefix for products table columns to avoid ambiguity with categories JOIN
    let whereClause = `WHERE p.status = 'published' AND (
      LOWER(p.name) LIKE $1 OR LOWER(p.short_description) LIKE $1 OR LOWER(p.sku) LIKE $1
      OR LOWER(p.name) LIKE $2 OR LOWER(p.short_description) LIKE $2 OR LOWER(p.sku) LIKE $2
    )`
    const params: any[] = [searchTerm, originalTerm]
    let paramIndex = 3

    // Category filter
    if (categoryFilter) {
      const cat = await getCategoryBySlug(categoryFilter)
      if (cat) {
        whereClause += ` AND p.primary_category_id::text = $${paramIndex}`
        params.push(cat.id)
        paramIndex++
      }
    }

    // Count total
    const countResult = await pool.query(
      `SELECT COUNT(*) as total FROM products p ${whereClause}`,
      params
    )
    const totalDocs = parseInt(countResult.rows[0]?.total || '0', 10)
    const totalPages = Math.ceil(totalDocs / limit) || 1

    // Fetch products with category slug for correct product page URLs
    const whereWithAliases = whereClause // Already has p. prefix
    
    const dataResult = await pool.query(
      `SELECT p.*, c.slug as category_slug
       FROM products p
       LEFT JOIN categories c ON p.primary_category_id = c.id
       ${whereWithAliases} ORDER BY p.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
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
      category: p.category_slug ? { name: p.name, slug: p.category_slug } : null,
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