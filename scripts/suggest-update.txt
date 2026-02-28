import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'

// Simple stemming: generate singular/plural variants
function getSearchVariants(query: string): string[] {
  const variants = [query]
  const lower = query.toLowerCase()
  
  // If ends with 'ies', try replacing with 'y'
  if (lower.endsWith('ies') && query.length > 4) {
    variants.push(query.slice(0, -3) + 'y')
  }
  // If ends with 'es', try removing 'es'
  else if (lower.endsWith('es') && query.length > 3) {
    variants.push(query.slice(0, -2))
  }
  // If ends with 's', try removing 's'
  if (lower.endsWith('s') && query.length > 2) {
    variants.push(query.slice(0, -1))
  }
  // If singular, also try plural
  if (!lower.endsWith('s')) {
    variants.push(query + 's')
  }
  
  return [...new Set(variants)]
}

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get('q')?.trim()
  
  if (!query || query.length < 2) {
    return NextResponse.json({ suggestions: [] })
  }

  try {
    const payload = await getPayload({ config })
    
    // Get search variants for plural/singular handling
    const searchTerms = getSearchVariants(query)
    
    // Build OR conditions - use explicit type
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const searchConditions: any[] = []
    for (const term of searchTerms) {
      searchConditions.push({ name: { contains: term } })
      searchConditions.push({ sku: { contains: term } })
    }
    
    const results = await payload.find({
      collection: 'products',
      where: {
        or: searchConditions,
      },
      limit: 6,
      sort: '-createdAt',
      depth: 1,
    })

    const suggestions = results.docs.map((doc) => {
      const p = doc as unknown as Record<string, unknown>
      const category = p.primaryCategory as Record<string, unknown> | null
      const pricing = p.pricing as Record<string, unknown> | null
      return {
        name: p.name,
        slug: p.slug,
        categorySlug: category?.slug || 'products',
        sku: p.sku,
        imageUrl: p.externalImageUrl || null,
        price: pricing?.basePrice || null,
        currency: (pricing?.currency as string) || 'USD',
      }
    })

    return NextResponse.json({ suggestions })
  } catch (error) {
    console.error('Suggest error:', error)
    return NextResponse.json({ suggestions: [] })
  }
}
