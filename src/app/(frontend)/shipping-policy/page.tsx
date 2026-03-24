import type { Metadata } from 'next'
import Link from 'next/link'

// 完全静态生成，构建时生成 HTML
export const dynamic = 'force-static'

export const metadata: Metadata = {
  title: 'Shipping Policy | Machrio',
  description: 'Machrio shipping policy - DDP duty-free delivery, U.S. warehouse fast shipping, and global logistics options for industrial supplies.',
  alternates: { canonical: '/shipping-policy/' },
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
        Machrio provides reliable global shipping for industrial supplies. Orders are processed within 1&ndash;2 business days after payment confirmation. Weekend and holiday orders are handled on the next business day.
      </p>

      {/* Free shipping banner */}
      <div className="mt-6 rounded-lg bg-green-50 border border-green-200 p-4">
        <p className="text-sm font-semibold text-green-800">Orders over $200 qualify for FREE shipping!</p>
        <p className="mt-1 text-xs text-green-600">Flat rate of $25 for orders under $200.</p>
      </div>

      {/* Shipping options table */}
      <section className="mt-10">
        <h2 className="text-xl font-semibold text-secondary-900">Shipping Options</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-secondary-200 bg-secondary-50">
                <th className="px-4 py-3 text-left font-medium text-secondary-700">Origin</th>
                <th className="px-4 py-3 text-left font-medium text-secondary-700">Delivery Time</th>
                <th className="px-4 py-3 text-left font-medium text-secondary-700">Duties &amp; Taxes</th>
                <th className="px-4 py-3 text-left font-medium text-secondary-700">Shipping Fee</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-secondary-100">
              <tr>
                <td className="px-4 py-3 font-medium text-secondary-800">U.S. Warehouse</td>
                <td className="px-4 py-3 text-secondary-600">2&ndash;7 business days</td>
                <td className="px-4 py-3"><span className="rounded bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-700">Included</span></td>
                <td className="px-4 py-3 text-secondary-600">Calculated at checkout</td>
              </tr>
              <tr>
                <td className="px-4 py-3 font-medium text-secondary-800">China &mdash; DDP Air</td>
                <td className="px-4 py-3 text-secondary-600">6&ndash;15 business days</td>
                <td className="px-4 py-3"><span className="rounded bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-700">Included</span></td>
                <td className="px-4 py-3 text-secondary-600">Calculated at checkout</td>
              </tr>
              <tr>
                <td className="px-4 py-3 font-medium text-secondary-800">China &mdash; DDP Sea</td>
                <td className="px-4 py-3 text-secondary-600">20&ndash;35 business days</td>
                <td className="px-4 py-3"><span className="rounded bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-700">Included</span></td>
                <td className="px-4 py-3 text-secondary-600">Free over $200</td>
              </tr>
              <tr>
                <td className="px-4 py-3 font-medium text-secondary-800">Express Courier</td>
                <td className="px-4 py-3 text-secondary-600">3&ndash;10 business days</td>
                <td className="px-4 py-3"><span className="rounded bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700">Buyer Paid</span></td>
                <td className="px-4 py-3 text-secondary-600">Calculated at checkout</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Duties */}
      <section className="mt-10">
        <h2 className="text-xl font-semibold text-secondary-900">Duties &amp; Taxes</h2>
        <div className="mt-4 space-y-3 text-sm leading-relaxed text-secondary-600">
          <p>
            <strong>DDP (Delivered Duty Paid) shipments:</strong> Customs duties and import taxes are prepaid by Machrio. You will not be charged additional fees upon delivery.
          </p>
          <p>
            <strong>Non-DDP courier shipments:</strong> For some orders shipped via express couriers (DHL, FedEx, UPS), import duties and taxes may be billed by your local customs authority and are the buyer&apos;s responsibility.
          </p>
          <p>
            All shipments include detailed invoices and customs documentation (commercial invoices, packing lists, HS codes, and Certificates of Origin where applicable).
          </p>
        </div>
      </section>

      {/* Tracking */}
      <section className="mt-10">
        <h2 className="text-xl font-semibold text-secondary-900">Shipment Tracking</h2>
        <p className="mt-3 text-sm leading-relaxed text-secondary-600">
          All shipments include online tracking. Tracking information will be provided via email once your order has shipped. For delivery updates or questions, contact <strong>support@machrio.com</strong>.
        </p>
      </section>

      {/* See also */}
      <section className="mt-10 flex gap-3">
        <Link href="/clearance-duties" className="text-sm text-primary-600 underline hover:text-primary-800">Clearance &amp; Duties Details</Link>
        <span className="text-secondary-300">|</span>
        <Link href="/return-refund" className="text-sm text-primary-600 underline hover:text-primary-800">Return &amp; Refund Policy</Link>
      </section>

      {/* Company Info */}
      <section className="mt-10 rounded-lg bg-secondary-50 border border-secondary-200 p-6">
        <p className="text-sm text-secondary-600">
          Machrio is operated by <strong>VERTAX LIMITED</strong>, a Hong Kong registered company specializing in industrial supply chain solutions.
        </p>
      </section>
    </div>
  )
}
