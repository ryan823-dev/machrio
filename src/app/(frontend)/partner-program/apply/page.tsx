import type { Metadata } from 'next'
import { PartnerApplicationForm } from '@/components/partner/PartnerApplicationForm'

export const metadata: Metadata = {
  title: 'Apply to Machrio Partner Program',
  description:
    'Apply to Machrio as a creator partner and get approved to generate tracked links, publish external content, and earn content fees plus sales commission.',
}

export default function PartnerProgramApplyPage() {
  return (
    <div className="container-main py-12">
      <section className="mx-auto max-w-5xl">
        <div className="mb-8 max-w-3xl">
          <p className="text-sm uppercase tracking-[0.3em] text-primary-700">Apply</p>
          <h1 className="mt-3 text-4xl font-bold text-secondary-900">
            Join the Machrio Creator Partner Program
          </h1>
          <p className="mt-4 text-lg text-secondary-600">
            Tell us about your content channels, topic fit, and how you plan to promote Machrio products or RFQ pages. We review each application manually before enabling tracked links.
          </p>
        </div>

        <PartnerApplicationForm />
      </section>
    </div>
  )
}
