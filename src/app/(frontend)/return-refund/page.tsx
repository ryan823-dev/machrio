import type { Metadata } from 'next'
import Link from 'next/link'

// 完全静态生成，构建时生成 HTML
export const dynamic = 'force-static'

export const metadata: Metadata = {
  title: 'Return & Refund Policy | Machrio',
  description: 'Machrio return and refund policy - 30-day return window, transparent process, and fair resolution for all industrial supply orders.',
  alternates: { canonical: '/return-refund/' },
  openGraph: {
    title: 'Return & Refund Policy | Machrio',
    description: 'Machrio return and refund policy - 30-day return window, transparent process, and fair resolution for all industrial supply orders.',
  },
}

export default function ReturnRefundPage() {
  return (
    <div className="container-main pb-16 pt-8">
      <h1 className="text-3xl font-bold text-secondary-900">Return &amp; Refund Policy</h1>
      <p className="mt-4 max-w-3xl text-sm leading-relaxed text-secondary-600">
        At Machrio, we value long-term partnerships and customer satisfaction. Our return policy is designed to ensure a professional and transparent experience for every buyer.
      </p>

      {/* Quick Summary */}
      <section className="mt-8">
        <div className="overflow-x-auto rounded-lg border border-secondary-200">
          <table className="w-full text-sm">
            <tbody className="divide-y divide-secondary-100">
              <tr className="bg-secondary-50">
                <td className="px-4 py-3 font-medium text-secondary-700 w-1/3">Return Window</td>
                <td className="px-4 py-3 text-secondary-600">Within 30 days of delivery</td>
              </tr>
              <tr>
                <td className="px-4 py-3 font-medium text-secondary-700">Refund Processing</td>
                <td className="px-4 py-3 text-secondary-600">Refund issued within 2 business days after inspection; funds returned within 10&ndash;15 business days</td>
              </tr>
              <tr className="bg-secondary-50">
                <td className="px-4 py-3 font-medium text-secondary-700">Return Shipping</td>
                <td className="px-4 py-3 text-secondary-600">Machrio covers shipping for quality issues or shipping errors; customer covers for other reasons</td>
              </tr>
              <tr>
                <td className="px-4 py-3 font-medium text-secondary-700">Warranty</td>
                <td className="px-4 py-3 text-secondary-600">3-year warranty on manufacturing defects</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Eligibility */}
      <section className="mt-10">
        <h2 className="text-xl font-semibold text-secondary-900">1. Return Eligibility</h2>
        <div className="mt-3 space-y-2 text-sm leading-relaxed text-secondary-600">
          <p>Return requests must be submitted within <strong>30 calendar days</strong> of receiving your order. To qualify:</p>
          <ul className="ml-4 list-disc space-y-1">
            <li>The product must remain unused and in original packaging.</li>
            <li>Return authorization (RMA) must be obtained before shipment.</li>
            <li>Returns must be shipped to the designated warehouse address provided in the approval email.</li>
          </ul>
          <p className="mt-3">
            <strong>Machrio covers return shipping</strong> if the product has confirmed quality defects or a wrong item was shipped. For other cases (change of mind, wrong order), customers are responsible for return shipping.
          </p>
        </div>
      </section>

      {/* Deductions */}
      <section className="mt-10">
        <h2 className="text-xl font-semibold text-secondary-900">2. Deductions &amp; Non-Refundable Fees</h2>
        <div className="mt-3 text-sm leading-relaxed text-secondary-600">
          <p>Refunds may be adjusted to reflect inspection and repackaging fees, or warehouse handling costs if applicable.</p>
          <p className="mt-2"><strong>Non-refundable items:</strong></p>
          <ul className="ml-4 mt-1 list-disc space-y-1">
            <li>Original outbound shipping and packaging fees</li>
            <li>Return postage (except for confirmed quality or shipping errors)</li>
          </ul>
          <p className="mt-2 text-secondary-500 italic">Tip: Always retain proof of shipment and tracking information.</p>
        </div>
      </section>

      {/* Scenarios */}
      <section className="mt-10">
        <h2 className="text-xl font-semibold text-secondary-900">3. Return Scenarios</h2>

        <div className="mt-4 space-y-6">
          <div className="rounded-lg border border-secondary-200 p-5">
            <h3 className="font-semibold text-secondary-800">A. Regular Product Return (Non-Quality Issue)</h3>
            <ul className="mt-2 ml-4 list-disc space-y-1 text-sm text-secondary-600">
              <li>Submit a return request via email (include product photo and packaging proof)</li>
              <li>After approval, an RMA number will be issued</li>
              <li>Clearly mark this RMA number on the package label</li>
              <li>Refund = Product Payment &ndash; Original Shipping &ndash; Handling Costs</li>
            </ul>
          </div>

          <div className="rounded-lg border border-secondary-200 p-5">
            <h3 className="font-semibold text-secondary-800">B. Wrong Item Received</h3>
            <ul className="mt-2 ml-4 list-disc space-y-1 text-sm text-secondary-600">
              <li>Contact support within <strong>48 hours</strong> of receipt with photos/videos</li>
              <li>Option 1: Keep the wrong item and receive 50% price compensation plus a correct replacement</li>
              <li>Option 2: Return the item within 5 business days for a full replacement</li>
            </ul>
          </div>

          <div className="rounded-lg border border-secondary-200 p-5">
            <h3 className="font-semibold text-secondary-800">C. Defective Product Return</h3>
            <ul className="mt-2 ml-4 list-disc space-y-1 text-sm text-secondary-600">
              <li>Submit a claim within <strong>15 working days</strong> of delivery</li>
              <li>Provide: 3 short videos from different angles, 10 high-resolution photos, and a description of the issue</li>
              <li>Defective items may be repaired, replaced, or refunded at Machrio&apos;s discretion</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="mt-10">
        <h2 className="text-xl font-semibold text-secondary-900">4. Processing Timeline</h2>
        <div className="mt-4 overflow-x-auto rounded-lg border border-secondary-200">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-secondary-200 bg-secondary-50">
                <th className="px-4 py-3 text-left font-medium text-secondary-700">Step</th>
                <th className="px-4 py-3 text-left font-medium text-secondary-700">Duration</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-secondary-100">
              <tr><td className="px-4 py-2.5 text-secondary-600">Return Review</td><td className="px-4 py-2.5 text-secondary-600">2 business days (up to 5 for complex cases)</td></tr>
              <tr className="bg-secondary-50"><td className="px-4 py-2.5 text-secondary-600">Customer to Ship Back</td><td className="px-4 py-2.5 text-secondary-600">Within 7 days after approval</td></tr>
              <tr><td className="px-4 py-2.5 text-secondary-600">Quality Inspection</td><td className="px-4 py-2.5 text-secondary-600">3&ndash;5 business days</td></tr>
              <tr className="bg-secondary-50"><td className="px-4 py-2.5 text-secondary-600">Refund Processing</td><td className="px-4 py-2.5 text-secondary-600">Within 2 business days after inspection</td></tr>
              <tr><td className="px-4 py-2.5 text-secondary-600">Funds Arrive</td><td className="px-4 py-2.5 text-secondary-600">10&ndash;15 business days depending on payment provider</td></tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Dispute */}
      <section className="mt-10">
        <h2 className="text-xl font-semibold text-secondary-900">5. Dispute &amp; Protection</h2>
        <ul className="mt-3 ml-4 list-disc space-y-1 text-sm text-secondary-600">
          <li>All returns must be processed via authorized channels (official website or support email)</li>
          <li>For disputes, you may request a second inspection or provide an independent third-party report</li>
          <li>Dispute resolution is typically completed within 30 calendar days</li>
        </ul>
      </section>

      {/* Contact */}
      <section className="mt-10 rounded-lg bg-secondary-50 border border-secondary-200 p-6">
        <p className="text-sm text-secondary-700">
          For return authorization or inquiries: <strong>support@machrio.com</strong>
        </p>
        <p className="mt-2 text-sm text-secondary-500">
          Machrio is operated by <strong>VERTAX LIMITED</strong>, a Hong Kong registered company.
        </p>
      </section>
    </div>
  )
}
