import type { Metadata } from 'next'
import Link from 'next/link'
import { FREE_SHIPPING_THRESHOLD_USD, formatUsd } from '@/lib/shipping/rules'

// 完全静态生成，构建时生成 HTML
export const dynamic = 'force-static'

export const metadata: Metadata = {
  title: 'Shipping Policy | Machrio',
  description: 'Machrio shipping policy - DDP duty-free delivery, U.S. warehouse fast shipping, and global logistics options for industrial supplies.',
  alternates: { canonical: '/shipping-policy' },
  openGraph: {
    title: 'Shipping Policy | Machrio',
    description: 'Machrio shipping policy - DDP duty-free delivery, U.S. warehouse fast shipping, and global logistics options for industrial supplies.',
  },
}

export default function ShippingPolicyPage() {
  return (
    <div className="container-main pb-16 pt-8">
      <h1 className="text-3xl font-bold text-secondary-900">Shipping Policy</h1>
      <p className="mt-4 max-w-3xl text-sm leading-relaxed text-secondary-600">
        Machrio provides reliable global shipping for industrial supplies. Orders are typically
        processed within 1&ndash;3 business days after payment confirmation, and final delivery
        timing depends on your destination, total shipment weight, and the route selected at
        checkout.
      </p>

      <div className="mt-6 rounded-lg border border-blue-200 bg-blue-50 p-4">
        <p className="text-sm font-semibold text-blue-800">Shipping is calculated live at checkout.</p>
        <p className="mt-1 text-xs text-blue-700">
          Rates are based on shipment weight, destination, and the selected route. Orders over{' '}
          {formatUsd(FREE_SHIPPING_THRESHOLD_USD)} may qualify for free shipping on supported methods.
        </p>
      </div>

      <section className="mt-8 rounded-lg border border-secondary-200 bg-white p-6">
        <h2 className="text-xl font-semibold text-secondary-900">How Machrio Shipping Rates Work</h2>
        <div className="mt-4 space-y-3 text-sm leading-relaxed text-secondary-600">
          <p>
            Shipping is weight-based. The checkout system totals the weight of every item in your
            cart and then applies the destination-specific rate for the shipping method you choose.
          </p>
          <p>
            This means one unit and ten units will not produce the same shipping fee. Heavier or
            larger combined shipments will generate a higher quote unless a free-shipping threshold
            is met.
          </p>
          <p>
            Free shipping is applied automatically when the merchandise subtotal reaches{' '}
            {formatUsd(FREE_SHIPPING_THRESHOLD_USD)} or more on eligible shipping methods.
          </p>
        </div>
      </section>

      <section className="mt-10">
        <h2 className="text-xl font-semibold text-secondary-900">Shipping Options</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-secondary-200 bg-secondary-50">
                <th className="px-4 py-3 text-left font-medium text-secondary-700">Origin</th>
                <th className="px-4 py-3 text-left font-medium text-secondary-700">Delivery Time</th>
                <th className="px-4 py-3 text-left font-medium text-secondary-700">Duties &amp; Taxes</th>
                <th className="px-4 py-3 text-left font-medium text-secondary-700">Shipping Fee Model</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-secondary-100">
              <tr>
                <td className="px-4 py-3 font-medium text-secondary-800">U.S. Warehouse</td>
                <td className="px-4 py-3 text-secondary-600">2&ndash;7 business days</td>
                <td className="px-4 py-3">
                  <span className="rounded bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-700">Included</span>
                </td>
                <td className="px-4 py-3 text-secondary-600">
                  Live quote at checkout, based on route setup and shipment weight.
                </td>
              </tr>
              <tr>
                <td className="px-4 py-3 font-medium text-secondary-800">China &mdash; DDP Air</td>
                <td className="px-4 py-3 text-secondary-600">6&ndash;15 business days</td>
                <td className="px-4 py-3">
                  <span className="rounded bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-700">Included</span>
                </td>
                <td className="px-4 py-3 text-secondary-600">
                  Live quote at checkout, typically built from base freight plus weight overage.
                </td>
              </tr>
              <tr>
                <td className="px-4 py-3 font-medium text-secondary-800">China &mdash; DDP Sea</td>
                <td className="px-4 py-3 text-secondary-600">20&ndash;35 business days</td>
                <td className="px-4 py-3">
                  <span className="rounded bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-700">Included</span>
                </td>
                <td className="px-4 py-3 text-secondary-600">
                  Live quote at checkout, optimized for heavier international shipments.
                </td>
              </tr>
              <tr>
                <td className="px-4 py-3 font-medium text-secondary-800">Express Courier</td>
                <td className="px-4 py-3 text-secondary-600">3&ndash;10 business days</td>
                <td className="px-4 py-3">
                  <span className="rounded bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700">Buyer Paid</span>
                </td>
                <td className="px-4 py-3 text-secondary-600">
                  Live quote at checkout for urgent shipments and courier-eligible destinations.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-xs text-secondary-500">
          Available methods depend on the destination and the shipping rates currently configured
          for that route.
        </p>
      </section>

      <section className="mt-10">
        <h2 className="text-xl font-semibold text-secondary-900">How Shipping Charges Are Calculated</h2>
        <div className="mt-4 space-y-3 text-sm leading-relaxed text-secondary-600">
          <p>
            Machrio calculates shipping using this formula:{' '}
            <strong>shipping = base rate + overage fee + handling fee</strong>.
          </p>
          <p>
            The base rate covers the included weight for the selected route. Any weight above that
            threshold is charged at the route&apos;s additional per-kilogram rate, and a fixed
            handling fee may also apply.
          </p>
          <p>
            Rates can vary by country. If a specific destination does not have its own rate,
            Machrio uses the default <strong>OTHER</strong> rate when it is configured.
          </p>
          <p>
            Free-shipping rules can be configured per shipping method and by country. When a route
            qualifies, the cart and checkout will show the remaining amount needed to unlock it.
          </p>
          <p>
            The order ship date is based on the longest processing time among the products in your
            cart, and the estimated delivery date combines that handling time with the route transit
            time.
          </p>
        </div>
      </section>

      <section className="mt-10">
        <h2 className="text-xl font-semibold text-secondary-900">Duties &amp; Taxes</h2>
        <div className="mt-4 space-y-3 text-sm leading-relaxed text-secondary-600">
          <p>
            <strong>DDP (Delivered Duty Paid) shipments:</strong> Customs duties and import taxes
            are prepaid by Machrio. You will not be charged additional fees upon delivery.
          </p>
          <p>
            <strong>Non-DDP courier shipments:</strong> For some orders shipped via express
            couriers (DHL, FedEx, UPS), import duties and taxes may be billed by your local
            customs authority and are the buyer&apos;s responsibility.
          </p>
          <p>
            All shipments include detailed invoices and customs documentation (commercial invoices,
            packing lists, HS codes, and Certificates of Origin where applicable).
          </p>
        </div>
      </section>

      <section className="mt-10">
        <h2 className="text-xl font-semibold text-secondary-900">Shipment Tracking</h2>
        <p className="mt-3 text-sm leading-relaxed text-secondary-600">
          All shipments include online tracking. Tracking information will be provided via email
          once your order has shipped. For delivery updates or questions, contact{' '}
          <strong>support@machrio.com</strong>.
        </p>
      </section>

      <section className="mt-10 flex gap-3">
        <Link href="/clearance-duties" className="text-sm text-primary-600 underline hover:text-primary-800">
          Clearance &amp; Duties Details
        </Link>
        <span className="text-secondary-300">|</span>
        <Link href="/return-refund" className="text-sm text-primary-600 underline hover:text-primary-800">
          Return &amp; Refund Policy
        </Link>
      </section>

      <section className="mt-10 rounded-lg border border-secondary-200 bg-secondary-50 p-6">
        <p className="text-sm text-secondary-600">
          Machrio is operated by <strong>VERTAX LIMITED</strong>, a Hong Kong registered company
          specializing in industrial supply chain solutions.
        </p>
      </section>
    </div>
  )
}
