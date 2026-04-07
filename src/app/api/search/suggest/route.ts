import { NextRequest, NextResponse } from 'next/server'
import { getPool, getProductSuggestions, getCategories } from '@/lib/db'

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get('q')?.trim()

  if (!query || query.length < 2) {
    return NextResponse.json({ products: [], categories: [], brands: [] })
  }

  try {
    const pool = getPool()
    // Normalize search term: replace hyphens with spaces to match product names
    const normalizedQuery = query.toLowerCase().replace(/-/g, ' ')
    const searchTerm = `%${normalizedQuery}%`

    // Run all queries in parallel
    const [productResults, categoryResults] = await Promise.all([
      // Products: top 4 (JOIN with categories to get category slug for correct URLs)
      pool.query(
        `SELECT p.name, p.slug, p.sku, p.external_image_url, p.short_description, c.slug as category_slug
         FROM products p
         LEFT JOIN categories c ON p.primary_category_id = c.id
         WHERE p.status = 'published'
         AND (LOWER(p.name) LIKE $1 OR LOWER(p.sku) LIKE $1 OR LOWER(p.short_description) LIKE $1)
         ORDER BY p.created_at DESC LIMIT 4`,
        [searchTerm]
      ),
      // Categories: top 3 matching by name
      pool.query(
        `SELECT name, slug FROM categories
         WHERE LOWER(name) LIKE $1
         ORDER BY display_order, name LIMIT 3`,
        [searchTerm]
      ),
    ])

    // Map products - use actual category slug for correct product page URLs
    const products = productResults.rows.map((p) => ({
      name: p.name,
      slug: p.slug,
      categorySlug: p.category_slug || 'products', // Use actual category slug or fallback to 'products'
      sku: p.sku,
      imageUrl: p.external_image_url || null,
      price: null,
      currency: 'USD',
      brand: null,
    }))

    // Map categories
    const categories = categoryResults.rows.map((c) => ({
      name: c.name,
      slug: c.slug,
      productCount: 0, // Skip count for performance
    }))

    return NextResponse.json({ products, categories, brands: [] })
  } catch (error) {
    console.error('Suggest error:', error)
    return NextResponse.json({ products: [], categories: [], brands: [] })
  }
}