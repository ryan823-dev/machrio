'use client'

interface PricingTier {
  minQty: number
  maxQty?: number
  unitPrice: number
}

interface TieredPricingTableProps {
  tiers: PricingTier[]
  basePrice: number
  currency?: string
  priceUnit?: string
}

export function TieredPricingTable({ tiers, basePrice, currency = 'USD', priceUnit }: TieredPricingTableProps) {
  if (!tiers || tiers.length === 0) return null

  // Calculate discount percentage for each tier
  const tiersWithDiscount = tiers.map(tier => ({
    ...tier,
    discount: basePrice > 0 ? Math.round((1 - tier.unitPrice / basePrice) * 100) : 0
  }))

  const currencySymbol = currency === 'USD' ? '$' : currency === 'CAD' ? 'C$' : '$'

  return (
    <div className="mt-4 overflow-hidden rounded-lg border border-primary-200 bg-primary-50/50">
      <div className="bg-primary-100 px-4 py-2">
        <h3 className="text-sm font-semibold text-primary-800 flex items-center gap-2">
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
          </svg>
          Volume Pricing - Buy More, Save More
        </h3>
      </div>
      <table className="w-full">
        <thead>
          <tr className="border-b border-primary-200 bg-white text-xs text-secondary-600">
            <th className="px-4 py-2 text-left font-medium">Quantity</th>
            <th className="px-4 py-2 text-center font-medium">Discount</th>
            <th className="px-4 py-2 text-right font-medium">Unit Price</th>
          </tr>
        </thead>
        <tbody>
          {tiersWithDiscount.map((tier, index) => (
            <tr 
              key={index} 
              className={`border-b border-primary-100 last:border-0 ${
                index === tiersWithDiscount.length - 1 ? 'bg-green-50' : 'bg-white'
              }`}
            >
              <td className="px-4 py-2.5 text-sm text-secondary-700">
                {tier.maxQty ? (
                  <span>{tier.minQty} - {tier.maxQty}</span>
                ) : (
                  <span className="font-medium text-green-700">{tier.minQty}+</span>
                )}
              </td>
              <td className="px-4 py-2.5 text-center">
                {tier.discount > 0 ? (
                  <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${
                    tier.discount >= 15 ? 'bg-green-100 text-green-700' :
                    tier.discount >= 10 ? 'bg-amber-100 text-amber-700' :
                    'bg-secondary-100 text-secondary-600'
                  }`}>
                    -{tier.discount}%
                  </span>
                ) : (
                  <span className="text-xs text-secondary-400">-</span>
                )}
              </td>
              <td className="px-4 py-2.5 text-right">
                <span className={`text-sm font-semibold ${
                  index === tiersWithDiscount.length - 1 ? 'text-green-700' : 'text-secondary-800'
                }`}>
                  {currencySymbol}{tier.unitPrice.toFixed(2)}
                </span>
                {priceUnit && (
                  <span className="text-xs text-secondary-500"> / {priceUnit}</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
