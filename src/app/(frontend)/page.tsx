import Link from 'next/link'
import type { Metadata } from 'next'
import { StructuredData } from '@/components/shared/StructuredData'
import { HeroAIChat } from '@/components/shared/HeroAIChat'
import { CategoryPagination } from '@/components/shared/CategoryPagination'

// SSR 模式，从数据库获取实时数据
export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Machrio - Tools, Parts & Industrial Essentials | Buy Online or Request a Quote',
  description:
    'Shop tools, parts, and industrial essentials including MRO supplies, safety equipment, and maintenance products. Buy online with fast shipping or request a bulk quote. AI-powered sourcing assistance available.',
  alternates: { canonical: '/' },
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
      email: 'sales@machrio.com',
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
                Tools, Parts &amp; Industrial Essentials.{' '}
                <span className="text-amber-400">Buy Online or Get a Quote.</span>
              </h1>
              <p className="mt-4 text-lg text-primary-200">
                Shop thousands of industrial products with transparent pricing and fast shipping.
                Need bulk quantities or custom specs? Our AI assistant and sourcing team are here to help.
              </p>
              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <Link href="/category" className="btn-accent px-8 py-3 text-base">
                  Shop All Products
                </Link>
                <Link href="/rfq" className="btn-secondary border-white/20 bg-white/10 text-white hover:bg-white/20 px-8 py-3 text-base">
                  Request a Quote
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
              <p className="text-sm font-semibold text-secondary-800">Flexible Shipping</p>
              <p className="text-xs text-secondary-500">Air, sea, and U.S. warehouse options</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-blue-100">
              <svg className="h-5 w-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-secondary-800">Verified Suppliers</p>
              <p className="text-xs text-secondary-500">Industrial-grade quality</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-amber-100">
              <svg className="h-5 w-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-secondary-800">PO & Net 30</p>
              <p className="text-xs text-secondary-500">Flexible B2B payments</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-purple-100">
              <svg className="h-5 w-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-secondary-800">24/7 AI Support</p>
              <p className="text-xs text-secondary-500">Instant sourcing help</p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Categories */}
      <section className="py-12">
        <div className="container-main">
          <h2 className="text-2xl font-bold text-secondary-900">Browse Categories</h2>
          <p className="mt-1 text-secondary-500">Find the right industrial products for your operation</p>
          <div className="mt-6">
            <CategoryPagination categories={categoriesWithCounts} itemsPerPage={12} />
          </div>
        </div>
      </section>

      {/* Dual CTA: Buy Online vs RFQ */}
      <section className="bg-secondary-50 py-12">
        <div className="container-main">
          <h2 className="text-center text-2xl font-bold text-secondary-900">Two Ways to Buy</h2>
          <p className="mt-2 text-center text-secondary-500">
            Standard products ship today. Custom requirements? We quote within 24 hours.
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
                <h3 className="text-lg font-semibold text-secondary-900">Buy Online</h3>
              </div>
              <ul className="mt-4 space-y-2 text-sm text-secondary-600">
                <li className="flex items-start gap-2">
                  <svg className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                  Transparent pricing with volume discounts
                </li>
                <li className="flex items-start gap-2">
                  <svg className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                  Credit card, PO, or Net 30 payment
                </li>
                <li className="flex items-start gap-2">
                  <svg className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                  Flexible air, sea, and DDP shipping routes
                </li>
              </ul>
              <Link href="/category" className="btn-primary mt-6 w-full">
                Shop Now
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
                <h3 className="text-lg font-semibold text-secondary-900">Request a Quote</h3>
              </div>
              <ul className="mt-4 space-y-2 text-sm text-secondary-600">
                <li className="flex items-start gap-2">
                  <svg className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                  Bulk & custom quantity pricing
                </li>
                <li className="flex items-start gap-2">
                  <svg className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                  Custom specifications & sourcing
                </li>
                <li className="flex items-start gap-2">
                  <svg className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                  Response within 24 hours
                </li>
              </ul>
              <Link href="/rfq" className="btn-accent mt-6 w-full">
                Get a Quote
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Industry Solutions */}
      <section className="py-12">
        <div className="container-main">
          <h2 className="text-2xl font-bold text-secondary-900">Solutions for Your Industry</h2>
          <p className="mt-1 text-secondary-500">Curated products and expert support for your specific sector</p>
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-6">
            {industries.map((ind) => (
              <Link
                key={ind.slug}
                href={`/industry/${ind.slug}`}
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
