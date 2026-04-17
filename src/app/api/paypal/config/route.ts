import { NextResponse } from 'next/server'
import { isPayPalConfigured } from '@/lib/paypal'

export const dynamic = 'force-dynamic'

export async function GET() {
  return NextResponse.json({
    configured: isPayPalConfigured(),
  })
}
