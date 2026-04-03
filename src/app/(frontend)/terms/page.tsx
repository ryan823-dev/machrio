import type { Metadata } from 'next'

// 完全静态生成，构建时生成 HTML
export const dynamic = 'force-static'

export const metadata: Metadata = {
  title: 'Terms & Conditions | Machrio',
  description: 'Machrio terms and conditions for global industrial buyers - pricing, warranties, customs duties, liability, and governing law.',
  alternates: { canonical: '/terms' },
  openGraph: {
    title: 'Terms & Conditions | Machrio',
    description: 'Machrio terms and conditions for global industrial buyers - pricing, warranties, customs duties, liability, and governing law.',
  },
}

export default function TermsPage() {
  return (
    <div className="container-main pb-16 pt-8">
      <h1 className="text-3xl font-bold text-secondary-900">Terms &amp; Conditions</h1>
      <p className="mt-4 max-w-3xl text-sm leading-relaxed text-secondary-600">
        Welcome to Machrio.com, a global industrial supplies platform connecting businesses, engineers, and factories worldwide. These Terms &amp; Conditions outline the rights and responsibilities between Machrio and our customers.
      </p>

      <div className="mt-10 max-w-3xl space-y-8 text-sm leading-relaxed text-secondary-600">
        <section>
          <h2 className="text-lg font-semibold text-secondary-900">1. General Overview</h2>
          <p className="mt-3">
            By placing an order through Machrio.com, you acknowledge that you have read, understood, and agreed to the following terms. These terms apply to all purchases, whether fulfilled from our U.S. warehouse or China logistics center.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-secondary-900">2. Pricing &amp; Order Confirmation</h2>
          <ul className="mt-3 ml-4 list-disc space-y-2">
            <li>All product prices are listed in USD and are exclusive of applicable import duties, taxes, or fees unless otherwise specified (DDP shipments include duties).</li>
            <li>Prices are subject to change due to raw material fluctuations or exchange rates.</li>
            <li>Orders are confirmed upon receipt of payment or valid purchase order acknowledgment.</li>
            <li>Machrio reserves the right to refuse or cancel orders suspected of fraudulent or unauthorized activity.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-secondary-900">3. Customs Duties &amp; Clearance</h2>
          <ul className="mt-3 ml-4 list-disc space-y-2">
            <li><strong>DDP (Delivered Duty Paid) shipments:</strong> Customs duties and import taxes are prepaid by Machrio. No additional destination fees.</li>
            <li><strong>DDU (Delivered Duty Unpaid) shipments:</strong> For orders shipped through express couriers, import duties and taxes may be billed by the destination&apos;s customs authority.</li>
          </ul>
          <p className="mt-2">Customers in regions with complex import regulations should confirm local compliance requirements before placing an order.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-secondary-900">4. Order Modification &amp; Cancellation</h2>
          <ul className="mt-3 ml-4 list-disc space-y-2">
            <li>Orders may be modified or canceled before shipment confirmation by contacting support@machrio.com.</li>
            <li>Once shipped, cancellation is not possible; refer to our Return &amp; Refund Policy.</li>
            <li>Customized or bulk-made products cannot be canceled once production has started.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-secondary-900">5. Product Quality &amp; Warranty</h2>
          <ul className="mt-3 ml-4 list-disc space-y-2">
            <li><strong>Warranty Period:</strong> 3 years from delivery date.</li>
            <li><strong>Coverage:</strong> Manufacturing defects, material inconsistencies, or workmanship errors.</li>
            <li><strong>Exclusions:</strong> Damage from misuse, incorrect installation, or modifications without approval.</li>
          </ul>
          <p className="mt-2">Claims must be filed with supporting photos/videos and purchase proof. Defective items may be repaired, replaced, or refunded at Machrio&apos;s discretion.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-secondary-900">6. Lifetime Technical Support</h2>
          <p className="mt-3">
            All Machrio customers enjoy lifetime technical assistance from our team, covering product installation, maintenance advice, and application optimization. Contact support@machrio.com for guidance.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-secondary-900">7. Return &amp; Refund</h2>
          <ul className="mt-3 ml-4 list-disc space-y-2">
            <li>30-day return window after delivery.</li>
            <li>Refunds processed within 10&ndash;15 business days after inspection.</li>
            <li>Machrio covers return shipping for quality or fulfillment issues; other reasons are customer-paid.</li>
          </ul>
          <p className="mt-2">For detailed procedures, see our <a href="/return-refund" className="text-primary-600 underline hover:text-primary-800">Return &amp; Refund Policy</a>.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-secondary-900">8. Limitation of Liability</h2>
          <p className="mt-3">
            Machrio&apos;s maximum liability for any claim shall not exceed the total purchase price of the item(s) in question. We are not responsible for indirect, incidental, or consequential damages arising from product use or delayed delivery.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-secondary-900">9. Governing Law &amp; Jurisdiction</h2>
          <p className="mt-3">
            These Terms shall be governed by and construed under the laws of <strong>Hong Kong SAR</strong>, excluding its conflict of law provisions. Disputes shall be resolved through amicable negotiation where possible. If unresolved, either party may submit the case to the <strong>Hong Kong International Arbitration Centre (HKIAC)</strong>.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-secondary-900">10. Updates &amp; Policy Revisions</h2>
          <p className="mt-3">
            Machrio reserves the right to update or revise these terms without prior notice. Revisions take effect immediately upon publication. Customers are encouraged to review this page periodically.
          </p>
        </section>

        <section className="rounded-lg bg-secondary-50 border border-secondary-200 p-6">
          <h3 className="font-semibold text-secondary-800">Contact Us</h3>
          <p className="mt-2">
            If you have questions regarding these Terms &amp; Conditions:<br />
            Email: <strong>support@machrio.com</strong><br />
            Operated by VERTAX LIMITED, Hong Kong.
          </p>
        </section>
      </div>
    </div>
  )
}
