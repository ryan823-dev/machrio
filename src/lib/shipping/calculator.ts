import { getPayload } from 'payload'
import config from '@payload-config'

export interface ShippingItem {
  productId: string
  quantity: number
}

export interface ShippingMethodQuote {
  code: string
  name: string
  transitDays: number
  estimatedDeliveryDate: string
  cost: number
  breakdown: {
    baseWeight: number
    baseRate: number
    overageWeight: number
    additionalRate: number
    overageCost: number
    handlingFee: number
  }
  isFreeShipping: boolean
  freeShippingThreshold?: number
  gapToFreeShipping?: number
}

export interface ShippingCalculationResult {
  success: boolean
  country: string
  totalWeight: number
  maxProcessingTime: number
  estimatedShipDate: string
  methods: ShippingMethodQuote[]
  warnings: string[]
  error?: string
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date)
  result.setDate(result.getDate() + days)
  return result
}

function formatDate(date: Date): string {
  return date.toISOString().split('T')[0]
}

export async function calculateShipping(
  items: ShippingItem[],
  country: string,
  subtotal: number,
): Promise<ShippingCalculationResult> {
  const warnings: string[] = []

  try {
    const payload = await getPayload({ config })

    // 1. Fetch product weights and processing times
    let totalWeight = 0
    let maxProcessingTime = 3 // default
    let missingWeightCount = 0

    for (const item of items) {
      try {
        const product = await payload.findByID({
          collection: 'products',
          id: item.productId,
          depth: 0,
        })

        const p = product as unknown as Record<string, unknown>
        const shippingInfo = p.shippingInfo as Record<string, unknown> | undefined

        const weight = (shippingInfo?.weight as number) || 0
        const processingTime = (shippingInfo?.processingTime as number) ?? 3

        if (weight === 0) {
          missingWeightCount++
        }

        totalWeight += weight * item.quantity
        maxProcessingTime = Math.max(maxProcessingTime, processingTime)
      } catch {
        warnings.push(`Could not fetch product ${item.productId}`)
      }
    }

    if (missingWeightCount > 0) {
      warnings.push(`${missingWeightCount} product(s) have no weight configured, shipping estimate may be inaccurate`)
    }

    // 2. Calculate dates
    const now = new Date()
    const shipDate = addDays(now, maxProcessingTime)

    // 3. Fetch active shipping methods
    const methodsResult = await payload.find({
      collection: 'shipping-methods',
      where: { isActive: { equals: true } },
      sort: 'sortOrder',
      limit: 10,
      depth: 0,
    })

    if (methodsResult.docs.length === 0) {
      return {
        success: false,
        country,
        totalWeight,
        maxProcessingTime,
        estimatedShipDate: formatDate(shipDate),
        methods: [],
        warnings,
        error: 'No shipping methods available',
      }
    }

    // 4. Fetch free shipping rules
    const freeShippingResult = await payload.find({
      collection: 'free-shipping-rules',
      where: { isActive: { equals: true } },
      limit: 50,
      depth: 1,
    })

    // 5. Calculate cost for each method
    const methodQuotes: ShippingMethodQuote[] = []

    for (const method of methodsResult.docs) {
      const m = method as unknown as Record<string, unknown>
      const methodId = m.id as string
      const methodCode = m.code as string
      const methodName = m.name as string
      const transitDays = m.transitDays as number

      // Look up rate: first try exact country, then fallback to OTHER
      let rate = await findRate(payload, methodId, country)
      if (!rate) {
        rate = await findRate(payload, methodId, 'OTHER')
      }

      if (!rate) {
        // No rate found for this method + country
        continue
      }

      const baseWeight = (rate.baseWeight as number) || 0
      const baseRate = (rate.baseRate as number) || 0
      const additionalRate = (rate.additionalRate as number) || 0
      const handlingFee = (rate.handlingFee as number) || 0

      const overageWeight = Math.max(0, totalWeight - baseWeight)
      const overageCost = overageWeight * additionalRate
      let cost = baseRate + overageCost + handlingFee

      // Round to 2 decimal places
      cost = Math.round(cost * 100) / 100

      // Check free shipping
      let isFreeShipping = false
      let freeShippingThreshold: number | undefined
      let gapToFreeShipping: number | undefined

      const matchingRule = findFreeShippingRule(freeShippingResult.docs, methodId, country)
      if (matchingRule) {
        const threshold = (matchingRule as unknown as Record<string, unknown>).minimumAmount as number
        freeShippingThreshold = threshold
        if (subtotal >= threshold) {
          isFreeShipping = true
          cost = 0
        } else {
          gapToFreeShipping = Math.round((threshold - subtotal) * 100) / 100
        }
      }

      const deliveryDate = addDays(shipDate, transitDays)

      methodQuotes.push({
        code: methodCode,
        name: methodName,
        transitDays,
        estimatedDeliveryDate: formatDate(deliveryDate),
        cost,
        breakdown: {
          baseWeight,
          baseRate,
          overageWeight,
          additionalRate,
          overageCost: Math.round(overageCost * 100) / 100,
          handlingFee,
        },
        isFreeShipping,
        freeShippingThreshold,
        gapToFreeShipping,
      })
    }

    // Sort by cost ascending
    methodQuotes.sort((a, b) => a.cost - b.cost)

    return {
      success: true,
      country,
      totalWeight: Math.round(totalWeight * 1000) / 1000,
      maxProcessingTime,
      estimatedShipDate: formatDate(shipDate),
      methods: methodQuotes,
      warnings,
    }
  } catch (err) {
    return {
      success: false,
      country,
      totalWeight: 0,
      maxProcessingTime: 3,
      estimatedShipDate: formatDate(addDays(new Date(), 3)),
      methods: [],
      warnings,
      error: err instanceof Error ? err.message : 'Shipping calculation failed',
    }
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function findRate(payload: any, methodId: string, countryCode: string) {
  const result = await payload.find({
    collection: 'shipping-rates',
    where: {
      and: [
        { shippingMethod: { equals: methodId } },
        { countryCode: { equals: countryCode } },
        { isActive: { equals: true } },
      ],
    },
    limit: 1,
    depth: 0,
  })
  return result.docs.length > 0 ? (result.docs[0] as unknown as Record<string, unknown>) : null
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function findFreeShippingRule(rules: any[], methodId: string, country: string) {
  // First try country-specific rule
  const countryRule = rules.find((r) => {
    const rule = r as unknown as Record<string, unknown>
    const ruleMethod = rule.shippingMethod as Record<string, unknown> | string
    const ruleMethodId = typeof ruleMethod === 'string' ? ruleMethod : (ruleMethod?.id as string)
    return ruleMethodId === methodId && (rule.countryCode as string) === country
  })
  if (countryRule) return countryRule

  // Fallback to global rule (no countryCode or empty)
  const globalRule = rules.find((r) => {
    const rule = r as unknown as Record<string, unknown>
    const ruleMethod = rule.shippingMethod as Record<string, unknown> | string
    const ruleMethodId = typeof ruleMethod === 'string' ? ruleMethod : (ruleMethod?.id as string)
    return ruleMethodId === methodId && !rule.countryCode
  })
  return globalRule || null
}
