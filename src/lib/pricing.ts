export interface ParsedPricing {
  basePrice?: number
  priceUnit?: string
  currency?: string
  compareAtPrice?: number
  tieredPricing?: Array<{
    minQty: number
    maxQty?: number
    unitPrice: number
  }>
}

function parseFiniteNumber(value: unknown): number | undefined {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : undefined
  }

  if (typeof value === 'string') {
    const parsed = Number.parseFloat(value)
    return Number.isFinite(parsed) ? parsed : undefined
  }

  return undefined
}

export function parsePricing(pricing: unknown): ParsedPricing | null {
  if (!pricing) return null

  let pricingData = pricing

  if (typeof pricingData === 'string') {
    try {
      pricingData = JSON.parse(pricingData)
    } catch {
      return null
    }
  }

  if (!pricingData || typeof pricingData !== 'object') {
    return null
  }

  const rawPricing = pricingData as Record<string, unknown>
  const rawTieredPricing = Array.isArray(rawPricing.tieredPricing)
    ? rawPricing.tieredPricing
    : Array.isArray(rawPricing.tiered_pricing)
    ? rawPricing.tiered_pricing
    : undefined

  const tieredPricing = rawTieredPricing
    ?.map((tier) => {
      if (!tier || typeof tier !== 'object') return null

      const rawTier = tier as Record<string, unknown>
      const minQty = parseFiniteNumber(rawTier.minQty ?? rawTier.min_qty)
      const maxQty = parseFiniteNumber(rawTier.maxQty ?? rawTier.max_qty)
      const unitPrice = parseFiniteNumber(rawTier.unitPrice ?? rawTier.unit_price)

      if (minQty === undefined || unitPrice === undefined) {
        return null
      }

      return {
        minQty,
        ...(maxQty !== undefined ? { maxQty } : {}),
        unitPrice,
      }
    })
    .filter((tier): tier is NonNullable<typeof tier> => tier !== null)

  return {
    basePrice: parseFiniteNumber(rawPricing.basePrice ?? rawPricing.base_price),
    priceUnit: typeof (rawPricing.priceUnit ?? rawPricing.price_unit) === 'string'
      ? String(rawPricing.priceUnit ?? rawPricing.price_unit)
      : undefined,
    currency: typeof rawPricing.currency === 'string' ? rawPricing.currency : undefined,
    compareAtPrice: parseFiniteNumber(rawPricing.compareAtPrice ?? rawPricing.compare_at_price),
    tieredPricing: tieredPricing && tieredPricing.length > 0 ? tieredPricing : undefined,
  }
}
