import { NextRequest, NextResponse } from 'next/server'
import {
  getOrdersContainingProduct,
  getProductById,
  getCategoryById,
} from '@/lib/db'

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

    // Find orders that contain this product
    const ordersWithProduct = await getOrdersContainingProduct(productId, 200)

    if (ordersWithProduct.length === 0) {
      return NextResponse.json({ products: [], orderCount: 0 })
    }

    // Count co-occurrence of other products in these orders
    const productCounts: Map<string, { count: number; productData: any }> = new Map()

    for (const order of ordersWithProduct) {
      const items = order.items as any[] || []

      for (const item of items) {
        // Get product ID from item
        const prodId = typeof item.product === 'object'
          ? item.product?.id
          : item.product

        if (!prodId) continue
        if (String(prodId) === productId) continue

        const idStr = String(prodId)

        // Store basic product info from order item snapshot
        const existing = productCounts.get(idStr)
        if (existing) {
          existing.count++
        } else {
          productCounts.set(idStr, {
            count: 1,
            productData: {
              id: idStr,
              name: item.productName,
              sku: item.sku,
              unitPrice: item.unitPrice,
            }
          })
        }
      }
    }

    // Sort by frequency and take top N
    const sorted = [...productCounts.values()]
      .sort((a, b) => b.count - a.count)
      .slice(0, limit)

    // Enhance with current product data from database
    const products = await Promise.all(sorted.map(async ({ count, productData }) => {
      // Try to get full product data
      const fullProduct = await getProductById(productData.id)

      const pricing = fullProduct?.pricing as Record<string, unknown> | undefined || {}
      let categorySlug = 'products'

      if (fullProduct?.primary_category_id) {
        const cat = await getCategoryById(fullProduct.primary_category_id)
        categorySlug = cat?.slug || 'products'
      }

      return {
        id: fullProduct?.id || productData.id,
        name: fullProduct?.name || productData.name,
        slug: fullProduct?.slug || productData.sku?.toLowerCase(),
        categorySlug,
        sku: fullProduct?.sku || productData.sku,
        imageUrl: fullProduct?.external_image_url || undefined,
        price: pricing.basePrice as number | undefined || productData.unitPrice,
        currency: (pricing.currency as string) || 'USD',
        coOccurrence: count,
      }
    }))

    // Filter out products that couldn't be found
    const validProducts = products.filter(p => p.id && p.name)

    return NextResponse.json({
      products: validProducts,
      orderCount: ordersWithProduct.length,
    })
  } catch (error) {
    console.error('Error fetching bought-together:', error)
    return NextResponse.json(
      { error: 'Failed to fetch recommendations' },
      { status: 500 }
    )
  }
}