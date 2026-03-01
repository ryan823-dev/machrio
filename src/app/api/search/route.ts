import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'

function getSearchVariants(query: string): string[] {
  const variants = [query]
  const lower = query.toLowerCase()

  if (lower.endsWith('ies') && query.length > 4) {
    variants.push(query.slice(0, -3) + 'y')
  } else if (lower.endsWith('es') && query.length > 3) {
    variants.push(query.slice(0, -2))
  }
  if (lower.endsWith('s') && query.length > 2) {
    variants.push(query.slice(0, -1))
  }
  if (!lower.endsWith('s')) {
    variants.push(query + 's')
  }

  return [...new Set(variants)]
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const query = searchParams.get('q')?.trim()
  const limit = Math.min(parseInt(searchParams.get('limit') || '24'), 100)
  const page = Math.max(parseInt(searchParams.get('page') || '1'), 1)
  const brandFilter = searchParams.get('brand') || ''
  const categoryFilter = searchParams.get('category') || ''
  const minPriceParam = searchParams.get('minPrice')
  const maxPriceParam = searchParams.get('maxPrice')
  const availabilityFilter = searchParams.get('availability') || ''
  const sortParam = searchParams.get('sort') || ''

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
    const payload = await getPayload({ config })
    const searchTerms = getSearchVariants(query)

    // Build base search conditions (text matching)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const textConditions: any[] = []
    for (const term of searchTerms) {
      textConditions.push({ name: { contains: term } })
      textConditions.push({ shortDescription: { contains: term } })
      textConditions.push({ sku: { contains: term } })
    }

    // Build filter conditions
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const filterConditions: any[] = [
      { status: { equals: 'published' } },
      { or: textConditions },
    ]

    // Brand filter
    let brandId: string | null = null
    if (brandFilter) {
      const brandResult = await payload.find({
        collection: 'brands',
        where: { slug: { equals: brandFilter } },
        limit: 1,
      })
      if (brandResult.docs.length > 0) {
        brandId = brandResult.docs[0].id
        filterConditions.push({ brand: { equals: brandId } })
      }
    }

    // Category filter
    if (categoryFilter) {
      const catResult = await payload.find({
        collection: 'categories',
        where: { slug: { equals: categoryFilter } },
        limit: 1,
      })
      if (catResult.docs.length > 0) {
        const catId = catResult.docs[0].id
        // Include child categories
        const children = await payload.find({
          collection: 'categories',
          where: { parent: { equals: catId } },
          limit: 100,
        })
        const allCatIds = [catId, ...children.docs.map(c => c.id)]
        filterConditions.push({ primaryCategory: { in: allCatIds } })
      }
    }

    // Price filters
    const minPrice = minPriceParam ? parseFloat(minPriceParam) : undefined
    const maxPrice = maxPriceParam ? parseFloat(maxPriceParam) : undefined
    if (minPrice && minPrice > 0) {
      filterConditions.push({ 'pricing.basePrice': { greater_than_equal: minPrice } })
    }
    if (maxPrice && maxPrice > 0) {
      filterConditions.push({ 'pricing.basePrice': { less_than_equal: maxPrice } })
    }

    // Availability filter
    if (availabilityFilter) {
      filterConditions.push({ availability: { equals: availabilityFilter } })
    }

    // Map sort param
    let sortField = '-createdAt'
    if (sortParam === 'price-asc') sortField = 'pricing.basePrice'
    else if (sortParam === 'price-desc') sortField = '-pricing.basePrice'
    else if (sortParam === 'name') sortField = 'name'
    else if (sortParam === 'newest') sortField = '-createdAt'

    // Fetch paginated results and aggregation data in parallel
    const [paginatedResults, allMatchingProducts] = await Promise.all([
      // Paginated results for display
      payload.find({
        collection: 'products',
        where: { and: filterConditions },
        limit,
        page,
        sort: sortField,
        depth: 1,
      }),
      // All matching products (text match only, no filters) for facet aggregation
      payload.find({
        collection: 'products',
        where: {
          and: [
            { status: { equals: 'published' } },
            { or: textConditions },
          ],
        },
        limit: 1000,
        depth: 1,
      }),
    ])

    // Build facets from all matching products (unfiltered by facets)
    const brandCounts = new Map<string, { name: string; slug: string; count: number }>()
    const categoryCounts = new Map<string, { name: string; slug: string; count: number }>()
    const availabilityCounts = new Map<string, number>()
    let priceMin = Infinity
    let priceMax = 0

    for (const doc of allMatchingProducts.docs) {
      const p = doc as unknown as Record<string, unknown>

      // Brand aggregation
      const brand = p.brand as Record<string, unknown> | null
      if (brand && typeof brand === 'object') {
        const slug = brand.slug as string
        const name = brand.name as string
        if (slug && name) {
          const existing = brandCounts.get(slug)
          if (existing) existing.count++
          else brandCounts.set(slug, { name, slug, count: 1 })
        }
      }

      // Category aggregation
      const cat = p.primaryCategory as Record<string, unknown> | null
      if (cat && typeof cat === 'object') {
        const slug = cat.slug as string
        const name = cat.name as string
        if (slug && name) {
          const existing = categoryCounts.get(slug)
          if (existing) existing.count++
          else categoryCounts.set(slug, { name, slug, count: 1 })
        }
      }

      // Price aggregation
      const pricing = p.pricing as Record<string, unknown> | null
      const price = pricing?.basePrice as number | undefined
      if (price && price > 0) {
        if (price < priceMin) priceMin = price
        if (price > priceMax) priceMax = price
      }

      // Availability aggregation
      const avail = (p.availability as string) || 'contact'
      availabilityCounts.set(avail, (availabilityCounts.get(avail) || 0) + 1)
    }

    // Transform paginated results
    const products = paginatedResults.docs.map((product) => {
      const p = product as unknown as Record<string, unknown>
      const brand = p.brand as Record<string, unknown> | null
      const category = p.primaryCategory as Record<string, unknown> | null
      const pricing = p.pricing as Record<string, unknown> | null
      const primaryImageObj = p.primaryImage && typeof p.primaryImage === 'object'
        ? p.primaryImage as Record<string, unknown>
        : null

      return {
        id: p.id,
        name: p.name,
        slug: p.slug,
        sku: p.sku,
        shortDescription: p.shortDescription,
        externalImageUrl: (primaryImageObj?.url as string) || p.externalImageUrl,
        brand: brand ? { name: brand.name, slug: brand.slug } : null,
        category: category ? { name: category.name, slug: category.slug } : null,
        pricing: pricing ? {
          basePrice: pricing.basePrice,
          currency: pricing.currency || 'USD',
          priceUnit: pricing.priceUnit,
        } : null,
        availability: p.availability,
        purchaseMode: p.purchaseMode || 'both',
      }
    })

    return NextResponse.json({
      products,
      facets: {
        brands: Array.from(brandCounts.values()).sort((a, b) => b.count - a.count),
        categories: Array.from(categoryCounts.values()).sort((a, b) => b.count - a.count),
        priceRange: { min: priceMin === Infinity ? 0 : priceMin, max: priceMax },
        availability: Array.from(availabilityCounts.entries()).map(([value, count]) => ({ value, count })),
      },
      totalDocs: paginatedResults.totalDocs,
      totalPages: paginatedResults.totalPages,
      page: paginatedResults.page,
      hasNextPage: paginatedResults.hasNextPage,
      hasPrevPage: paginatedResults.hasPrevPage,
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
