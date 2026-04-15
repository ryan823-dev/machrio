import type { Metadata } from 'next'
import { Breadcrumbs } from '@/components/shared/Breadcrumbs'
import { RFQForm } from '@/components/forms/RFQForm'
import { withBrandSuffix } from '@/lib/seo'

// 完全静态生成，构建时生成 HTML
export const dynamic = 'force-static'
export const metadata: Metadata = {
  title: withBrandSuffix('Request a Quote'),
  description: 'Request a quote for bulk orders, custom specifications, or products without listed pricing. Our team responds within 24 hours.',
  alternates: { canonical: '/rfq' },  // Fixed: Remove trailing slash to match actual URL structure
  openGraph: {
    title: withBrandSuffix('Request a Quote'),
    description: 'Request a quote for bulk orders, custom specifications, or products without listed pricing. Our team responds within 24 hours.',
  },
}

export default function RFQPage() {
  const breadcrumbs = [
    { label: 'Home', href: '/' },
    { label: 'Request a Quote' },
  ]

  return (
    <div className="container-main pb-12">
      <Breadcrumbs items={breadcrumbs} />

      <div className="mx-auto max-w-3xl">
        <h1 className="text-2xl font-bold text-secondary-900">Request a Quote</h1>
        <p className="mt-2 text-sm text-secondary-600">
          Need bulk pricing, custom specifications, or sourcing assistance? Fill out the form below
          and our team will respond within 24 hours with a competitive quote.
        </p>

        <RFQForm />

        {/* Alternative: AI Assistant callout */}
        <div className="mt-10 rounded-lg border border-primary-200 bg-primary-50 p-6">
          <h2 className="font-semibold text-primary-800">Need Help Finding the Right Product?</h2>
          <p className="mt-1 text-sm text-primary-600">
            Our AI Sourcing Assistant can help you find products, compare specifications, and identify
            alternatives. Click the chat button in the bottom-right corner to get started.
          </p>
        </div>
      </div>
    </div>
  )
}
