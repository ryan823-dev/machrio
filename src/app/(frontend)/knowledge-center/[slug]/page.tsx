import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Breadcrumbs } from '@/components/shared/Breadcrumbs'
import { StructuredData } from '@/components/shared/StructuredData'
import { FAQSchema, FAQSection } from '@/components/shared/FAQSchema'
import { TopicClusterLinks } from '@/components/shared/TopicClusterLinks'
import { getAdjacentArticles, getArticleBySlug } from '@/lib/db/articles'
import { extractHeadings, extractPlainText, lexicalToHtml } from '@/lib/lexical-utils'
import { getArticleTopicCluster, withBrandSuffix } from '@/lib/seo'
import { getRequestLocale } from '@/i18n/server'
import { getLocalizedAlternates } from '@/i18n/seo'

// SSR: query merged database + builtin content
export const dynamic = 'force-dynamic'

// ---------------------------------------------------------------------------
// Category display helpers
// ---------------------------------------------------------------------------

const categoryLabels: Record<string, string> = {
  'buying-guide': 'Buying Guide',
  'industry-insight': 'Industry Insight',
  'how-to': 'How-To',
  'product-comparison': 'Product Comparison',
}

const categoryColors: Record<string, string> = {
  'buying-guide': 'bg-primary-50 text-primary-700',
  'industry-insight': 'bg-amber-50 text-amber-700',
  'how-to': 'bg-emerald-50 text-emerald-700',
  'product-comparison': 'bg-purple-50 text-purple-700',
}

function collapseWhitespace(value: string): string {
  return value.replace(/\s+/g, ' ').trim()
}

function extractSentenceSummary(
  value: string,
  options: { maxSentences?: number; maxChars?: number } = {},
): string {
  const normalized = collapseWhitespace(value)
  if (!normalized) return ''

  const maxSentences = options.maxSentences ?? 2
  const maxChars = options.maxChars ?? 220
  const sentences = normalized.match(/[^.!?]+[.!?]?/g)?.map((sentence) => sentence.trim()).filter(Boolean) || []

  if (sentences.length > 0) {
    const selected: string[] = []

    for (const sentence of sentences) {
      const next = [...selected, sentence].join(' ')
      if (selected.length > 0 && next.length > maxChars) break
      selected.push(sentence)
      if (selected.length >= maxSentences || next.length >= maxChars) break
    }

    if (selected.length > 0) return selected.join(' ')
  }

  if (normalized.length <= maxChars) return normalized

  const truncated = normalized.slice(0, maxChars)
  const lastSpace = truncated.lastIndexOf(' ')
  return `${(lastSpace > 80 ? truncated.slice(0, lastSpace) : truncated).trim()}...`
}

function normalizeArticleTitle(rawTitle: string, category: string): string {
  let title = rawTitle
    .replace(/\|\s*Machrio\b/gi, '')
    .replace(/\bBuy Online\b/gi, '')
    .replace(/\s*-\s*Industry\s*$/i, ' Industry Insight')
    .replace(/\s*-\s*Product\s*$/i, ' Product Comparison')
    .replace(/\s*-\s*Guide\s*$/i, ' Guide')
    .replace(/\s{2,}/g, ' ')
    .replace(/\s+([|:-])/g, '$1')
    .replace(/([|:-])(?=\S)/g, '$1 ')
    .replace(/[|:\-\s]+$/g, '')

  title = collapseWhitespace(title)

  if (!title) return rawTitle

  const categoryLabel = categoryLabels[category] || ''
  if (
    categoryLabel &&
    !new RegExp(categoryLabel, 'i').test(title) &&
    /industry insight|buying guide|product comparison|how-to/i.test(rawTitle)
  ) {
    return `${title} | ${categoryLabel}`
  }

  return title
}

// ---------------------------------------------------------------------------
// Metadata
// ---------------------------------------------------------------------------

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const locale = await getRequestLocale()
  const article = await getArticleBySlug(slug, locale)

  if (!article) {
    return { title: withBrandSuffix('Article Not Found') }
  }

  const normalizedTitle = normalizeArticleTitle(article.title, article.category || 'buying-guide')
  const normalizedMetaTitle = normalizeArticleTitle(
    article.metaTitle || normalizedTitle,
    article.category || 'buying-guide',
  )
  const title = withBrandSuffix(normalizedMetaTitle)
  const description = extractSentenceSummary(
    article.quickAnswer || article.metaDescription || article.excerpt || '',
    { maxSentences: 2, maxChars: 240 },
  )
  const imageUrl = article.featuredImage

  return {
    title,
    description,
    alternates: getLocalizedAlternates(`/knowledge-center/${slug}`, locale),
    openGraph: {
      title,
      description,
      type: 'article',
      publishedTime: article.publishedAt,
      authors: [article.author || 'Machrio Team'],
      ...(imageUrl && { images: [{ url: imageUrl }] }),
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
  }
}

// ---------------------------------------------------------------------------
// Page Component
// ---------------------------------------------------------------------------

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const locale = await getRequestLocale()
  const article = await getArticleBySlug(slug, locale)

  if (!article) {
    notFound()
  }

  const serverUrl = process.env.NEXT_PUBLIC_SERVER_URL || 'https://machrio.com'
  const publishedAt = article.publishedAt || article.createdAt
  const updatedAt = article.updatedAt || publishedAt
  const author = article.author || 'Machrio Team'
  const category = article.category || 'buying-guide'
  const normalizedTitle = normalizeArticleTitle(article.title, category)
  const contentHtml = lexicalToHtml(article.content)
  const headings = extractHeadings(article.content)
  const plainText = extractPlainText(article.content)
  const readingTime = article.readingTime || Math.ceil(plainText.split(/\s+/).filter(Boolean).length / 200) || 3
  const quickAnswerText = extractSentenceSummary(article.quickAnswer || article.excerpt || plainText, {
    maxSentences: 2,
    maxChars: 240,
  })

  const imageUrl = article.featuredImage

  // Tags
  const tags = article.tags || []
  const faqs = article.faq || []
  const topicCluster = getArticleTopicCluster(slug)
  const cta = article.cta || {
    title: 'Need Help Finding the Right Products?',
    description:
      'Our sourcing team can help you find exactly what you need. Get a custom quote within 24 hours.',
    primaryLabel: 'Request a Quote',
    primaryHref: '/rfq',
    secondaryLabel: 'Browse Products',
    secondaryHref: '/category',
  }
  const primaryCtaHref = cta.primaryAiPrompt
    ? `/knowledge-center/${slug}?ai=1&prompt=${encodeURIComponent(cta.primaryAiPrompt)}`
    : cta.primaryHref

  // Adjacent articles for navigation
  const { prev, next } = await getAdjacentArticles(slug)

  // --- BlogPosting Schema ---
  const wordCount = plainText.split(/\s+/).filter(Boolean).length

  const blogPostingSchema = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: normalizedTitle,
    description: quickAnswerText || article.excerpt,
    articleSection: categoryLabels[category] || category,
    inLanguage: 'en',
    wordCount,
    ...(tags.length > 0 && { keywords: tags.join(', ') }),
    author: {
      '@type': 'Person',
      name: author,
      url: `${serverUrl}/about`,
      jobTitle: 'Industrial Supply Specialist',
      worksFor: {
        '@type': 'Organization',
        name: 'Machrio',
        url: serverUrl,
      },
    },
    datePublished: publishedAt,
    dateModified: updatedAt,
    ...(imageUrl && { image: imageUrl }),
    publisher: {
      '@type': 'Organization',
      name: 'Machrio',
      url: serverUrl,
      logo: {
        '@type': 'ImageObject',
        url: `${serverUrl}/machrio-icon.png`,
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `${serverUrl}/knowledge-center/${slug}/`,
    },
    speakable: {
      '@type': 'SpeakableSpecification',
      cssSelector: ['[data-speakable="headline"]', '[data-speakable="summary"]'],
    },
  }

  const breadcrumbs = [
    { label: 'Home', href: '/' },
    { label: 'Knowledge Center', href: '/knowledge-center' },
    { label: normalizedTitle },
  ]

  return (
    <div className="container-main py-12">
      <StructuredData data={blogPostingSchema} />
      <FAQSchema faqs={faqs} />
      <Breadcrumbs items={breadcrumbs} />

      {/* ── Article Header ── */}
      <header className="mt-2">
        <div className="flex items-center gap-3">
          <span className={`rounded-full px-3 py-1 text-xs font-medium ${categoryColors[category] || 'bg-secondary-100 text-secondary-700'}`}>
            {categoryLabels[category] || category}
          </span>
          <span className="text-sm text-secondary-500">
            {readingTime} min read
          </span>
        </div>
        <h1 data-speakable="headline" className="mt-3 text-3xl font-bold leading-tight text-secondary-900">
          {normalizedTitle}
        </h1>
        <p data-speakable="summary" className="mt-3 text-lg text-secondary-600">
          {quickAnswerText || article.excerpt}
        </p>
        <div className="mt-4 flex items-center gap-4 text-sm text-secondary-500">
          <span>By {author}</span>
          <span>|</span>
          <time dateTime={publishedAt}>
            {new Date(publishedAt).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </time>
          {updatedAt !== publishedAt && (
            <>
              <span>|</span>
              <span>
                Last reviewed{' '}
                {new Date(updatedAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </span>
            </>
          )}
        </div>
      </header>

      {quickAnswerText && (
        <section className="mt-6 rounded-lg border border-primary-200 bg-primary-50 p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-primary-700">
            Quick Answer
          </p>
          <p className="mt-2 text-sm leading-relaxed text-primary-900">
            {quickAnswerText}
          </p>
        </section>
      )}

      {/* ── Featured Image ── */}
      {imageUrl && (
        <div className="mt-6 overflow-hidden rounded-lg">
          <img
            src={imageUrl}
            alt={normalizedTitle}
            className="h-auto w-full object-cover"
          />
        </div>
      )}

      {/* ── Content Layout: TOC + Article ── */}
      <div className="mt-8 flex gap-8">
        {/* Table of Contents (desktop sidebar) */}
        {headings.length > 2 && (
          <aside className="hidden w-56 flex-shrink-0 lg:block">
            <div className="sticky top-24">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-secondary-500">
                On This Page
              </h3>
              <nav className="mt-3 space-y-2">
                {headings.map((h) => (
                  <a
                    key={h.id}
                    href={`#${h.id}`}
                    className={`block text-sm text-secondary-600 hover:text-primary-700 ${h.level > 2 ? 'pl-3' : ''}`}
                  >
                    {h.text}
                  </a>
                ))}
              </nav>
            </div>
          </aside>
        )}

        {/* Article Body */}
        <article
          className="article-content max-w-[70ch] flex-1 [&_h2]:scroll-mt-20 [&_h3]:scroll-mt-20"
          dangerouslySetInnerHTML={{ __html: contentHtml }}
        />
      </div>

      {/* ── Tags ── */}
      {tags.length > 0 && (
        <div className="mt-8 flex flex-wrap gap-2">
          {tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full border border-secondary-200 bg-secondary-50 px-3 py-1 text-xs text-secondary-600"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      <FAQSection faqs={faqs} />

      {topicCluster && (
        <TopicClusterLinks
          title={topicCluster.title}
          description={topicCluster.description}
          categories={topicCluster.categories}
        />
      )}

      {/* ── Previous / Next Navigation ── */}
      <nav className="mt-12 grid grid-cols-2 gap-4 border-t border-secondary-200 pt-6">
        {prev ? (
          <Link
            href={`/knowledge-center/${prev.slug}`}
            className="group flex flex-col rounded-lg border border-secondary-200 p-4 transition-shadow hover:shadow-sm"
          >
            <span className="text-xs text-secondary-500">Previous</span>
            <span className="mt-1 text-sm font-medium text-secondary-800 group-hover:text-primary-700">
              {prev.title}
            </span>
          </Link>
        ) : <div />}
        {next ? (
          <Link
            href={`/knowledge-center/${next.slug}`}
            className="group flex flex-col items-end rounded-lg border border-secondary-200 p-4 text-right transition-shadow hover:shadow-sm"
          >
            <span className="text-xs text-secondary-500">Next</span>
            <span className="mt-1 text-sm font-medium text-secondary-800 group-hover:text-primary-700">
              {next.title}
            </span>
          </Link>
        ) : <div />}
      </nav>

      {/* ── CTA ── */}
      <section className="mt-10 rounded-lg border border-amber-200 bg-amber-50 p-6 text-center">
        <h2 className="text-lg font-semibold text-amber-800">
          {cta.title}
        </h2>
        <p className="mt-2 text-sm text-amber-700">
          {cta.description}
        </p>
        <div className="mt-4 flex justify-center gap-3">
          <Link href={primaryCtaHref} className="btn-accent">{cta.primaryLabel}</Link>
          <Link href={cta.secondaryHref} className="btn-secondary">{cta.secondaryLabel}</Link>
        </div>
      </section>
    </div>
  )
}
