import { NextResponse } from 'next/server'
import { calculateShipping } from '@/lib/shipping/calculator'

export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { items, country, subtotal } = body

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Items array is required' }, { status: 400 })
    }

    if (!country || typeof country !== 'string') {
      return NextResponse.json({ error: 'Country code is required' }, { status: 400 })
    }

    const result = await calculateShipping(items, country, subtotal || 0)

    return NextResponse.json(result)
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal server error' },
      { status: 500 },
    )
  }
}
