import Link from 'next/link'
import type { Metadata } from 'next'
import { StructuredData } from '@/components/shared/StructuredData'
import { HeroAIChat } from '@/components/shared/HeroAIChat'
import { CategoryPagination } from '@/components/shared/CategoryPagination'
import { getRequestLocale } from '@/i18n/server'
import { getDictionary } from '@/i18n/dictionaries'
import { withLocalePath } from '@/i18n/routing'
import { getLocalizedAlternates } from '@/i18n/seo'

// SSR 模式，从数据库获取实时数据
export const dynamic = 'force-dynamic'

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale()
  return {
    title: 'Machrio - Tools, Parts & Industrial Essentials | Buy Online or Request a Quote',
    description:
      'Shop tools, parts, and industrial essentials including MRO supplies, safety equipment, and maintenance products. Buy online with fast shipping or request a bulk quote. AI-powered sourcing assistance available.',
    alternates: getLocalizedAlternates('/', locale),
    openGraph: {
      title: 'Machrio - Tools, Parts & Industrial Essentials',
      description:
        'Shop tools, parts, and industrial essentials. Buy online with fast shipping or request a bulk quote.',
      url: process.env.NEXT_PUBLIC_SERVER_URL || 'https://machrio.com',
    },
    twitter: {
      card: 'summary',
      title: 'Machrio - Tools, Parts & Industrial Essentials',
      description:
        'Shop tools, parts, and industrial essentials. Buy online with fast shipping or request a bulk quote.',
    },
  }
}

// 从数据库获取分类和产品数量（实时数据）
async function getCategoriesWithCounts() {
  const { getL1CategoriesWithCounts } = await import('@/lib/db-queries')
  return await getL1CategoriesWithCounts()
}

const industries = [
  { name: 'Manufacturing', slug: 'manufacturing' },
  { name: 'Construction', slug: 'construction' },
  { name: 'Automotive', slug: 'automotive' },
  { name: 'Healthcare', slug: 'healthcare' },
  { name: 'Food & Beverage', slug: 'food-beverage' },
  { name: 'Warehouse & Logistics', slug: 'warehouse' },
]

export default async function HomePage() {
  const locale = await getRequestLocale()
  const t = getDictionary(locale)
  // 使用静态数据，避免数据库连接问题
  const categoriesWithCounts = await getCategoriesWithCounts()

  const orgSchema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Machrio',
    url: process.env.NEXT_PUBLIC_SERVER_URL || 'https://machrio.com',
    description: 'Tools, parts, and industrial essentials platform',
    contactPoint: {
      '@type': 'ContactPoint',
      email: 'support@machrio.com',
      contactType: 'sales',
      availableLanguage: ['English'],
    },
  }

  return (
    <>
      <StructuredData data={orgSchema} />

      {/* Hero */}
      <section className="bg-gradient-to-br from-primary-900 via-primary-800 to-primary-900 py-12 text-white">
        <div className="container-main">
          <div className="grid gap-8 lg:grid-cols-2 lg:gap-12 items-center">
            {/* Left: Text content */}
            <div>
              <h1 className="text-3xl font-bold leading-tight md:text-4xl lg:text-5xl">
                {t.home.heroTitle}{' '}
                <span className="text-amber-400">{t.home.heroAccent}</span>
              </h1>
              <p className="mt-4 text-lg text-primary-200">
                {t.home.heroText}
              </p>
              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <Link href={withLocalePath('/category', locale)} className="btn-accent px-8 py-3 text-base">
                  {t.home.shopAll}
                </Link>
                <Link href={withLocalePath('/rfq', locale)} className="btn-secondary border-white/20 bg-white/10 text-white hover:bg-white/20 px-8 py-3 text-base">
                  {t.home.requestQuote}
                </Link>
              </div>
            </div>
            
            {/* Right: AI Chat */}
            <div className="lg:pl-4">
              <HeroAIChat />
            </div>
          </div>
        </div>
      </section>

      {/* Trust bar - Enhanced with distinct icons */}
      <section className="border-b border-secondary-200 bg-white py-5">
        <div className="container-main grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-8">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-emerald-100">
              <svg className="h-5 w-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-secondary-800">{t.home.trust.shipping}</p>
              <p className="text-xs text-secondary-500">{t.home.trust.shippingText}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-blue-100">
              <svg className="h-5 w-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-secondary-800">{t.home.trust.suppliers}</p>
              <p className="text-xs text-secondary-500">{t.home.trust.suppliersText}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-amber-100">
              <svg className="h-5 w-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-secondary-800">{t.home.trust.payments}</p>
              <p className="text-xs text-secondary-500">{t.home.trust.paymentsText}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-purple-100">
              <svg className="h-5 w-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-secondary-800">{t.home.trust.support}</p>
              <p className="text-xs text-secondary-500">{t.home.trust.supportText}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Categories */}
      <section className="py-12">
        <div className="container-main">
          <h2 className="text-2xl font-bold text-secondary-900">{t.home.browseCategories}</h2>
          <p className="mt-1 text-secondary-500">{t.home.browseCategoriesText}</p>
          <div className="mt-6">
            <CategoryPagination categories={categoriesWithCounts} itemsPerPage={12} />
          </div>
        </div>
      </section>

      {/* Dual CTA: Buy Online vs RFQ */}
      <section className="bg-secondary-50 py-12">
        <div className="container-main">
          <h2 className="text-center text-2xl font-bold text-secondary-900">{t.home.twoWays}</h2>
          <p className="mt-2 text-center text-secondary-500">
            {t.home.twoWaysText}
          </p>
          <div className="mt-8 grid gap-6 md:grid-cols-2">
            {/* Buy Online */}
            <div className="card border-emerald-200 bg-white">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100">
                  <svg className="h-5 w-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-secondary-900">{t.home.buyOnline}</h3>
              </div>
              <ul className="mt-4 space-y-2 text-sm text-secondary-600">
                {t.home.buyOnlinePoints.map((point) => (
                  <li key={point} className="flex items-start gap-2">
                    <svg className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                    {point}
                  </li>
                ))}
              </ul>
              <Link href={withLocalePath('/category', locale)} className="btn-primary mt-6 w-full">
                {t.home.shopNow}
              </Link>
            </div>

            {/* RFQ */}
            <div className="card border-amber-200 bg-white">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100">
                  <svg className="h-5 w-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-secondary-900">{t.home.requestQuote}</h3>
              </div>
              <ul className="mt-4 space-y-2 text-sm text-secondary-600">
                {t.home.rfqPoints.map((point) => (
                  <li key={point} className="flex items-start gap-2">
                    <svg className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                    {point}
                  </li>
                ))}
              </ul>
              <Link href={withLocalePath('/rfq', locale)} className="btn-accent mt-6 w-full">
                {t.nav.getQuote}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Industry Solutions */}
      <section className="py-12">
        <div className="container-main">
          <h2 className="text-2xl font-bold text-secondary-900">{t.home.industryTitle}</h2>
          <p className="mt-1 text-secondary-500">{t.home.industryText}</p>
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-6">
            {industries.map((ind) => (
              <Link
                key={ind.slug}
                href={withLocalePath(`/industry/${ind.slug}`, locale)}
                className="rounded-lg border border-secondary-200 bg-white px-4 py-4 text-center text-sm font-medium text-secondary-700 transition-all hover:border-primary-300 hover:bg-primary-50 hover:text-primary-700"
              >
                {ind.name}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* SEO Content */}
      <section className="border-t border-secondary-200 bg-secondary-50 py-10">
        <div className="container-main">
          <div className="max-w-3xl text-sm leading-relaxed text-secondary-500">
            <p>
              Machrio is your one-stop source for tools, parts, and industrial essentials. We carry thousands of
              MRO products across categories including safety and PPE, hand tools, fasteners, abrasives, electrical
              supplies, plumbing, material handling, and HVAC equipment. Whether you need a single pair of safety
              gloves or a bulk order of thousands, Machrio gives you transparent pricing, fast shipping, and the
              option to request custom quotes for large or specialized orders. Our AI-powered sourcing assistant
              is available 24/7 to help you find the right products, compare specifications, and navigate our catalog.
            </p>
          </div>
        </div>
      </section>
    </>
  )
}
