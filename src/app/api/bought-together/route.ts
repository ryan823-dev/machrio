import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'

/**
 * GET /api/bought-together?productId=xxx&limit=4
 * Analyzes order history to find products frequently bought together
 */
export async function GET(req: NextRequest) {
  try {
    const productId = req.nextUrl.searchParams.get('productId')
    const limit = parseInt(req.nextUrl.searchParams.get('limit') || '4', 10)

    if (!productId) {
      return NextResponse.json(
        { error: 'productId is required' },
        { status: 400 }
      )
    }

    const payload = await getPayload({ config })

    // Find orders that contain this product (exclude cancelled/refunded)
    const ordersWithProduct = await payload.find({
      collection: 'orders',
      where: {
        'items.product': { equals: productId },
        status: { not_in: ['cancelled', 'refunded'] },
      },
      limit: 200,
      depth: 2,
    })

    if (ordersWithProduct.docs.length === 0) {
      return NextResponse.json({ products: [], orderCount: 0 })
    }

    // Count co-occurrence of other products in these orders
    const productCounts: Map<string, { count: number; product: any }> = new Map()

    for (const order of ordersWithProduct.docs) {
      const items = (order as any).items as any[] || []
      
      for (const item of items) {
        const prod = item.product
        if (!prod || typeof prod !== 'object') continue
        
        const id = prod.id as string
        if (id === productId) continue
        if (prod.status !== 'published') continue

        const existing = productCounts.get(id)
        if (existing) {
          existing.count++
        } else {
          productCounts.set(id, { count: 1, product: prod })
        }
      }
    }

    // Sort by frequency and take top N
    const sorted = [...productCounts.values()]
      .sort((a, b) => b.count - a.count)
      .slice(0, limit)

    const products = sorted.map(({ count, product: prod }) => {
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
        coOccurrence: count,
      }
    })

    return NextResponse.json({
      products,
      orderCount: ordersWithProduct.docs.length,
    })
  } catch (error) {
    console.error('Error fetching bought-together:', error)
    return NextResponse.json(
      { error: 'Failed to fetch recommendations' },
      { status: 500 }
    )
  }
}
