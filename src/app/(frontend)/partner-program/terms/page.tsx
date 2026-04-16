import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Machrio Partner Program Terms',
  description:
    'Terms for the Machrio creator partner program, including attribution rules, content fee eligibility, payout policy, and traffic quality requirements.',
}

const sections = [
  {
    title: 'Compensation',
    items: [
      'Approved publications may receive a fixed content fee of $10-30 depending on format, depth, and editorial quality.',
      'Attributed sales earn a 3% commission on net sales, excluding refunds, cancellations, taxes, and shipping charges.',
      'Machrio may hold commission entries as pending until payment is confirmed and fraud checks are complete.',
    ],
  },
  {
    title: 'Attribution',
    items: [
      'Machrio uses unique short links and a 30-day attribution window based on the last valid partner click.',
      'Orders and RFQs are attributed only when the user reaches Machrio through the registered partner link.',
      'If a linked order is refunded or cancelled, the related commission may be reversed.',
    ],
  },
  {
    title: 'Publication Rules',
    items: [
      'Partners must submit the final publication URL so Machrio can review the placement and connect performance to the publication record.',
      'Machrio may reject, pause, or remove publications that misrepresent the brand, use misleading claims, or violate platform rules.',
      'For website articles and sponsored placements, partners should follow search engine guidance for commercial links, including `rel=\"sponsored\"` where appropriate.',
    ],
  },
  {
    title: 'Traffic Quality',
    items: [
      'Self-referrals, click inflation, bot traffic, deceptive redirects, and false buyer intent are not eligible for fees or commissions.',
      'Machrio reserves the right to audit traffic sources, publication ownership, and payout eligibility before releasing funds.',
      'Repeated policy violations may lead to partner suspension or permanent removal from the program.',
    ],
  },
]

export default function PartnerProgramTermsPage() {
  return (
    <div className="container-main py-12">
      <section className="mx-auto max-w-4xl">
        <p className="text-sm uppercase tracking-[0.3em] text-primary-700">Program Terms</p>
        <h1 className="mt-3 text-4xl font-bold text-secondary-900">
          Machrio Creator & Partner Program Terms
        </h1>
        <p className="mt-4 text-lg text-secondary-600">
          These terms define how content fees, attribution, commissions, and publication review work in the first version of the Machrio partner platform.
        </p>

        <div className="mt-10 space-y-6">
          {sections.map((section) => (
            <section key={section.title} className="rounded-2xl border border-secondary-200 bg-white p-8 shadow-sm">
              <h2 className="text-2xl font-semibold text-secondary-900">{section.title}</h2>
              <ul className="mt-5 space-y-3 text-secondary-700">
                {section.items.map((item) => (
                  <li key={item} className="flex gap-3">
                    <svg className="mt-0.5 h-5 w-5 flex-shrink-0 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </section>
    </div>
  )
}
