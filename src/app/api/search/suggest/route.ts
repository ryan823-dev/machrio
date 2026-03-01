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
  const query = request.nextUrl.searchParams.get('q')?.trim()

  if (!query || query.length < 2) {
    return NextResponse.json({ products: [], categories: [], brands: [] })
  }

  try {
    const payload = await getPayload({ config })
    const searchTerms = getSearchVariants(query)

    // Build product search conditions
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const productConditions: any[] = []
    for (const term of searchTerms) {
      productConditions.push({ name: { contains: term } })
      productConditions.push({ sku: { contains: term } })
      productConditions.push({ shortDescription: { contains: term } })
    }

    // Run all three queries in parallel
    const [productResults, categoryResults, brandResults] = await Promise.all([
      // Products: top 4
      payload.find({
        collection: 'products',
        where: {
          and: [
            { status: { equals: 'published' } },
            { or: productConditions },
          ],
        },
        limit: 4,
        sort: '-createdAt',
        depth: 1,
      }),
      // Categories: top 3 matching by name
      payload.find({
        collection: 'categories',
        where: {
          or: searchTerms.map(term => ({ name: { contains: term } })),
        },
        limit: 3,
        sort: 'displayOrder',
      }),
      // Brands: top 2 matching by name
      payload.find({
        collection: 'brands',
        where: {
          or: searchTerms.map(term => ({ name: { contains: term } })),
        },
        limit: 2,
      }),
    ])

    // Map products
    const products = productResults.docs.map((doc) => {
      const p = doc as unknown as Record<string, unknown>
      const category = p.primaryCategory as Record<string, unknown> | null
      const pricing = p.pricing as Record<string, unknown> | null
      const brand = p.brand as Record<string, unknown> | null
      return {
        name: p.name as string,
        slug: p.slug as string,
        categorySlug: (category?.slug as string) || 'products',
        sku: p.sku as string,
        imageUrl: (p.externalImageUrl as string) || null,
        price: (pricing?.basePrice as number) || null,
        currency: (pricing?.currency as string) || 'USD',
        brand: brand ? (brand.name as string) : null,
      }
    })

    // Map categories with product counts
    const categories = await Promise.all(
      categoryResults.docs.map(async (doc) => {
        const cat = doc as unknown as Record<string, unknown>
        let productCount = 0
        try {
          // Count products in this category and its children
          const children = await payload.find({
            collection: 'categories',
            where: { parent: { equals: cat.id } },
            limit: 100,
          })
          const allIds = [cat.id as string, ...children.docs.map(c => c.id)]
          const count = await payload.count({
            collection: 'products',
            where: {
              primaryCategory: { in: allIds },
              status: { equals: 'published' },
            },
          })
          productCount = count.totalDocs
        } catch { /* ignore */ }
        return {
          name: cat.name as string,
          slug: cat.slug as string,
          productCount,
        }
      })
    )

    // Map brands
    const brands = brandResults.docs.map((doc) => {
      const b = doc as unknown as Record<string, unknown>
      return {
        name: b.name as string,
        slug: b.slug as string,
      }
    })

    return NextResponse.json({ products, categories, brands })
  } catch (error) {
    console.error('Suggest error:', error)
    return NextResponse.json({ products: [], categories: [], brands: [] })
  }
}
