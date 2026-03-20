import type { Metadata } from 'next'
import { FAQSchema } from '@/components/shared/FAQSchema'

export const metadata: Metadata = {
// 完全静态生成，构建时生成 HTML
export const dynamic = 'force-static'
  title: 'FAQ | Machrio',
  description: 'Frequently asked questions about ordering, payment, shipping, returns, and more at Machrio industrial supplies.',
  alternates: { canonical: '/faq/' },
  openGraph: {
    title: 'FAQ | Machrio',
    description: 'Frequently asked questions about ordering, payment, shipping, returns, and more at Machrio industrial supplies.',
  },
}

const faqSections = [
  {
    title: 'Ordering & Account',
    items: [
      {
        q: 'How do I place an order?',
        a: 'Browse our catalog, add items to your cart, and proceed to secure checkout. You\'ll receive an email confirmation with your order number and details.',
      },
      {
        q: 'Can I order offline or in bulk?',
        a: 'Yes. Email your requirements to sales@machrio.com for bulk or customized procurement. Our sales team responds within 24 hours with pricing and lead times.',
      },
      {
        q: 'Do I need an account to order?',
        a: 'No, guest checkout is available. However, creating an account gives you access to order tracking, invoices, and easier returns management.',
      },
      {
        q: 'Can I modify or cancel my order?',
        a: 'Yes, before shipment — contact our team immediately. Once shipped, cancellation is not possible, but you can initiate a return per our Return & Refund Policy.',
      },
    ],
  },
  {
    title: 'Payment',
    items: [
      {
        q: 'What payment methods do you accept?',
        a: 'We accept Visa, MasterCard, American Express (via Stripe), Apple Pay, Google Pay, and international bank transfers. BNPL options (Klarna, Afterpay) are coming soon.',
      },
      {
        q: 'Do you offer business credit or payment terms?',
        a: 'Yes. Eligible business customers may apply for Net 15 or Net 30 terms via purchase order. Contact sales@machrio.com for details.',
      },
      {
        q: 'Do you support multiple currencies?',
        a: 'Yes. We support USD, HKD, EUR, GBP, CAD, and CNY for bank transfers. Online checkout processes in USD with automatic exchange rate conversion.',
      },
      {
        q: 'Can I get a proforma invoice?',
        a: 'Yes. For bank transfer or internal approval, we provide proforma invoices on your order confirmation page with full banking details.',
      },
    ],
  },
  {
    title: 'Shipping & Duties',
    items: [
      {
        q: 'What shipping methods are available?',
        a: 'We offer U.S. warehouse express shipping (2-7 days), China DDP air (6-15 days), DDP sea freight (20-35 days), and international couriers (DHL/FedEx/UPS, 3-10 days).',
      },
      {
        q: 'Is shipping duty-free?',
        a: 'For DDP (Delivered Duty Paid) shipments, all duties and import taxes are prepaid by Machrio — no additional fees upon delivery.',
      },
      {
        q: 'What is the free shipping threshold?',
        a: 'Orders over $200 qualify for free shipping. Orders under $200 incur a flat $25 shipping fee.',
      },
      {
        q: 'Do you provide customs documentation?',
        a: 'Yes. We issue commercial invoices, packing lists, HS codes, and Certificates of Origin for customs clearance.',
      },
    ],
  },
  {
    title: 'Returns & Refunds',
    items: [
      {
        q: 'What is your return policy?',
        a: 'We offer a 30-day return window from delivery date. Quality issues and shipping errors are fully covered by Machrio; personal returns are at customer expense.',
      },
      {
        q: 'How long does a refund take?',
        a: 'After inspection approval, refunds are processed within 2 business days. Funds typically arrive within 10-15 business days depending on your payment provider.',
      },
      {
        q: 'What if I receive the wrong item?',
        a: 'Contact support within 48 hours with photos. You can either keep the item with 50% compensation plus a correct replacement, or return it within 5 days for a full replacement.',
      },
    ],
  },
  {
    title: 'Quality & Support',
    items: [
      {
        q: 'What warranty do you offer?',
        a: '3-year warranty from delivery date covering manufacturing defects, material inconsistencies, and workmanship errors. Claims require supporting photos/videos and purchase proof.',
      },
      {
        q: 'Do you provide technical support?',
        a: 'Yes. All customers enjoy lifetime technical support covering product installation, usage guidance, and maintenance consultation.',
      },
      {
        q: 'Do you support long-term supply agreements?',
        a: 'Yes. We support annual contracts, framework agreements, and recurring supply partnerships. Contact sales@machrio.com to discuss.',
      },
    ],
  },
  {
    title: 'Privacy & Legal',
    items: [
      {
        q: 'How is my personal data protected?',
        a: 'All data is secured using SSL encryption, restricted access, firewalls, and regular security audits. We do not sell, rent, or trade customer information.',
      },
      {
        q: 'What laws govern your policies?',
        a: 'All policies are governed by Hong Kong SAR laws. Disputes are handled under HKIAC (Hong Kong International Arbitration Centre) arbitration.',
      },
    ],
  },
]

export default function FAQPage() {
  // Collect all FAQ items for structured data
  const allFaqs = faqSections.flatMap((section) =>
    section.items.map((item) => ({ question: item.q, answer: item.a }))
  )

  return (
    <div className="container-main pb-16 pt-8">
      <FAQSchema faqs={allFaqs} />
      <h1 className="text-3xl font-bold text-secondary-900">Frequently Asked Questions</h1>
      <p className="mt-4 max-w-3xl text-sm leading-relaxed text-secondary-600">
        Find answers to common questions about ordering, payment, shipping, returns, and more. Can&apos;t find what you&apos;re looking for? Contact <strong>support@machrio.com</strong>.
      </p>

      <div className="mt-10 space-y-10">
        {faqSections.map((section) => (
          <section key={section.title}>
            <h2 className="text-lg font-semibold text-secondary-900 border-b border-secondary-200 pb-2">
              {section.title}
            </h2>
            <div className="mt-4 space-y-4">
              {section.items.map((item, i) => (
                <div key={i} className="rounded-lg border border-secondary-200 p-4">
                  <h3 className="font-medium text-secondary-800">{item.q}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-secondary-600">{item.a}</p>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>

      {/* Company Info */}
      <section className="mt-10 rounded-lg bg-secondary-50 border border-secondary-200 p-6">
        <p className="text-sm text-secondary-600">
          Machrio is operated by <strong>VERTAX LIMITED</strong>, a Hong Kong registered company specializing in industrial supply chain solutions.
        </p>
      </section>
    </div>
  )
}
