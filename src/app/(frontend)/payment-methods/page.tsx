import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Payment Methods | Machrio',
  description: 'Machrio accepts credit cards via Stripe, bank transfers, and will soon support BNPL options. Secure, flexible payment for B2B industrial procurement.',
  alternates: { canonical: '/payment-methods/' },
  openGraph: {
    title: 'Payment Methods | Machrio',
    description: 'Machrio accepts credit cards via Stripe, bank transfers, and will soon support BNPL options. Secure, flexible payment for B2B industrial procurement.',
  },
}

export default function PaymentMethodsPage() {
  return (
    <div className="container-main pb-16 pt-8">
      <h1 className="text-3xl font-bold text-secondary-900">Payment Methods</h1>
      <p className="mt-4 max-w-3xl text-sm leading-relaxed text-secondary-600">
        At Machrio, we make industrial procurement easy &mdash; from everyday online purchases to long-term business contracts. Choose the payment method that best fits your workflow. All transactions are processed through certified gateways with full encryption and international compliance.
      </p>

      {/* Online Payments */}
      <section className="mt-10">
        <h2 className="text-xl font-semibold text-secondary-900">1. Online Payments</h2>
        <p className="mt-3 text-sm leading-relaxed text-secondary-600">
          We accept a wide range of global and local online payment options, ensuring smooth checkout wherever you are.
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="rounded-lg border border-secondary-200 p-4">
            <h3 className="font-medium text-secondary-800">Credit &amp; Debit Cards</h3>
            <p className="mt-1 text-sm text-secondary-600">Visa, MasterCard, American Express, Discover, JCB &mdash; processed securely via Stripe.</p>
          </div>
          <div className="rounded-lg border border-secondary-200 p-4">
            <h3 className="font-medium text-secondary-800">Digital Wallets</h3>
            <p className="mt-1 text-sm text-secondary-600">Apple Pay, Google Pay &mdash; fast one-tap checkout on supported devices.</p>
          </div>
          <div className="rounded-lg border border-secondary-200 p-4">
            <h3 className="flex items-center gap-2 font-medium text-secondary-800">
              Buy Now, Pay Later
              <span className="rounded bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700">Coming Soon</span>
            </h3>
            <p className="mt-1 text-sm text-secondary-600">Klarna and Afterpay integration is being finalized and will be available shortly.</p>
          </div>
          <div className="rounded-lg border border-secondary-200 p-4">
            <h3 className="font-medium text-secondary-800">Local Payment Solutions</h3>
            <p className="mt-1 text-sm text-secondary-600">Regional wallets and payment systems automatically appear at checkout based on your location.</p>
          </div>
        </div>
      </section>

      {/* Bank Transfer */}
      <section className="mt-10">
        <h2 className="text-xl font-semibold text-secondary-900">2. Bank Transfer for Business Orders</h2>
        <p className="mt-3 text-sm leading-relaxed text-secondary-600">
          For high-value or B2B transactions, Machrio maintains <strong>local bank accounts across 14+ countries and currencies</strong>, allowing you to pay via domestic transfer and avoid costly international wire fees.
        </p>
        <div className="mt-4 rounded-lg border border-secondary-200 bg-secondary-50 p-5">
          <h3 className="text-sm font-semibold text-secondary-800">Supported Currencies &amp; Regions</h3>
          <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 text-sm">
            {[
              { flag: '\u{1F1FA}\u{1F1F8}', label: 'USD' },
              { flag: '\u{1F1ED}\u{1F1F0}', label: 'HKD' },
              { flag: '\u{1F1EA}\u{1F1FA}', label: 'EUR' },
              { flag: '\u{1F1EC}\u{1F1E7}', label: 'GBP' },
              { flag: '\u{1F1E8}\u{1F1E6}', label: 'CAD' },
              { flag: '\u{1F1E6}\u{1F1FA}', label: 'AUD' },
              { flag: '\u{1F1F3}\u{1F1FF}', label: 'NZD' },
              { flag: '\u{1F1F8}\u{1F1EC}', label: 'SGD' },
              { flag: '\u{1F1E6}\u{1F1EA}', label: 'AED' },
              { flag: '\u{1F1F2}\u{1F1FD}', label: 'MXN' },
              { flag: '\u{1F1F5}\u{1F1ED}', label: 'PHP' },
              { flag: '\u{1F1EE}\u{1F1E9}', label: 'IDR' },
              { flag: '\u{1F1EE}\u{1F1F1}', label: 'ILS' },
              { flag: '\u{1F1E9}\u{1F1F0}', label: 'DKK' },
              { flag: '\u{1F1E8}\u{1F1F3}', label: 'CNY' },
            ].map(c => (
              <span key={c.label} className="inline-flex items-center gap-1.5 rounded bg-white px-2.5 py-1.5 border border-secondary-100 text-secondary-700">
                <span>{c.flag}</span> {c.label}
              </span>
            ))}
          </div>
        </div>
        <div className="mt-4 space-y-2 text-sm text-secondary-600">
          <p className="flex items-start gap-2">
            <svg className="h-4 w-4 mt-0.5 flex-shrink-0 text-primary-600" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
            <strong>Smart matching:</strong> Select your country at checkout, and your Proforma Invoice will show only the relevant local bank account.
          </p>
          <p className="flex items-start gap-2">
            <svg className="h-4 w-4 mt-0.5 flex-shrink-0 text-primary-600" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
            <strong>Lower fees:</strong> Paying into a local account means no international wire surcharges in many countries.
          </p>
          <p className="flex items-start gap-2">
            <svg className="h-4 w-4 mt-0.5 flex-shrink-0 text-primary-600" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
            <strong>Faster clearing:</strong> Domestic transfers typically settle in 1&ndash;2 business days vs. 3&ndash;5 for international wires.
          </p>
        </div>
        <p className="mt-3 text-sm text-secondary-500 italic">
          Bank details and remittance instructions are provided on your Proforma Invoice. Please include your order number in the payment reference.
        </p>
      </section>

      {/* Business Accounts */}
      <section className="mt-10">
        <h2 className="text-xl font-semibold text-secondary-900">3. Business Accounts &amp; Invoice Payment</h2>
        <p className="mt-3 text-sm leading-relaxed text-secondary-600">
          For regular buyers and corporate clients, Machrio offers flexible business payment arrangements:
        </p>
        <ul className="mt-3 space-y-2 text-sm text-secondary-600">
          <li className="flex items-center gap-2">
            <svg className="h-4 w-4 flex-shrink-0 text-primary-600" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
            Purchase Orders (PO) and invoicing available upon approval
          </li>
          <li className="flex items-center gap-2">
            <svg className="h-4 w-4 flex-shrink-0 text-primary-600" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
            Net payment terms (e.g., Net 15 / Net 30) for eligible business accounts
          </li>
          <li className="flex items-center gap-2">
            <svg className="h-4 w-4 flex-shrink-0 text-primary-600" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
            Consolidated billing for recurring or multi-department purchases
          </li>
        </ul>
        <p className="mt-3 text-sm text-secondary-500 italic">
          Contact our sales team at <strong>sales@machrio.com</strong> to set up your business account.
        </p>
      </section>

      {/* Security */}
      <section className="mt-10">
        <h2 className="text-xl font-semibold text-secondary-900">4. Payment Security</h2>
        <p className="mt-3 text-sm leading-relaxed text-secondary-600">
          Machrio supports major global currencies. All payments are handled through secure, PCI-compliant gateways &mdash; ensuring full data encryption and global transaction safety. We work only with trusted international payment partners to protect your business.
        </p>
      </section>

      {/* CTA */}
      <section className="mt-10 rounded-lg bg-primary-50 p-8">
        <h2 className="text-lg font-semibold text-primary-900">Need a Quotation or Formal Invoice?</h2>
        <p className="mt-2 text-sm text-primary-700">
          If you need a proforma invoice for bank transfer or internal approval, our support team is ready to help.
        </p>
        <div className="mt-4">
          <Link href="/rfq" className="btn-primary px-6 py-2.5 text-sm">Request a Quote</Link>
        </div>
      </section>
    </div>
  )
}
