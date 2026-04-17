import {
  getPool,
  getShippingMethods,
  getShippingRates,
  getFreeShippingRules,
  getProductShippingInfo
} from '@/lib/db'

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

function toNumber(value: unknown): number {
  const parsed = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(parsed) ? parsed : 0
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
    // 1. Fetch product weights and processing times
    let totalWeight = 0
    let maxProcessingTime = 3 // default
    let missingWeightCount = 0

    for (const item of items) {
      try {
        const shippingInfo = await getProductShippingInfo(item.productId)

        if (shippingInfo) {
          const weight = shippingInfo.weight || 0
          const processingTime = shippingInfo.processingTime ?? 3

          if (weight === 0) {
            missingWeightCount++
          }

          totalWeight += weight * item.quantity
          maxProcessingTime = Math.max(maxProcessingTime, processingTime)
        }
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
    const methods = await getShippingMethods()

    if (methods.length === 0) {
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

    // 4. Fetch all rates and free shipping rules
    const [allRates, freeShippingRules] = await Promise.all([
      getShippingRates(),
      getFreeShippingRules(),
    ])

    // 5. Calculate cost for each method
    const methodQuotes: ShippingMethodQuote[] = []

    for (const method of methods) {
      // Look up rate: first try exact country, then fallback to OTHER
      let rate = allRates.find(r =>
        r.shipping_method_id === method.id && r.country_code === country
      )
      if (!rate) {
        rate = allRates.find(r =>
          r.shipping_method_id === method.id && r.country_code === 'OTHER'
        )
      }

      if (!rate) {
        // No rate found for this method + country
        continue
      }

      const baseWeight = toNumber(rate.base_weight)
      const baseRate = toNumber(rate.base_rate)
      const additionalRate = toNumber(rate.additional_rate)
      const handlingFee = toNumber(rate.handling_fee)

      const overageWeight = Math.max(0, totalWeight - baseWeight)
      const overageCost = overageWeight * additionalRate
      let cost = baseRate + overageCost + handlingFee

      // Round to 2 decimal places
      cost = Math.round(cost * 100) / 100

      // Check free shipping
      let isFreeShipping = false
      let freeShippingThreshold: number | undefined
      let gapToFreeShipping: number | undefined

      const matchingRule = freeShippingRules.find(rule =>
        rule.shipping_method_id === method.id &&
        (rule.country_code === country || !rule.country_code)
      )

      if (matchingRule) {
        const threshold = toNumber(matchingRule.minimum_amount)
        freeShippingThreshold = threshold
        if (subtotal >= threshold) {
          isFreeShipping = true
          cost = 0
        } else {
          gapToFreeShipping = Math.round((threshold - subtotal) * 100) / 100
        }
      }

      const deliveryDate = addDays(shipDate, method.transit_days)

      methodQuotes.push({
        code: method.code,
        name: method.name,
        transitDays: method.transit_days,
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
