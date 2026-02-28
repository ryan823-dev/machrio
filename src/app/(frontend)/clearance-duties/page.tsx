import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Clearance & Duties | Machrio',
  description: 'Machrio clearance and duties information - DDP duty-free delivery, customs documentation, and international shipping compliance.',
  alternates: { canonical: '/clearance-duties/' },
  openGraph: {
    title: 'Clearance & Duties | Machrio',
    description: 'Machrio clearance and duties information - DDP duty-free delivery, customs documentation, and international shipping compliance.',
  },
}

export default function ClearanceDutiesPage() {
  return (
    <div className="container-main pb-16 pt-8">
      <h1 className="text-3xl font-bold text-secondary-900">Clearance &amp; Duties</h1>
      <p className="mt-4 max-w-3xl text-sm leading-relaxed text-secondary-600">
        Machrio specializes in international industrial procurement with duty-free shipping options on most orders. We use optimized logistics to save on costs without hidden customs fees.
      </p>

      {/* Options */}
      <section className="mt-10">
        <h2 className="text-xl font-semibold text-secondary-900">Shipping &amp; Duty Options</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <div className="rounded-lg border-2 border-green-200 bg-green-50 p-5">
            <span className="rounded bg-green-600 px-2 py-0.5 text-xs font-semibold text-white">RECOMMENDED</span>
            <h3 className="mt-3 font-semibold text-secondary-800">Economy DDP (Sea)</h3>
            <ul className="mt-3 space-y-2 text-sm text-secondary-600">
              <li>No import taxes at destination</li>
              <li>Free shipping over $200</li>
              <li>Door-to-door delivery included</li>
              <li>Transit: 20&ndash;35 days</li>
            </ul>
            <p className="mt-3 text-xs text-green-700 font-medium">Best for cost-conscious bulk orders</p>
          </div>

          <div className="rounded-lg border border-secondary-200 p-5">
            <h3 className="font-semibold text-secondary-800">DDP Air (Fast)</h3>
            <ul className="mt-3 space-y-2 text-sm text-secondary-600">
              <li>Duties &amp; taxes prepaid</li>
              <li>Faster than sea freight</li>
              <li>Transit: 6&ndash;15 days</li>
              <li>Shipping fee at checkout</li>
            </ul>
            <p className="mt-3 text-xs text-secondary-500 font-medium">Good balance of speed and cost</p>
          </div>

          <div className="rounded-lg border border-secondary-200 p-5">
            <h3 className="font-semibold text-secondary-800">U.S. Warehouse</h3>
            <ul className="mt-3 space-y-2 text-sm text-secondary-600">
              <li>Fastest delivery: 2&ndash;7 days</li>
              <li>No customs clearance needed</li>
              <li>FedEx / UPS / USPS</li>
              <li>Select items only</li>
            </ul>
            <p className="mt-3 text-xs text-secondary-500 font-medium">For urgent U.S. orders</p>
          </div>
        </div>
      </section>

      {/* What is DDP */}
      <section className="mt-10">
        <h2 className="text-xl font-semibold text-secondary-900">What is DDP?</h2>
        <div className="mt-3 text-sm leading-relaxed text-secondary-600">
          <p>
            <strong>DDP (Delivered Duty Paid)</strong> means Machrio handles all customs clearance and pays all import duties and taxes on your behalf. You receive your order at your door with <strong>zero additional customs charges</strong>.
          </p>
          <p className="mt-3">
            This is particularly valuable for international B2B buyers who want predictable total landed costs without the hassle of dealing with local customs authorities.
          </p>
        </div>
      </section>

      {/* Compliance */}
      <section className="mt-10">
        <h2 className="text-xl font-semibold text-secondary-900">Customs Compliance &amp; Documentation</h2>
        <p className="mt-3 text-sm leading-relaxed text-secondary-600">
          All shipments include full customs transparency with proper documentation:
        </p>
        <ul className="mt-3 ml-4 list-disc space-y-1 text-sm text-secondary-600">
          <li>HS codes for accurate tariff classification</li>
          <li>Commercial invoices with itemized pricing</li>
          <li>Packing lists with weight and dimensions</li>
          <li>Certificate of Origin (COO) where applicable</li>
          <li>RoHS / REACH compliance statements where applicable</li>
        </ul>
      </section>

      {/* Non-DDP note */}
      <section className="mt-10">
        <h2 className="text-xl font-semibold text-secondary-900">Non-DDP Shipments</h2>
        <div className="mt-3 rounded-lg bg-amber-50 border border-amber-200 p-4 text-sm text-amber-800">
          <p>
            For express courier shipments (DHL, FedEx, UPS) that are not DDP, import duties and taxes will be billed directly by your local customs authority and are the buyer&apos;s responsibility. Machrio provides all necessary documentation to facilitate smooth clearance.
          </p>
        </div>
      </section>

      {/* CTA */}
      <section className="mt-10 flex gap-3">
        <Link href="/shipping-policy" className="text-sm text-primary-600 underline hover:text-primary-800">Full Shipping Policy</Link>
        <span className="text-secondary-300">|</span>
        <Link href="/faq" className="text-sm text-primary-600 underline hover:text-primary-800">FAQ</Link>
      </section>
    </div>
  )
}
