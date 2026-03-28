import { NextRequest, NextResponse } from 'next/server'
import { getPool, getProductSuggestions, getCategories } from '@/lib/db'

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get('q')?.trim()

  if (!query || query.length < 2) {
    return NextResponse.json({ products: [], categories: [], brands: [] })
  }

  try {
    const pool = getPool()
    const searchTerm = `%${query.toLowerCase()}%`

    // Run all queries in parallel
    const [productResults, categoryResults] = await Promise.all([
      // Products: top 4
      pool.query(
        `SELECT name, slug, sku, external_image_url, short_description
         FROM products
         WHERE status = 'published'
         AND (LOWER(name) LIKE $1 OR LOWER(sku) LIKE $1 OR LOWER(short_description) LIKE $1)
         ORDER BY created_at DESC LIMIT 4`,
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

    // Map products
    const products = productResults.rows.map((p) => ({
      name: p.name,
      slug: p.slug,
      categorySlug: 'products',
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