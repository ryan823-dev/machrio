import type { Metadata } from 'next'
import { Breadcrumbs } from '@/components/shared/Breadcrumbs'
import { RFQForm } from '@/components/forms/RFQForm'
import { withBrandSuffix } from '@/lib/seo'
import { getRequestLocale } from '@/i18n/server'
import { getDictionary } from '@/i18n/dictionaries'
import { getLocalizedAlternates } from '@/i18n/seo'

export const dynamic = 'force-dynamic'

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale()
  return {
    title: withBrandSuffix('Request a Quote'),
    description: 'Request a quote for bulk orders, custom specifications, or products without listed pricing. Our team responds within 24 hours.',
    alternates: getLocalizedAlternates('/rfq', locale),
    openGraph: {
      title: withBrandSuffix('Request a Quote'),
      description: 'Request a quote for bulk orders, custom specifications, or products without listed pricing. Our team responds within 24 hours.',
    },
  }
}

export default async function RFQPage() {
  const locale = await getRequestLocale()
  const t = getDictionary(locale)
  const breadcrumbs = [
    { label: 'Home', href: '/' },
    { label: t.rfqPage.title },
  ]

  return (
    <div className="container-main pb-12">
      <Breadcrumbs items={breadcrumbs} />

      <div className="mx-auto max-w-3xl">
        <h1 className="text-2xl font-bold text-secondary-900">{t.rfqPage.title}</h1>
        <p className="mt-2 text-sm text-secondary-600">
          {t.rfqPage.intro}
        </p>

        <RFQForm />

        {/* Alternative: AI Assistant callout */}
        <div className="mt-10 rounded-lg border border-primary-200 bg-primary-50 p-6">
          <h2 className="font-semibold text-primary-800">{t.rfqPage.helpTitle}</h2>
          <p className="mt-1 text-sm text-primary-600">
            {t.rfqPage.helpText}
          </p>
        </div>
      </div>
    </div>
  )
}
