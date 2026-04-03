import type { Metadata } from 'next'
import Link from 'next/link'
import { Breadcrumbs } from '@/components/shared/Breadcrumbs'
import { FAQSchema } from '@/components/shared/FAQSchema'

export const dynamic = 'force-static'

export const metadata: Metadata = {
  title: 'Key Features to Consider When Purchasing an Air Respirator | Machrio',
  description: 'Learn the 10 essential features to consider when buying an air respirator: protection level, filter compatibility, fit, comfort, breathing resistance, durability, PPE compatibility, and safety certification.',
  alternates: { canonical: '/knowledge-center/air-respirator-buying-guide' },
  openGraph: {
    title: 'Key Features to Consider When Purchasing an Air Respirator | Machrio',
    description: 'Learn the 10 essential features to consider when buying an air respirator: protection level, filter compatibility, fit, comfort, and safety certification.',
    type: 'article',
  },
}

const faqItems = [
  {
    question: 'What are the key features to consider when purchasing an air respirator?',
    answer: 'The key features include protection type, respirator design, filter compatibility, face fit, comfort, breathing resistance, durability, compatibility with other PPE, and safety compliance. Buyers should first identify the workplace hazard, such as dust, fumes, vapors, or chemical gases, and then select a respirator designed for that specific risk.',
  },
  {
    question: 'What is the difference between a half-face and full-face respirator?',
    answer: 'A half-face respirator covers only the nose and mouth, while a full-face respirator provides the same respiratory protection plus eye and face protection. Full-face models are recommended when working with chemicals that can cause eye irritation or when splash protection is needed.',
  },
  {
    question: 'How do I choose the right respirator filter?',
    answer: 'Choose filters based on the specific hazard: particulate filters for dust and particles, gas/vapor cartridges for chemicals, or combination cartridges for mixed hazards. Check filter compatibility with your respirator model and ensure replacement filters are readily available.',
  },
  {
    question: 'When should I use a disposable respirator instead of a reusable one?',
    answer: 'Use disposable respirators for short-term tasks, low-hazard environments, or when convenience is prioritized. Choose reusable respirators for long-term use, high-hazard environments, or when cost-effectiveness over time is important. Reusable models also offer better fit customization and filter options.',
  },
  {
    question: 'Can one respirator protect against both dust and chemical vapors?',
    answer: 'Yes, but only with the correct combination cartridges. A standard particulate filter alone will not protect against chemical vapors. You need a combination cartridge that includes both particulate filtration and chemical adsorption layers specific to the vapors you encounter.',
  },
  {
    question: 'How often should respirator filters be replaced?',
    answer: 'Replace particulate filters when breathing becomes difficult or they are damaged. Replace chemical cartridges based on the contaminant type, concentration, and exposure time. Follow manufacturer guidelines and implement a cartridge change schedule. Never reuse disposable respirators beyond their intended use period.',
  },
]

export default function AirRespiratorGuide() {
  return (
    <div className="container-main pb-16 pt-8">
      <FAQSchema faqs={faqItems} />
      <Breadcrumbs items={[
        { label: 'Home', href: '/' },
        { label: 'Knowledge Center', href: '/knowledge-center' },
        { label: 'Air Respirator Buying Guide' },
      ]} />

      {/* Header */}
      <header className="mt-4">
        <h1 className="text-3xl font-bold text-secondary-900">
          What Are the Key Features to Consider When Purchasing an Air Respirator?
        </h1>
        <p className="mt-4 text-lg text-secondary-600 max-w-4xl">
          The key features to consider when purchasing an air respirator include <strong>protection type, respirator design, filter compatibility, face fit, comfort, breathing resistance, durability, compatibility with other PPE, and safety compliance</strong>. Buyers should first identify the workplace hazard, such as dust, fumes, vapors, or chemical gases, and then select a respirator designed for that specific risk.
        </p>
      </header>

      {/* Main Content */}
      <div className="mt-10 max-w-4xl">
        {/* Quick Answer Box */}
        <div className="rounded-lg border border-primary-200 bg-primary-50 p-6 mb-10">
          <h2 className="text-xl font-semibold text-primary-900 mb-3">Quick Answer</h2>
          <p className="text-secondary-700 leading-relaxed">
            When buying an air respirator, focus on <strong>hazard protection, proper fit, filter type, comfort, durability, and compliance</strong>. The best choice is one that matches the actual workplace risk, can be worn comfortably for the required duration, and is easy to maintain over time. A proper face seal is essential, because even a certified respirator cannot provide effective protection if it does not fit correctly.
          </p>
        </div>

        {/* Detailed Sections */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold text-secondary-900 mb-4">
            10 Key Features to Consider
          </h2>
          
          <div className="space-y-8">
            {/* Section 1 */}
            <div>
              <h3 className="text-lg font-semibold text-secondary-900 mb-2">
                1. Protection Level
              </h3>
              <p className="text-secondary-700 leading-relaxed mb-3">
                Choose a respirator based on the type of hazard you need to control. Different jobs involve different risks, such as:
              </p>
              <ul className="list-disc pl-6 space-y-1 text-secondary-700">
                <li>Dust and particles</li>
                <li>Fumes and smoke</li>
                <li>Organic vapors</li>
                <li>Chemical gases</li>
                <li>Oil-based aerosols</li>
              </ul>
              <p className="text-secondary-700 leading-relaxed mt-3">
                The respirator must match the contaminant type and concentration. A model suitable for dust may not protect against chemical vapors.
              </p>
            </div>

            {/* Section 2 */}
            <div>
              <h3 className="text-lg font-semibold text-secondary-900 mb-2">
                2. Respirator Type
              </h3>
              <p className="text-secondary-700 leading-relaxed mb-3">
                There are several common types of air respirators:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-secondary-700">
                <li><strong>Disposable particulate respirators</strong>: often used for dust, non-oil particles, and short-term tasks</li>
                <li><strong>Half-face respirators</strong>: cover the nose and mouth and use replaceable filters or cartridges</li>
                <li><strong>Full-face respirators</strong>: provide the same respiratory protection as half-face models but also protect the eyes and face</li>
                <li><strong>Powered air-purifying respirators (PAPR)</strong>: use a battery-powered blower to reduce breathing resistance and improve comfort during long wear</li>
              </ul>
            </div>

            {/* Section 3 */}
            <div>
              <h3 className="text-lg font-semibold text-secondary-900 mb-2">
                3. Filter or Cartridge Compatibility
              </h3>
              <p className="text-secondary-700 leading-relaxed mb-3">
                A good respirator should support the correct filters or cartridges for the application. Buyers should check:
              </p>
              <ul className="list-disc pl-6 space-y-1 text-secondary-700">
                <li>Whether it uses particulate filters, gas/vapor cartridges, or combination cartridges</li>
                <li>Whether replacement filters are easy to source</li>
                <li>Whether the filter system is quick to install and change</li>
              </ul>
              <p className="text-secondary-700 leading-relaxed mt-3">
                Filter availability is important for long-term use and maintenance.
              </p>
            </div>

            {/* Section 4 */}
            <div>
              <h3 className="text-lg font-semibold text-secondary-900 mb-2">
                4. Face Seal and Fit
              </h3>
              <p className="text-secondary-700 leading-relaxed mb-3">
                A respirator only works properly if it seals well to the wearer's face. Poor fit reduces protection. Key points include:
              </p>
              <ul className="list-disc pl-6 space-y-1 text-secondary-700">
                <li>Multiple size options</li>
                <li>Adjustable head straps</li>
                <li>Stable face seal during movement</li>
                <li>Compatibility with fit testing requirements</li>
              </ul>
              <p className="text-secondary-700 leading-relaxed mt-3">
                Comfort matters, but fit matters more. Even a high-quality respirator will not protect well if the seal is poor.
              </p>
            </div>

            {/* Section 5 */}
            <div>
              <h3 className="text-lg font-semibold text-secondary-900 mb-2">
                5. Comfort for Long-term Wear
              </h3>
              <p className="text-secondary-700 leading-relaxed mb-3">
                For extended use, comfort strongly affects productivity and compliance. Important comfort features include:
              </p>
              <ul className="list-disc pl-6 space-y-1 text-secondary-700">
                <li>Lightweight construction</li>
                <li>Soft sealing materials</li>
                <li>Low breathing resistance</li>
                <li>Balanced weight distribution</li>
                <li>Easy strap adjustment</li>
              </ul>
              <p className="text-secondary-700 leading-relaxed mt-3">
                Workers are more likely to wear respirators correctly when they are comfortable.
              </p>
            </div>

            {/* Section 6 */}
            <div>
              <h3 className="text-lg font-semibold text-secondary-900 mb-2">
                6. Breathing Resistance
              </h3>
              <p className="text-secondary-700 leading-relaxed mb-3">
                Lower breathing resistance can reduce fatigue, especially during physically demanding work. This is particularly important for:
              </p>
              <ul className="list-disc pl-6 space-y-1 text-secondary-700">
                <li>Long shifts</li>
                <li>Hot environments</li>
                <li>High-movement tasks</li>
                <li>Users who wear respirators for many hours per day</li>
              </ul>
              <p className="text-secondary-700 leading-relaxed mt-3">
                Some advanced designs and PAPR systems help improve airflow and reduce strain.
              </p>
            </div>

            {/* Section 7 */}
            <div>
              <h3 className="text-lg font-semibold text-secondary-900 mb-2">
                7. Durability and Maintenance
              </h3>
              <p className="text-secondary-700 leading-relaxed mb-3">
                For reusable respirators, buyers should consider:
              </p>
              <ul className="list-disc pl-6 space-y-1 text-secondary-700">
                <li>Material strength</li>
                <li>Resistance to workplace wear</li>
                <li>Ease of cleaning</li>
                <li>Availability of spare parts</li>
                <li>Simplicity of filter replacement</li>
              </ul>
              <p className="text-secondary-700 leading-relaxed mt-3">
                A durable respirator can reduce replacement cost over time.
              </p>
            </div>

            {/* Section 8 */}
            <div>
              <h3 className="text-lg font-semibold text-secondary-900 mb-2">
                8. Field of Vision and PPE Compatibility
              </h3>
              <p className="text-secondary-700 leading-relaxed mb-3">
                Respirators are often used together with other protective equipment such as:
              </p>
              <ul className="list-disc pl-6 space-y-1 text-secondary-700">
                <li>Safety glasses</li>
                <li>Face shields</li>
                <li>Helmets</li>
                <li>Hearing protection</li>
              </ul>
              <p className="text-secondary-700 leading-relaxed mt-3">
                The respirator should not interfere with other PPE or restrict visibility more than necessary.
              </p>
            </div>

            {/* Section 9 */}
            <div>
              <h3 className="text-lg font-semibold text-secondary-900 mb-2">
                9. Certification and Compliance
              </h3>
              <p className="text-secondary-700 leading-relaxed mb-3">
                Always check whether the respirator complies with relevant safety standards required in your market or industry. Depending on the destination market, buyers may look for compliance with recognized standards and proper product documentation.
              </p>
              <p className="text-secondary-700 leading-relaxed mt-3">
                This is especially important for industrial buyers, distributors, and importers.
              </p>
            </div>

            {/* Section 10 */}
            <div>
              <h3 className="text-lg font-semibold text-secondary-900 mb-2">
                10. Application and Industry Use
              </h3>
              <p className="text-secondary-700 leading-relaxed mb-3">
                The best respirator depends on where it will be used. Common applications include:
              </p>
              <ul className="list-disc pl-6 space-y-1 text-secondary-700">
                <li>Construction</li>
                <li>Mining</li>
                <li>Welding</li>
                <li>Painting</li>
                <li>Chemical handling</li>
                <li>Manufacturing</li>
                <li>Agriculture</li>
                <li>Pharmaceutical environments</li>
              </ul>
              <p className="text-secondary-700 leading-relaxed mt-3">
                A respirator should be selected according to the real working condition, not only by price.
              </p>
            </div>
          </div>
        </section>

        {/* Final Recommendation */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold text-secondary-900 mb-4">
            Final Recommendation
          </h2>
          <div className="rounded-lg border border-secondary-200 bg-secondary-50 p-6">
            <p className="text-secondary-700 leading-relaxed mb-4">
              When buying an air respirator, focus on <strong>hazard protection, proper fit, filter type, comfort, durability, and compliance</strong>. The best choice is one that matches the actual workplace risk, can be worn comfortably for the required duration, and is easy to maintain over time.
            </p>
            <p className="text-secondary-700 leading-relaxed">
              For industrial procurement, it is also wise to evaluate <strong>replacement filter supply, certification documents, and compatibility with other PPE</strong> before placing an order.
            </p>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold text-secondary-900 mb-6">
            Frequently Asked Questions
          </h2>
          <div className="space-y-4">
            {faqItems.map((faq, index) => (
              <div key={index} className="rounded-lg border border-secondary-200 p-5">
                <h3 className="font-medium text-secondary-900 text-base">
                  {faq.question}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-secondary-600">
                  {faq.answer}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="rounded-lg border border-amber-200 bg-amber-50 p-6 text-center">
          <h2 className="text-lg font-semibold text-amber-800">
            Need Help Choosing the Right Respirator?
          </h2>
          <p className="mt-2 text-sm text-amber-700">
            Our safety equipment specialists can help you find the right respirator for your specific application.
          </p>
          <div className="mt-4 flex justify-center gap-3">
            <Link href="/category/respiratory-protection" className="btn-accent">
              Browse Respirators
            </Link>
            <Link href="/rfq" className="btn-secondary">
              Request a Quote
            </Link>
          </div>
        </section>
      </div>
    </div>
  )
}
