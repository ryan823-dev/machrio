import type { Metadata } from 'next'
import Link from 'next/link'
import { getPayload } from 'payload'
import config from '@payload-config'

export const metadata: Metadata = {
  title: 'Knowledge Center — Guides, Tips & Industry Insights | Machrio',
  description: 'Industrial buying guides, product comparisons, how-to articles, and industry insights. Expert content to help you make informed MRO purchasing decisions.',
  alternates: { canonical: '/knowledge-center/' },
  openGraph: {
    title: 'Knowledge Center — Guides, Tips & Industry Insights | Machrio',
    description: 'Industrial buying guides, product comparisons, how-to articles, and industry insights.',
  },
}

// ---------------------------------------------------------------------------
// Quick-link guides (existing support pages)
// ---------------------------------------------------------------------------

const guides = [
  { title: 'How to Order', description: 'Step-by-step ordering guide', href: '/how-to-order', icon: '📦' },
  { title: 'Payment Methods', description: 'Cards, bank transfer & Net 30', href: '/payment-methods', icon: '💳' },
  { title: 'Shipping & Delivery', description: 'Shipping options & DDP terms', href: '/shipping-policy', icon: '🚚' },
  { title: 'Returns & Refunds', description: '30-day return policy', href: '/return-refund', icon: '↩️' },
  { title: 'Customs & Duties', description: 'DDP shipping & import duties', href: '/clearance-duties', icon: '🌍' },
  { title: 'FAQ', description: 'Common questions answered', href: '/faq', icon: '❓' },
]

// ---------------------------------------------------------------------------
// Article category metadata
// ---------------------------------------------------------------------------

const categoryLabels: Record<string, string> = {
  'buying-guide': 'Buying Guide',
  'industry-insight': 'Industry Insight',
  'how-to': 'How-To',
  'product-comparison': 'Product Comparison',
}

const categoryColors: Record<string, string> = {
  'buying-guide': 'bg-primary-50 text-primary-700 border-primary-200',
  'industry-insight': 'bg-amber-50 text-amber-700 border-amber-200',
  'how-to': 'bg-emerald-50 text-emerald-700 border-emerald-200',
  'product-comparison': 'bg-purple-50 text-purple-700 border-purple-200',
}

// ---------------------------------------------------------------------------
// Data fetching
// ---------------------------------------------------------------------------

async function getArticles(category?: string, page = 1, limit = 12) {
  try {
    const payload = await getPayload({ config })
    const where: any = { status: { equals: 'published' } }
    if (category) {
      where.category = { equals: category }
    }
    const result = await payload.find({
      collection: 'articles',
      where,
      limit,
      page,
      sort: '-publishedAt',
      depth: 1,
    })
    return result
  } catch {
    return { docs: [], totalDocs: 0, totalPages: 0, page: 1, hasNextPage: false, hasPrevPage: false }
  }
}

// ---------------------------------------------------------------------------
// Page Component
// ---------------------------------------------------------------------------

export default async function KnowledgeCenterPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; page?: string }>
}) {
  const sp = await searchParams
  const selectedCategory = sp.category || undefined
  const currentPage = parseInt(sp.page || '1', 10)
  const articlesResult = await getArticles(selectedCategory, currentPage)
  const articles = articlesResult.docs
  const hasArticles = articles.length > 0

  const allCategories = ['buying-guide', 'industry-insight', 'how-to', 'product-comparison']

  return (
    <div className="container-main py-12">
      <h1 className="text-3xl font-bold text-secondary-900">
        Knowledge Center
        <span className="block text-lg font-normal text-secondary-500 whitespace-nowrap">Guides, Tips &amp; Industry Insights</span>
      </h1>
      <p className="mt-2 max-w-2xl text-lg text-secondary-600">
        Expert guides, industry insights, and practical tips to help you make informed MRO purchasing decisions.
      </p>

      {/* ── Quick Links (existing support pages) ── */}
      <section className="mt-8">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-secondary-500">Quick Links</h2>
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {guides.map((guide) => (
            <Link
              key={guide.href}
              href={guide.href}
              className="flex items-center gap-2 rounded-lg border border-secondary-200 bg-white px-3 py-2.5 text-sm font-medium text-secondary-700 transition-all hover:border-primary-200 hover:shadow-sm"
            >
              <span className="text-lg">{guide.icon}</span>
              <span>{guide.title}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* ── Articles Section ── */}
      <section className="mt-12">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-secondary-800">Articles & Guides</h2>
          {articlesResult.totalDocs > 0 && (
            <span className="text-sm text-secondary-500">{articlesResult.totalDocs} articles</span>
          )}
        </div>

        {/* Category Filter */}
        <div className="mt-4 flex flex-wrap gap-2">
          <Link
            href="/knowledge-center"
            className={`rounded-full border px-4 py-1.5 text-sm font-medium transition-colors ${
              !selectedCategory
                ? 'border-primary-600 bg-primary-600 text-white'
                : 'border-secondary-300 text-secondary-600 hover:border-primary-300 hover:text-primary-700'
            }`}
          >
            All
          </Link>
          {allCategories.map((cat) => (
            <Link
              key={cat}
              href={`/knowledge-center?category=${cat}`}
              className={`rounded-full border px-4 py-1.5 text-sm font-medium transition-colors ${
                selectedCategory === cat
                  ? 'border-primary-600 bg-primary-600 text-white'
                  : 'border-secondary-300 text-secondary-600 hover:border-primary-300 hover:text-primary-700'
              }`}
            >
              {categoryLabels[cat]}
            </Link>
          ))}
        </div>

        {/* Article Cards Grid */}
        {hasArticles ? (
          <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {articles.map((article) => {
              const featuredImage = article.featuredImage as Record<string, unknown> | null
              const imageUrl = featuredImage?.url as string | undefined
              const publishedAt = article.publishedAt as string | undefined
              const cat = article.category as string
              const readingTime = article.readingTime as number || 3

              return (
                <Link
                  key={article.slug as string}
                  href={`/knowledge-center/${article.slug}`}
                  className="group flex flex-col overflow-hidden rounded-lg border border-secondary-200 bg-white transition-shadow hover:shadow-md"
                >
                  {/* Image */}
                  <div className="flex h-44 items-center justify-center bg-secondary-50">
                    {imageUrl ? (
                      <img src={imageUrl} alt={article.title as string} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex flex-col items-center text-secondary-300">
                        <svg className="h-12 w-12" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex flex-1 flex-col p-4">
                    <div className="flex items-center gap-2">
                      <span className={`rounded-full border px-2 py-0.5 text-[11px] font-medium ${categoryColors[cat] || 'bg-secondary-50 text-secondary-600 border-secondary-200'}`}>
                        {categoryLabels[cat] || cat}
                      </span>
                      <span className="text-xs text-secondary-400">{readingTime} min</span>
                    </div>
                    <h3 className="mt-2 line-clamp-2 text-sm font-semibold text-secondary-800 group-hover:text-primary-700">
                      {article.title as string}
                    </h3>
                    <p className="mt-1 line-clamp-2 text-xs text-secondary-500">
                      {article.excerpt as string}
                    </p>
                    {publishedAt && (
                      <time className="mt-auto pt-3 text-xs text-secondary-400" dateTime={publishedAt}>
                        {new Date(publishedAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </time>
                    )}
                  </div>
                </Link>
              )
            })}
          </div>
        ) : (
          <div className="mt-8 rounded-lg border border-secondary-200 bg-secondary-50 py-12 text-center">
            <svg className="mx-auto h-12 w-12 text-secondary-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            <p className="mt-3 text-secondary-500">No articles published yet. Check back soon!</p>
            <p className="mt-1 text-sm text-secondary-400">We&apos;re preparing expert guides and industry insights for you.</p>
          </div>
        )}

        {/* Pagination */}
        {articlesResult.totalPages > 1 && (
          <div className="mt-8 flex items-center justify-center gap-2">
            {articlesResult.hasPrevPage && (
              <Link
                href={`/knowledge-center?${selectedCategory ? `category=${selectedCategory}&` : ''}page=${currentPage - 1}`}
                className="rounded-lg border border-secondary-300 px-4 py-2 text-sm text-secondary-600 hover:bg-secondary-50"
              >
                Previous
              </Link>
            )}
            <span className="px-4 text-sm text-secondary-500">
              Page {currentPage} of {articlesResult.totalPages}
            </span>
            {articlesResult.hasNextPage && (
              <Link
                href={`/knowledge-center?${selectedCategory ? `category=${selectedCategory}&` : ''}page=${currentPage + 1}`}
                className="rounded-lg border border-secondary-300 px-4 py-2 text-sm text-secondary-600 hover:bg-secondary-50"
              >
                Next
              </Link>
            )}
          </div>
        )}
      </section>

      {/* ── CTA ── */}
      <section className="mt-12 rounded-lg border border-primary-200 bg-primary-50 p-6">
        <h2 className="text-xl font-semibold text-primary-800">Need Help?</h2>
        <p className="mt-2 text-primary-700">
          Our AI assistant is available 24/7 to help you find products, compare options, and answer questions.
          For complex inquiries, our sourcing team responds within 24 hours.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link href="/rfq" className="btn-accent">
            Contact Us
          </Link>
          <a href="mailto:sales@machrio.com" className="btn-secondary">
            Email: sales@machrio.com
          </a>
        </div>
      </section>
    </div>
  )
}
