import { NextRequest, NextResponse } from 'next/server'
import { getPool, incrementProductViews, getProductViews } from '@/lib/db'

/**
 * POST /api/product-views
 * Records a product view event
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { productId } = body

    if (!productId) {
      return NextResponse.json(
        { error: 'productId is required' },
        { status: 400 }
      )
    }

    await incrementProductViews(productId)

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
 * GET /api/product-views?productId=xxx
 * Returns product view count
 */
export async function GET(req: NextRequest) {
  try {
    const productId = req.nextUrl.searchParams.get('productId')

    if (!productId) {
      return NextResponse.json(
        { error: 'productId is required' },
        { status: 400 }
      )
    }

    const viewCount = await getProductViews(productId)

    return NextResponse.json({ viewCount })
  } catch (error) {
    console.error('Error fetching product views:', error)
    return NextResponse.json(
      { error: 'Failed to fetch views' },
      { status: 500 }
    )
  }
}