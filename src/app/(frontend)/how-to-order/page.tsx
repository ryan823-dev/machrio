import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'How To Order | Machrio',
  description: 'Learn how to place an order on Machrio - online checkout, bulk quotations, purchase orders, and order tracking.',
  alternates: { canonical: '/how-to-order/' },
  openGraph: {
    title: 'How To Order | Machrio',
    description: 'Learn how to place an order on Machrio - online checkout, bulk quotations, purchase orders, and order tracking.',
  },
}

export default function HowToOrderPage() {
  return (
    <div className="container-main pb-16 pt-8">
      <h1 className="text-3xl font-bold text-secondary-900">How To Order</h1>
      <p className="mt-4 max-w-3xl text-sm leading-relaxed text-secondary-600">
        Machrio makes industrial procurement straightforward. Whether you&apos;re placing a quick online order or negotiating a bulk supply contract, here&apos;s how to get started.
      </p>

      {/* Step 1 */}
      <section className="mt-10">
        <div className="flex items-start gap-4">
          <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary-600 text-sm font-bold text-white">1</span>
          <div>
            <h2 className="text-lg font-semibold text-secondary-900">Online Ordering</h2>
            <p className="mt-2 text-sm leading-relaxed text-secondary-600">
              Browse our catalog, add items to your cart, and proceed to checkout. Complete your payment securely using credit card (via Stripe) or select bank transfer for offline payment. Orders over $200 qualify for free shipping.
            </p>
            <p className="mt-2 text-sm text-secondary-600">
              Once your order is placed, you&apos;ll receive an email confirmation with your order number and tracking details.
            </p>
          </div>
        </div>
      </section>

      {/* Step 2 */}
      <section className="mt-8">
        <div className="flex items-start gap-4">
          <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary-600 text-sm font-bold text-white">2</span>
          <div>
            <h2 className="text-lg font-semibold text-secondary-900">Quotation &amp; Purchase Orders</h2>
            <p className="mt-2 text-sm leading-relaxed text-secondary-600">
              For bulk orders or custom specifications, submit a quotation request from any product page or our <Link href="/rfq" className="text-primary-600 underline hover:text-primary-800">Request a Quote</Link> page. Our sales team responds within 24 hours with pricing and lead times.
            </p>
            <p className="mt-2 text-sm text-secondary-600">
              Upon agreement, we&apos;ll issue a Proforma Invoice (PI) for your company&apos;s internal approval. Payment can be made via bank transfer to our multi-currency accounts.
            </p>
          </div>
        </div>
      </section>

      {/* Step 3 */}
      <section className="mt-8">
        <div className="flex items-start gap-4">
          <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary-600 text-sm font-bold text-white">3</span>
          <div>
            <h2 className="text-lg font-semibold text-secondary-900">Order Tracking</h2>
            <p className="mt-2 text-sm leading-relaxed text-secondary-600">
              Track your order status through the order confirmation page linked in your email. For any questions, contact our support team with your order number for immediate assistance.
            </p>
          </div>
        </div>
      </section>

      {/* Step 4 */}
      <section className="mt-8">
        <div className="flex items-start gap-4">
          <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary-600 text-sm font-bold text-white">4</span>
          <div>
            <h2 className="text-lg font-semibold text-secondary-900">Long-Term Cooperation</h2>
            <p className="mt-2 text-sm leading-relaxed text-secondary-600">
              Machrio accepts purchase orders (PO) and long-term supply agreements from qualified business accounts. Email <strong>sales@machrio.com</strong> to set up your company profile for recurring procurement, framework agreements, or multi-department consolidation.
            </p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mt-10 rounded-lg bg-primary-50 p-8">
        <h2 className="text-xl font-semibold text-primary-900">Ready to Place an Order?</h2>
        <div className="mt-4 flex gap-3">
          <Link href="/category" className="btn-primary px-6 py-2.5 text-sm">Browse Products</Link>
          <Link href="/rfq" className="btn-accent px-6 py-2.5 text-sm">Request a Quote</Link>
        </div>
      </section>
    </div>
  )
}
