import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const start = Date.now()
    const payload = await getPayload({ config })
    const initTime = Date.now() - start

    // Simple count query
    const startQuery = Date.now()
    const result = await payload.find({
      collection: 'products',
      limit: 1,
    })
    const queryTime = Date.now() - startQuery

    return NextResponse.json({
      initTime,
      queryTime,
      productCount: result.totalDocs,
      firstProduct: result.docs[0]?.name || 'none',
    })
  } catch (error) {
    return NextResponse.json({
      error: String(error),
      stack: error instanceof Error ? error.stack : undefined,
    }, { status: 500 })
  }
}
