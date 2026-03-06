import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'

/**
 * GET /api/smart-recommend?productId=xxx&cartProductIds=a,b,c&limit=8
 * 
 * Multi-dimensional intelligent recommendation engine:
 * 1. Cross-category in same industry (配套推荐)
 * 2. Same certification/compliance (合规配套)
 * 3. Cart context awareness (购物车场景推断)
 * 
 * Returns products with recommendation reasons.
 */
export async function GET(req: NextRequest) {
  try {
    const productId = req.nextUrl.searchParams.get('productId')
    const cartProductIds = req.nextUrl.searchParams.get('cartProductIds')?.split(',').filter(Boolean) || []
    const limit = Math.min(parseInt(req.nextUrl.searchParams.get('limit') || '8', 10), 12)

    if (!productId) {
      return NextResponse.json({ error: 'productId is required' }, { status: 400 })
    }

    const payload = await getPayload({ config })

    // Fetch the source product with full data
    const sourceProduct = await payload.findByID({
      collection: 'products',
      id: productId,
      depth: 2,
    }) as any

    if (!sourceProduct) {
      return NextResponse.json({ products: [] })
    }

    const sourceIndustries: string[] = sourceProduct.industries || []
    const sourceCategoryId = typeof sourceProduct.primaryCategory === 'object'
      ? sourceProduct.primaryCategory?.id
      : sourceProduct.primaryCategory
    const sourceBrandId = typeof sourceProduct.brand === 'object'
      ? sourceProduct.brand?.id
      : sourceProduct.brand
    const sourceFacets = sourceProduct.facets || {}
    const sourceSpecs: Array<{ label: string; value: string }> = sourceProduct.specifications || []
    // Extract materials and certifications from specifications as fallback
    const sourceMaterials: string[] = sourceFacets.material || 
      sourceSpecs.filter((s: any) => /material/i.test(s.label)).map((s: any) => s.value).filter(Boolean)
    const sourceCertifications: string[] = sourceFacets.certification || 
      sourceSpecs.filter((s: any) => /certif|standard|rating/i.test(s.label)).map((s: any) => s.value).filter(Boolean)

    const excludeIds = new Set<string>([productId, ...cartProductIds])
    const results: Array<{
      product: any
      score: number
      reasons: string[]
    }> = []
    const seenIds = new Set<string>([...excludeIds])

    // --- Dimension 1: Cross-category, same industry (配套推荐) ---
    // Find products in DIFFERENT categories but SAME industries
    if (sourceIndustries.length > 0 && sourceCategoryId) {
      const crossCategory = await payload.find({
        collection: 'products',
        where: {
          status: { equals: 'published' },
          id: { not_in: [...seenIds] },
          industries: { in: sourceIndustries },
          primaryCategory: { not_equals: sourceCategoryId },
        } as any,
        limit: 20,
        depth: 1,
      })

      for (const p of crossCategory.docs) {
        const prod = p as any
        if (seenIds.has(prod.id)) continue
        seenIds.add(prod.id)

        const sharedIndustries = (prod.industries || []).filter((i: string) => sourceIndustries.includes(i))
        const industryLabel = sharedIndustries.map(formatIndustry).join(', ')

        results.push({
          product: prod,
          score: 30 + sharedIndustries.length * 10,
          reasons: [`Commonly used together in ${industryLabel}`],
        })
      }
    }

    // --- Dimension 2: Same certification (合规配套) ---
    if (sourceCertifications.length > 0) {
      const sameCert = await payload.find({
        collection: 'products',
        where: {
          status: { equals: 'published' },
          id: { not_in: [...seenIds] },
          'facets.certification': { in: sourceCertifications },
        } as any,
        limit: 10,
        depth: 1,
      })

      for (const p of sameCert.docs) {
        const prod = p as any
        if (seenIds.has(prod.id)) continue
        seenIds.add(prod.id)

        const sharedCerts = (prod.facets?.certification || []).filter((c: string) => sourceCertifications.includes(c))
        results.push({
          product: prod,
          score: 25 + sharedCerts.length * 5,
          reasons: [`Meets same ${sharedCerts.join(', ')} standards`],
        })
      }
    }

    // --- Dimension 3: Same material (工艺兼容) ---
    if (sourceMaterials.length > 0) {
      const sameMaterial = await payload.find({
        collection: 'products',
        where: {
          status: { equals: 'published' },
          id: { not_in: [...seenIds] },
          'facets.material': { in: sourceMaterials },
          primaryCategory: { not_equals: sourceCategoryId || '' },
        } as any,
        limit: 10,
        depth: 1,
      })

      for (const p of sameMaterial.docs) {
        const prod = p as any
        if (seenIds.has(prod.id)) continue
        seenIds.add(prod.id)

        results.push({
          product: prod,
          score: 15,
          reasons: [`Compatible ${sourceMaterials[0]} material`],
        })
      }
    }

    // --- Dimension 4: Cart context (购物车场景推断) ---
    if (cartProductIds.length > 0) {
      // Fetch cart products to understand the "scene"
      const cartProducts = await payload.find({
        collection: 'products',
        where: {
          id: { in: cartProductIds },
          status: { equals: 'published' },
        },
        limit: 20,
        depth: 1,
      })

      // Aggregate industries and categories from cart
      const cartIndustries = new Set<string>()
      const cartCategories = new Set<string>()
      for (const cp of cartProducts.docs) {
        const prod = cp as any
        ;(prod.industries || []).forEach((i: string) => cartIndustries.add(i))
        const catId = typeof prod.primaryCategory === 'object'
          ? prod.primaryCategory?.id
          : prod.primaryCategory
        if (catId) cartCategories.add(catId)
      }

      // Find products in same industries but different categories (fill gaps)
      if (cartIndustries.size > 0) {
        const cartComplement = await payload.find({
          collection: 'products',
          where: {
            status: { equals: 'published' },
            id: { not_in: [...seenIds] },
            industries: { in: [...cartIndustries] },
            primaryCategory: { not_in: [...cartCategories] },
          } as any,
          limit: 10,
          depth: 1,
        })

        for (const p of cartComplement.docs) {
          const prod = p as any
          if (seenIds.has(prod.id)) continue
          seenIds.add(prod.id)

          results.push({
            product: prod,
            score: 35,
            reasons: ['Complements items in your cart'],
          })
        }
      }
    }

    // Sort by score and take top N
    results.sort((a, b) => b.score - a.score)
    const topResults = results.slice(0, limit)

    // Map to response
    const products = topResults.map(({ product: prod, reasons }) => {
      const pricing = prod.pricing || {}
      const catObj = prod.primaryCategory && typeof prod.primaryCategory === 'object'
        ? prod.primaryCategory : null
      const primaryImageObj = prod.primaryImage && typeof prod.primaryImage === 'object'
        ? prod.primaryImage : null

      return {
        id: prod.id,
        name: prod.name,
        slug: prod.slug,
        categorySlug: catObj?.slug || 'products',
        sku: prod.sku,
        imageUrl: primaryImageObj?.url || prod.externalImageUrl || undefined,
        price: pricing.basePrice,
        currency: pricing.currency || 'USD',
        reasons,
      }
    })

    return NextResponse.json({ products })
  } catch (error) {
    console.error('Smart recommend error:', error)
    return NextResponse.json({ error: 'Failed to get recommendations' }, { status: 500 })
  }
}

function formatIndustry(code: string): string {
  const map: Record<string, string> = {
    manufacturing: 'Manufacturing',
    construction: 'Construction',
    automotive: 'Automotive',
    healthcare: 'Healthcare',
    'food-beverage': 'Food & Beverage',
    warehouse: 'Warehouse & Logistics',
    'oil-gas': 'Oil & Gas',
    mining: 'Mining',
  }
  return map[code] || code
}
