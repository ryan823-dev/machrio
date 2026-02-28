import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'

/**
 * POST /api/product-views/track
 * Records a product view event for collaborative filtering
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { productId, sessionId, referrer } = body

    if (!productId || !sessionId) {
      return NextResponse.json(
        { error: 'productId and sessionId are required' },
        { status: 400 }
      )
    }

    const payload = await getPayload({ config })

    // Check if this session already viewed this product recently (within 1 hour)
    const recentView = await (payload.find as any)({
      collection: 'productViews',
      where: {
        product: { equals: productId },
        sessionId: { equals: sessionId },
        viewedAt: { greater_than: new Date(Date.now() - 60 * 60 * 1000).toISOString() },
      },
      limit: 1,
    })

    // Skip duplicate within 1 hour
    if (recentView.docs.length > 0) {
      return NextResponse.json({ success: true, duplicate: true })
    }

    // Record the view
    await (payload.create as any)({
      collection: 'productViews',
      data: {
        product: productId,
        sessionId,
        viewedAt: new Date().toISOString(),
        referrer: referrer || null,
        userAgent: req.headers.get('user-agent') || null,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error tracking product view:', error)
    return NextResponse.json(
      { error: 'Failed to track view' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/product-views/also-viewed?productId=xxx
 * Returns products frequently viewed together with the given product
 */
export async function GET(req: NextRequest) {
  try {
    const productId = req.nextUrl.searchParams.get('productId')
    const limit = parseInt(req.nextUrl.searchParams.get('limit') || '6', 10)

    if (!productId) {
      return NextResponse.json(
        { error: 'productId is required' },
        { status: 400 }
      )
    }

    const payload = await getPayload({ config })

    // Find sessions that viewed this product in the last 30 days
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
    
    const viewsOfProduct = await (payload.find as any)({
      collection: 'productViews',
      where: {
        product: { equals: productId },
        viewedAt: { greater_than: thirtyDaysAgo },
      },
      limit: 500,
    })

    if (viewsOfProduct.docs.length === 0) {
      return NextResponse.json({ products: [] })
    }

    // Get unique session IDs
    const sessionIds = [...new Set(viewsOfProduct.docs.map((v: any) => v.sessionId))]

    // Find other products viewed by these sessions
    const otherViews = await (payload.find as any)({
      collection: 'productViews',
      where: {
        sessionId: { in: sessionIds },
        product: { not_equals: productId },
        viewedAt: { greater_than: thirtyDaysAgo },
      },
      limit: 1000,
      depth: 2,
    })

    // Count product occurrences
    const productCounts: Map<string, { count: number; product: any }> = new Map()
    
    for (const view of otherViews.docs) {
      const prod = view.product
      if (!prod || typeof prod !== 'object') continue
      
      const id = prod.id as string
      if (prod.status !== 'published') continue
      
      const existing = productCounts.get(id)
      if (existing) {
        existing.count++
      } else {
        productCounts.set(id, { count: 1, product: prod })
      }
    }

    // Sort by count and take top N
    const sorted = [...productCounts.values()]
      .sort((a, b) => b.count - a.count)
      .slice(0, limit)

    // Map to response format
    const products = sorted.map(({ product: prod }) => {
      const pricing = prod.pricing as Record<string, unknown> | undefined
      const catObj = prod.primaryCategory && typeof prod.primaryCategory === 'object'
        ? prod.primaryCategory as Record<string, unknown>
        : null
      const primaryImageObj = prod.primaryImage && typeof prod.primaryImage === 'object'
        ? prod.primaryImage as Record<string, unknown>
        : null

      return {
        id: prod.id,
        name: prod.name,
        slug: prod.slug,
        categorySlug: (catObj?.slug as string) || 'products',
        sku: prod.sku,
        imageUrl: (primaryImageObj?.url as string) || (prod.externalImageUrl as string) || undefined,
        price: pricing?.basePrice as number | undefined,
        currency: (pricing?.currency as string) || 'USD',
      }
    })

    return NextResponse.json({ products })
  } catch (error) {
    console.error('Error fetching also-viewed products:', error)
    return NextResponse.json(
      { error: 'Failed to fetch recommendations' },
      { status: 500 }
    )
  }
}
