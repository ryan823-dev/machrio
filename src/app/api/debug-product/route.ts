import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const payload = await getPayload({ config })

    // Try to find a product
    const result = await payload.find({
      collection: 'products',
      where: {
        slug: { equals: 'single-pole-miniature-breaker-lockout-nylon-one-size-pkg-qty-400-6528' },
      },
      limit: 1,
    })

    if (result.docs.length > 0) {
      return NextResponse.json({
        found: true,
        product: {
          id: result.docs[0].id,
          name: result.docs[0].name,
          slug: result.docs[0].slug,
          status: result.docs[0].status,
        }
      })
    } else {
      // Try without status filter
      const allResult = await payload.find({
        collection: 'products',
        limit: 3,
      })
      return NextResponse.json({
        found: false,
        message: 'Product not found with exact slug',
        sampleProducts: allResult.docs.map(p => ({
          id: p.id,
          name: p.name,
          slug: p.slug,
          status: p.status,
        }))
      })
    }
  } catch (error) {
    return NextResponse.json({
      error: String(error),
      message: 'Payload query failed'
    }, { status: 500 })
  }
}
