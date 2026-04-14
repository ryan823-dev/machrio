import type { Metadata } from 'next'
import Link from 'next/link'
import { getArticles } from '@/lib/db/articles'

// SSR: 直接查询 PostgreSQL
export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Knowledge Center — Guides, Tips & Industry Insights | Machrio',
  description: 'Industrial buying guides, product comparisons, how-to articles, and industry insights. Expert content to help you make informed MRO purchasing decisions.',
  alternates: { canonical: '/knowledge-center' },
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
  { title: 'Industrial Glossary', description: 'MRO terms & definitions', href: '/glossary', icon: '📖' },
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
// Article cover gradient mapping (when no featured image)
// ---------------------------------------------------------------------------

const coverThemes: { keywords: string[]; gradient: string; icon: string }[] = [
  { keywords: ['safety', 'protection', 'ppe', 'respiratory', 'eye', 'face', 'hearing', 'head', 'fall'], gradient: 'from-red-500 to-orange-400', icon: '🛡️' },
  { keywords: ['footwear', 'shoe', 'boot'], gradient: 'from-amber-500 to-yellow-400', icon: '👢' },
  { keywords: ['hand', 'arm', 'glove'], gradient: 'from-blue-500 to-cyan-400', icon: '🧤' },
  { keywords: ['clothing', 'workwear', 'garment'], gradient: 'from-indigo-500 to-blue-400', icon: '👔' },
  { keywords: ['fire', 'extinguisher'], gradient: 'from-red-600 to-red-400', icon: '🧯' },
  { keywords: ['first aid', 'wound', 'medical'], gradient: 'from-emerald-500 to-green-400', icon: '🩹' },
  { keywords: ['lockout', 'tagout', 'loto'], gradient: 'from-yellow-500 to-amber-400', icon: '🔒' },
  { keywords: ['label', 'identification', 'sign'], gradient: 'from-violet-500 to-purple-400', icon: '🏷️' },
  { keywords: ['tape', 'adhesive', 'glue', 'sealant'], gradient: 'from-teal-500 to-emerald-400', icon: '🔗' },
  { keywords: ['packaging', 'shipping', 'packing', 'protective packaging', 'strapping', 'cable tie'], gradient: 'from-sky-500 to-blue-400', icon: '📦' },
  { keywords: ['cleaning', 'janitorial', 'filtration', 'purification'], gradient: 'from-cyan-500 to-teal-400', icon: '🧹' },
  { keywords: ['lighting', 'flashlight', 'lamp'], gradient: 'from-yellow-400 to-orange-400', icon: '💡' },
  { keywords: ['storage', 'shelving', 'workbench', 'desk'], gradient: 'from-gray-500 to-slate-400', icon: '🗄️' },
  { keywords: ['material handling', 'lifting', 'pulling', 'caster', 'wheel', 'transporting'], gradient: 'from-orange-500 to-amber-400', icon: '🏗️' },
  { keywords: ['seal', 'gasket', 'power transmission'], gradient: 'from-slate-500 to-gray-400', icon: '⚙️' },
  { keywords: ['valve', 'hose', 'fitting', 'plumbing', 'pipe'], gradient: 'from-blue-600 to-indigo-400', icon: '🔧' },
]

function getCoverTheme(title: string) {
  const lower = title.toLowerCase()
  for (const theme of coverThemes) {
    if (theme.keywords.some((kw) => lower.includes(kw))) {
      return theme
    }
  }
  return { gradient: 'from-primary-500 to-primary-400', icon: '📋' }
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
  const articlesResult = await getArticles({
    category: selectedCategory,
    page: currentPage,
  })
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
              const imageUrl = article.featuredImage
              const publishedAt = article.publishedAt
              const cat = article.category || 'buying-guide'
              const readingTime = article.readingTime || 3
              const title = article.title
              const coverTheme = getCoverTheme(title)

              return (
                <Link
                  key={article.slug}
                  href={`/knowledge-center/${article.slug}`}
                  className="group flex flex-col overflow-hidden rounded-lg border border-secondary-200 bg-white transition-shadow hover:shadow-md"
                >
                  {/* Image / Cover */}
                  <div className="flex h-44 items-center justify-center">
                    {imageUrl ? (
                      <img src={imageUrl} alt={title} className="h-full w-full object-cover" />
                    ) : (
                      <div className={`flex h-full w-full flex-col items-center justify-center bg-gradient-to-br ${coverTheme.gradient} transition-transform group-hover:scale-[1.02]`}>
                        <span className="text-5xl drop-shadow-md">{coverTheme.icon}</span>
                        <span className="mt-2 max-w-[80%] text-center text-xs font-semibold leading-tight text-white/90 drop-shadow">
                          {title.replace(/^How to Choose\s*/i, '').replace(/:\s*Complete Buying Guide.*$/i, '')}
                        </span>
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
                      {article.title}
                    </h3>
                    <p className="mt-1 line-clamp-2 text-xs text-secondary-500">
                      {article.excerpt}
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
