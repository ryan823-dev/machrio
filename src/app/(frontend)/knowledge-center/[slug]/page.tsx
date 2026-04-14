import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Breadcrumbs } from '@/components/shared/Breadcrumbs'
import { StructuredData } from '@/components/shared/StructuredData'
import { FAQSchema, FAQSection } from '@/components/shared/FAQSchema'
import { getAdjacentArticles, getArticleBySlug } from '@/lib/db/articles'

// SSR: query merged database + builtin content
export const dynamic = 'force-dynamic'

// ---------------------------------------------------------------------------
// Lexical richText helpers
// ---------------------------------------------------------------------------

function extractChildren(children: unknown[]): string {
  if (!Array.isArray(children)) return ''
  return children
    .map((node) => {
      const n = node as Record<string, unknown>
      if (n.type === 'text') {
        let text = n.text as string
        if (n.format === 1 || n.bold) text = `<strong>${text}</strong>`
        if (n.format === 2 || n.italic) text = `<em>${text}</em>`
        return text
      }
      if (n.type === 'link') {
        const url = ((n.fields as Record<string, unknown>)?.url as string) || '#'
        const inner = extractChildren(n.children as unknown[])
        return `<a href="${url}" class="text-primary-600 underline hover:text-primary-800">${inner}</a>`
      }
      if (n.children) return extractChildren(n.children as unknown[])
      return ''
    })
    .join('')
}

function lexicalToHtml(richText: unknown): string {
  if (!richText || typeof richText !== 'object') return ''
  const root = (richText as Record<string, unknown>).root as Record<string, unknown> | undefined
  if (!root || !Array.isArray(root.children)) return ''
  return (root.children as Record<string, unknown>[])
    .map((node) => {
      if (node.type === 'paragraph') {
        const text = extractChildren(node.children as unknown[])
        return text ? `<p>${text}</p>` : ''
      }
      if (node.type === 'heading') {
        const tag = (node.tag as string) || 'h3'
        const id = extractChildren(node.children as unknown[])
          .replace(/<[^>]+>/g, '')
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-|-$/g, '')
        const text = extractChildren(node.children as unknown[])
        return text ? `<${tag} id="${id}">${text}</${tag}>` : ''
      }
      if (node.type === 'list') {
        const tag = node.listType === 'number' ? 'ol' : 'ul'
        const items = (node.children as Record<string, unknown>[])
          .map((li) => `<li>${extractChildren(li.children as unknown[])}</li>`)
          .join('')
        return `<${tag}>${items}</${tag}>`
      }
      return ''
    })
    .filter(Boolean)
    .join('\n')
}

function extractPlainText(richText: unknown): string {
  if (!richText || typeof richText !== 'object') return ''
  const root = (richText as Record<string, unknown>).root as Record<string, unknown> | undefined
  if (!root) return ''
  return extractChildrenPlain(root.children as unknown[])
}

function extractChildrenPlain(children: unknown[]): string {
  if (!Array.isArray(children)) return ''
  return children
    .map((node) => {
      const n = node as Record<string, unknown>
      if (n.type === 'text') return n.text as string
      if (n.children) return extractChildrenPlain(n.children as unknown[])
      return ''
    })
    .join('')
}

function extractHeadings(richText: unknown): { id: string; text: string; level: number }[] {
  if (!richText || typeof richText !== 'object') return []
  const root = (richText as Record<string, unknown>).root as Record<string, unknown> | undefined
  if (!root || !Array.isArray(root.children)) return []
  return (root.children as Record<string, unknown>[])
    .filter((node) => node.type === 'heading')
    .map((node) => {
      const text = extractChildrenPlain(node.children as unknown[])
        .replace(/<[^>]+>/g, '')
      const id = text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
      const tag = (node.tag as string) || 'h3'
      const level = tag === 'h2' ? 2 : 3
      return { id, text, level }
    })
    .filter((h) => h.text)
}

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

// ---------------------------------------------------------------------------
// Metadata
// ---------------------------------------------------------------------------

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const article = await getArticleBySlug(slug)

  if (!article) {
    return { title: 'Article Not Found | Machrio' }
  }

  const title = article.metaTitle || `${article.title} | Machrio`
  const description = article.metaDescription || article.excerpt || ''
  const imageUrl = article.featuredImage

  return {
    title,
    description,
    alternates: { canonical: `/knowledge-center/${slug}` },
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
  const article = await getArticleBySlug(slug)

  if (!article) {
    notFound()
  }

  const serverUrl = process.env.NEXT_PUBLIC_SERVER_URL || 'https://machrio.com'
  const publishedAt = article.publishedAt || article.createdAt
  const author = article.author || 'Machrio Team'
  const category = article.category || 'buying-guide'
  const contentHtml = lexicalToHtml(article.content)
  const headings = extractHeadings(article.content)
  const plainText = extractPlainText(article.content)
  const readingTime = article.readingTime || Math.ceil(plainText.split(/\s+/).filter(Boolean).length / 200) || 3

  const imageUrl = article.featuredImage

  // Tags
  const tags = article.tags || []
  const faqs = article.faq || []

  // Adjacent articles for navigation
  const { prev, next } = await getAdjacentArticles(slug)

  // --- BlogPosting Schema ---
  const wordCount = plainText.split(/\s+/).filter(Boolean).length

  const blogPostingSchema = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: article.title,
    description: article.excerpt,
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
    dateModified: article.updatedAt,
    ...(imageUrl && { image: imageUrl }),
    publisher: {
      '@type': 'Organization',
      name: 'Machrio',
      url: serverUrl,
      logo: {
        '@type': 'ImageObject',
        url: `${serverUrl}/machrio-logo.png`,
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `${serverUrl}/knowledge-center/${slug}/`,
    },
  }

  const breadcrumbs = [
    { label: 'Home', href: '/' },
    { label: 'Knowledge Center', href: '/knowledge-center' },
    { label: article.title },
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
          {article.title}
        </h1>
        <p data-speakable="summary" className="mt-3 text-lg text-secondary-600">
          {article.excerpt}
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
        </div>
      </header>

      {article.quickAnswer && (
        <section className="mt-6 rounded-lg border border-primary-200 bg-primary-50 p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-primary-700">
            Quick Answer
          </p>
          <p className="mt-2 text-sm leading-relaxed text-primary-900">
            {article.quickAnswer}
          </p>
        </section>
      )}

      {/* ── Featured Image ── */}
      {imageUrl && (
        <div className="mt-6 overflow-hidden rounded-lg">
          <img
            src={imageUrl}
            alt={article.title}
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
                    className={`block text-sm text-secondary-600 hover:text-primary-700 ${h.level === 3 ? 'pl-3' : ''}`}
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
          Need Help Finding the Right Products?
        </h2>
        <p className="mt-2 text-sm text-amber-700">
          Our sourcing team can help you find exactly what you need. Get a custom quote within 24 hours.
        </p>
        <div className="mt-4 flex justify-center gap-3">
          <Link href="/rfq" className="btn-accent">Request a Quote</Link>
          <Link href="/category" className="btn-secondary">Browse Products</Link>
        </div>
      </section>
    </div>
  )
}
