import type { Metadata } from 'next'
import Link from 'next/link'

// 完全静态生成，构建时生成 HTML
export const dynamic = 'force-static'

export const metadata: Metadata = {
  title: 'Volume Pricing & Bulk Discounts | Machrio',
  description: 'Save more when you buy more. Machrio offers tiered volume pricing on all industrial products. See how our bulk discount tiers work.',
  alternates: { canonical: '/deals/' },
  openGraph: {
    title: 'Volume Pricing & Bulk Discounts | Machrio',
    description: 'Save more when you buy more. Machrio offers tiered volume pricing on all industrial products.',
  },
}

export default function DealsPage() {
  return (
    <div className="container-main py-12">
      <h1 className="text-3xl font-bold text-secondary-900">Volume Pricing & Bulk Discounts</h1>
      <p className="mt-2 max-w-2xl text-secondary-600">
        At Machrio, the more you buy, the more you save. Every product features transparent tiered pricing — no hidden fees, no negotiation needed.
      </p>

      {/* How it works */}
      <section className="mt-10">
        <h2 className="text-xl font-semibold text-secondary-800">How Volume Pricing Works</h2>
        <div className="mt-6 grid gap-6 md:grid-cols-3">
          <div className="rounded-lg border border-secondary-200 bg-white p-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-100 text-lg font-bold text-primary-700">1</div>
            <h3 className="mt-3 font-semibold text-secondary-800">Browse Products</h3>
            <p className="mt-1 text-sm text-secondary-600">
              Find the products you need. Each product page shows volume discount tiers clearly.
            </p>
          </div>
          <div className="rounded-lg border border-secondary-200 bg-white p-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-100 text-lg font-bold text-primary-700">2</div>
            <h3 className="mt-3 font-semibold text-secondary-800">Check Tier Pricing</h3>
            <p className="mt-1 text-sm text-secondary-600">
              Volume discounts are shown on product pages. Typical savings: 5-15% depending on quantity.
            </p>
          </div>
          <div className="rounded-lg border border-secondary-200 bg-white p-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-100 text-lg font-bold text-primary-700">3</div>
            <h3 className="mt-3 font-semibold text-secondary-800">Order or Request Quote</h3>
            <p className="mt-1 text-sm text-secondary-600">
              Add to cart for instant checkout, or request a custom quote for large orders with even better pricing.
            </p>
          </div>
        </div>
      </section>

      {/* Example pricing table */}
      <section className="mt-10">
        <h2 className="text-xl font-semibold text-secondary-800">Example Pricing Tiers</h2>
        <p className="mt-1 text-sm text-secondary-500">Actual tiers vary by product. This is a typical example.</p>
        <div className="mt-4 overflow-hidden rounded-lg border border-secondary-200">
          <table className="w-full">
            <thead>
              <tr className="bg-secondary-50">
                <th className="px-4 py-3 text-left text-sm font-semibold text-secondary-700">Quantity</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-secondary-700">Unit Price</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-secondary-700">Savings</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-t border-secondary-100">
                <td className="px-4 py-3 text-sm text-secondary-700">1 – 9 units</td>
                <td className="px-4 py-3 text-sm font-medium text-secondary-800">$25.00 / ea</td>
                <td className="px-4 py-3 text-sm text-secondary-500">—</td>
              </tr>
              <tr className="border-t border-secondary-100 bg-secondary-50/50">
                <td className="px-4 py-3 text-sm text-secondary-700">10 – 49 units</td>
                <td className="px-4 py-3 text-sm font-medium text-secondary-800">$22.50 / ea</td>
                <td className="px-4 py-3 text-sm font-medium text-emerald-600">Save 10%</td>
              </tr>
              <tr className="border-t border-secondary-100">
                <td className="px-4 py-3 text-sm text-secondary-700">50 – 99 units</td>
                <td className="px-4 py-3 text-sm font-medium text-secondary-800">$21.25 / ea</td>
                <td className="px-4 py-3 text-sm font-medium text-emerald-600">Save 15%</td>
              </tr>
              <tr className="border-t border-secondary-100 bg-secondary-50/50">
                <td className="px-4 py-3 text-sm text-secondary-700">100+ units</td>
                <td className="px-4 py-3 text-sm font-medium text-secondary-800">Contact us</td>
                <td className="px-4 py-3 text-sm font-medium text-emerald-600">Best price</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* CTAs */}
      <section className="mt-10 grid gap-6 md:grid-cols-2">
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-6">
          <h3 className="text-lg font-semibold text-emerald-800">Browse Products</h3>
          <p className="mt-2 text-sm text-emerald-700">
            Explore our full catalog with transparent tiered pricing on every product page.
          </p>
          <Link href="/category" className="btn-primary mt-4 inline-block">
            Shop All Products
          </Link>
        </div>
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-6">
          <h3 className="text-lg font-semibold text-amber-800">Need a Custom Quote?</h3>
          <p className="mt-2 text-sm text-amber-700">
            For orders over 100 units or custom specifications, our team provides personalized pricing within 24 hours.
          </p>
          <Link href="/rfq" className="btn-accent mt-4 inline-block">
            Request a Quote
          </Link>
        </div>
      </section>

      {/* Additional info */}
      <section className="mt-10 rounded-lg border border-secondary-200 bg-white p-6">
        <h2 className="text-lg font-semibold text-secondary-800">Frequently Asked Questions</h2>
        <div className="mt-4 space-y-4">
          <div>
            <h3 className="text-sm font-medium text-secondary-800">Do I need to create an account for volume pricing?</h3>
            <p className="mt-1 text-sm text-secondary-600">No. Volume pricing is automatically applied based on quantity at checkout. No account needed.</p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-secondary-800">Can I mix different products for volume discounts?</h3>
            <p className="mt-1 text-sm text-secondary-600">Volume tiers apply per product SKU. For mixed-product bulk orders, request a custom quote for the best pricing.</p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-secondary-800">Is there a minimum order value?</h3>
            <p className="mt-1 text-sm text-secondary-600">No minimum order value. However, orders over $200 qualify for free shipping.</p>
          </div>
        </div>
      </section>
    </div>
  )
}
