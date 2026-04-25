import type { Metadata } from 'next'
import Link from 'next/link'
import { StructuredData } from '@/components/shared/StructuredData'

// 完全静态生成，构建时生成 HTML
export const dynamic = 'force-static'

export const metadata: Metadata = {
  title: 'How To Order | Machrio',
  description: 'Learn how to place an order on Machrio - online checkout, bulk quotations, purchase orders, and order tracking.',
  alternates: { canonical: '/how-to-order' },
  openGraph: {
    title: 'How To Order | Machrio',
    description: 'Learn how to place an order on Machrio - online checkout, bulk quotations, purchase orders, and order tracking.',
  },
}

const howToSchema = {
  '@context': 'https://schema.org',
  '@type': 'HowTo',
  name: 'How To Order Industrial Supplies on Machrio',
  description: 'Step-by-step guide to placing orders on Machrio — online checkout, bulk quotations, purchase orders, and order tracking.',
  totalTime: 'PT10M',
  step: [
    {
      '@type': 'HowToStep',
      position: 1,
      name: 'Online Ordering',
      text: 'Browse our catalog, add items to your cart, and proceed to checkout. Complete your payment securely using credit card (via Stripe) or select bank transfer for offline payment. Shipping is quoted live at checkout based on destination, weight, and shipping method.',
      url: 'https://machrio.com/how-to-order/#step-1',
    },
    {
      '@type': 'HowToStep',
      position: 2,
      name: 'Quotation & Purchase Orders',
      text: 'For bulk orders or custom specifications, submit a quotation request from any product page or the Request a Quote page. Our team responds within 24 hours with pricing and lead times. Upon agreement, we issue a Proforma Invoice (PI) for your company approval.',
      url: 'https://machrio.com/how-to-order/#step-2',
    },
    {
      '@type': 'HowToStep',
      position: 3,
      name: 'Order Tracking',
      text: 'Track your order status through the order confirmation page linked in your email. For any questions, contact our support team with your order number for immediate assistance.',
      url: 'https://machrio.com/how-to-order/#step-3',
    },
    {
      '@type': 'HowToStep',
      position: 4,
      name: 'Long-Term Cooperation',
      text: 'Machrio accepts purchase orders (PO) and long-term supply agreements from qualified business accounts. Email support@machrio.com to set up your company profile for recurring procurement, framework agreements, or multi-department consolidation.',
      url: 'https://machrio.com/how-to-order/#step-4',
    },
  ],
}

export default function HowToOrderPage() {
  return (
    <div className="container-main pb-16 pt-8">
      <StructuredData data={howToSchema} />
      <h1 className="text-3xl font-bold text-secondary-900">How To Order</h1>
      <p className="mt-4 max-w-3xl text-sm leading-relaxed text-secondary-600">
        Machrio makes industrial procurement straightforward. Whether you&apos;re placing a quick online order or negotiating a bulk supply contract, here&apos;s how to get started.
      </p>

      {/* Step 1 */}
      <section id="step-1" className="mt-10">
        <div className="flex items-start gap-4">
          <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary-600 text-sm font-bold text-white">1</span>
          <div>
            <h2 className="text-lg font-semibold text-secondary-900">Online Ordering</h2>
            <p className="mt-2 text-sm leading-relaxed text-secondary-600">
              Browse our catalog, add items to your cart, and proceed to checkout. Complete your payment securely using credit card (via Stripe) or select bank transfer for offline payment. Shipping is quoted live at checkout based on destination, weight, and shipping method.
            </p>
            <p className="mt-2 text-sm text-secondary-600">
              Once your order is placed, you&apos;ll receive an email confirmation with your order number and tracking details.
            </p>
          </div>
        </div>
      </section>

      {/* Step 2 */}
      <section id="step-2" className="mt-8">
        <div className="flex items-start gap-4">
          <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary-600 text-sm font-bold text-white">2</span>
          <div>
            <h2 className="text-lg font-semibold text-secondary-900">Quotation &amp; Purchase Orders</h2>
            <p className="mt-2 text-sm leading-relaxed text-secondary-600">
              For bulk orders or custom specifications, submit a quotation request from any product page or our <Link href="/rfq" className="text-primary-600 underline hover:text-primary-800">Request a Quote</Link> page. Our team responds within 24 hours with pricing and lead times.
            </p>
            <p className="mt-2 text-sm text-secondary-600">
              Upon agreement, we&apos;ll issue a Proforma Invoice (PI) for your company&apos;s internal approval. Payment can be made via bank transfer to our multi-currency accounts.
            </p>
          </div>
        </div>
      </section>

      {/* Step 3 */}
      <section id="step-3" className="mt-8">
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
      <section id="step-4" className="mt-8">
        <div className="flex items-start gap-4">
          <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary-600 text-sm font-bold text-white">4</span>
          <div>
            <h2 className="text-lg font-semibold text-secondary-900">Long-Term Cooperation</h2>
            <p className="mt-2 text-sm leading-relaxed text-secondary-600">
              Machrio accepts purchase orders (PO) and long-term supply agreements from qualified business accounts. Email <strong>support@machrio.com</strong> to set up your company profile for recurring procurement, framework agreements, or multi-department consolidation.
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

      {/* Company Info */}
      <section className="mt-10 rounded-lg bg-secondary-50 border border-secondary-200 p-6">
        <p className="text-sm text-secondary-600">
          Machrio is operated by <strong>VERTAX LIMITED</strong>, a Hong Kong registered company specializing in industrial supply chain solutions.
        </p>
      </section>
    </div>
  )
}
