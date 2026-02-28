import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'

// Simple stemming: generate singular/plural variants
function getSearchVariants(query: string): string[] {
  const variants = [query]
  const lower = query.toLowerCase()
  
  // If ends with 'ies', try replacing with 'y' (e.g., batteries -> battery)
  if (lower.endsWith('ies') && query.length > 4) {
    variants.push(query.slice(0, -3) + 'y')
  }
  // If ends with 'es', try removing 'es' (e.g., boxes -> box)
  else if (lower.endsWith('es') && query.length > 3) {
    variants.push(query.slice(0, -2))
  }
  // If ends with 's', try removing 's' (e.g., tapes -> tape, gloves -> glove)
  if (lower.endsWith('s') && query.length > 2) {
    variants.push(query.slice(0, -1))
  }
  // If singular, also try plural (e.g., tape -> tapes)
  if (!lower.endsWith('s')) {
    variants.push(query + 's')
  }
  
  return [...new Set(variants)] // Remove duplicates
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const query = searchParams.get('q')?.trim()
  const limit = Math.min(parseInt(searchParams.get('limit') || '24'), 100)
  const page = Math.max(parseInt(searchParams.get('page') || '1'), 1)

  if (!query || query.length < 2) {
    return NextResponse.json({
      products: [],
      totalDocs: 0,
      totalPages: 0,
      page: 1,
      hasNextPage: false,
      hasPrevPage: false,
    })
  }

  try {
    const payload = await getPayload({ config })
    
    // Get search variants for plural/singular handling
    const searchTerms = getSearchVariants(query)
    
    // Build OR conditions for each search term variant - use explicit type
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const searchConditions: any[] = []
    for (const term of searchTerms) {
      searchConditions.push({ name: { contains: term } })
      searchConditions.push({ shortDescription: { contains: term } })
      searchConditions.push({ sku: { contains: term } })
    }

    // Search products by name, shortDescription, SKU with variant matching
    const results = await payload.find({
      collection: 'products',
      where: {
        or: searchConditions,
      },
      limit,
      page,
      sort: '-createdAt',
      depth: 1, // Include related brand/category data
    })

    // Transform results to include only necessary fields
    const products = results.docs.map((product) => {
      const p = product as unknown as Record<string, unknown>
      const brand = p.brand as Record<string, unknown> | null
      const category = p.primaryCategory as Record<string, unknown> | null
      const pricing = p.pricing as Record<string, unknown> | null

      return {
        id: p.id,
        name: p.name,
        slug: p.slug,
        sku: p.sku,
        shortDescription: p.shortDescription,
        externalImageUrl: p.externalImageUrl,
        brand: brand ? { name: brand.name, slug: brand.slug } : null,
        category: category ? { name: category.name, slug: category.slug } : null,
        pricing: pricing ? {
          basePrice: pricing.basePrice,
          currency: pricing.currency || 'USD',
        } : null,
        availability: p.availability,
      }
    })

    return NextResponse.json({
      products,
      totalDocs: results.totalDocs,
      totalPages: results.totalPages,
      page: results.page,
      hasNextPage: results.hasNextPage,
      hasPrevPage: results.hasPrevPage,
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
