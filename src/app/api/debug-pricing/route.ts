import { NextResponse } from 'next/server'
import { getPool } from '@/lib/db-queries'

export const dynamic = 'force-dynamic'

export async function GET() {
  const pool = getPool()
  
  try {
    // Check for products with tiered pricing
    const result = await pool.query(`
      SELECT slug, pricing
      FROM products
      WHERE status = 'published'
        AND pricing IS NOT NULL
      LIMIT 20
    `)
    
    const analysis = result.rows.map(row => {
      const pricing = row.pricing as Record<string, unknown> | null
      return {
        slug: row.slug?.substring(0, 50),
        hasTiered: pricing?.tieredPricing ? true : false,
        pricingKeys: pricing ? Object.keys(pricing) : [],
        samplePricing: pricing ? {
          basePrice: pricing.basePrice,
          priceUnit: pricing.priceUnit,
          hasTiered: !!pricing.tieredPricing,
          tieredCount: Array.isArray(pricing.tieredPricing) ? pricing.tieredPricing.length : 0
        } : null
      }
    })
    
    await pool.end()
    
    return NextResponse.json({
      analysis,
      total: result.rows.length
    })
  } catch (error) {
    await pool.end()
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
