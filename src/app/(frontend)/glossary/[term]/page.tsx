import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getPayload } from 'payload'
import config from '@payload-config'
import { Breadcrumbs } from '@/components/shared/Breadcrumbs'
import { StructuredData } from '@/components/shared/StructuredData'

// SSR: Supabase is fast enough, no need for ISR
export const dynamic = 'force-dynamic'

// ---------------------------------------------------------------------------
// Lexical richText → HTML (same pattern as knowledge-center)
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
        const text = extractChildren(node.children as unknown[])
        return text ? `<${tag}>${text}</${tag}>` : ''
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

// ---------------------------------------------------------------------------
// Category helpers
// ---------------------------------------------------------------------------

const categoryLabels: Record<string, string> = {
  safety: 'Safety & Compliance',
  maintenance: 'Maintenance & Operations',
  materials: 'Materials & Components',
  procurement: 'Procurement & Supply Chain',
  tools: 'Tools & Equipment',
  standards: 'Standards & Certifications',
}

const categoryColors: Record<string, string> = {
  safety: 'bg-red-50 text-red-700',
  maintenance: 'bg-blue-50 text-blue-700',
  materials: 'bg-amber-50 text-amber-700',
  procurement: 'bg-green-50 text-green-700',
  tools: 'bg-purple-50 text-purple-700',
  standards: 'bg-teal-50 text-teal-700',
}

// ---------------------------------------------------------------------------
// Data fetching
// ---------------------------------------------------------------------------

async function getTermBySlug(slug: string) {
  try {
    const payload = await getPayload({ config })
    const result = await payload.find({
      collection: 'glossary-terms',
      where: {
        slug: { equals: slug },
        status: { equals: 'published' },
      },
      limit: 1,
      depth: 1,
    })
    return result.docs[0] || null
  } catch {
    return null
  }
}

// ---------------------------------------------------------------------------
// Metadata
// ---------------------------------------------------------------------------

export async function generateMetadata({
  params,
}: {
  params: Promise<{ term: string }>
}): Promise<Metadata> {
  const { term: slug } = await params
  const term = await getTermBySlug(slug)

  if (!term) return { title: 'Term Not Found | Machrio' }

  const seo = term.seo as Record<string, unknown> | undefined
  const title = (seo?.metaTitle as string) || `What is ${term.term}? — Industrial Glossary | Machrio`
  const description = (seo?.metaDescription as string) || (term.definition as string) || ''

  return {
    title,
    description,
    alternates: { canonical: `/glossary/${slug}/` },
    openGraph: { title, description },
    twitter: { card: 'summary', title, description },
  }
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default async function GlossaryTermPage({
  params,
}: {
  params: Promise<{ term: string }>
}) {
  const { term: slug } = await params
  const term = await getTermBySlug(slug)

  if (!term) notFound()

  const serverUrl = process.env.NEXT_PUBLIC_SERVER_URL || 'https://machrio.com'
  const category = term.category as string
  const contentHtml = lexicalToHtml(term.content)
  const relatedTerms = (term.relatedTerms as Record<string, unknown>[] | null) || []
  const relatedCategories = (term.relatedCategories as Record<string, unknown>[] | null) || []

  // DefinedTerm Schema
  const definedTermSchema = {
    '@context': 'https://schema.org',
    '@type': 'DefinedTerm',
    name: term.term,
    description: term.definition,
    ...(term.fullName && { alternateName: term.fullName }),
    url: `${serverUrl}/glossary/${slug}/`,
    inDefinedTermSet: {
      '@type': 'DefinedTermSet',
      name: 'Machrio Industrial Glossary',
      url: `${serverUrl}/glossary/`,
    },
  }

  // FAQPage Schema — "What is X?" pattern
  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: `What is ${term.term}${term.fullName ? ` (${term.fullName})` : ''}?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text: term.definition as string,
        },
      },
      ...(term.fullName
        ? [
            {
              '@type': 'Question',
              name: `What does ${term.term} stand for?`,
              acceptedAnswer: {
                '@type': 'Answer',
                text: `${term.term} stands for ${term.fullName}.`,
              },
            },
          ]
        : []),
    ],
  }

  const breadcrumbs = [
    { label: 'Home', href: '/' },
    { label: 'Glossary', href: '/glossary' },
    { label: term.term as string },
  ]

  return (
    <div className="container-main pb-16 pt-8">
      <StructuredData data={definedTermSchema} />
      <StructuredData data={faqSchema} />
      <Breadcrumbs items={breadcrumbs} />

      {/* Header */}
      <header className="mt-2">
        <span className={`inline-block rounded-full px-3 py-1 text-xs font-medium ${categoryColors[category] || 'bg-secondary-100 text-secondary-700'}`}>
          {categoryLabels[category] || category}
        </span>
        <h1 className="mt-3 text-3xl font-bold text-secondary-900">
          What is {term.term as string}?
        </h1>
        {term.fullName && (
          <p className="mt-1 text-lg text-secondary-500">
            {term.term as string} — {term.fullName as string}
          </p>
        )}
      </header>

      {/* Definition card */}
      <div className="mt-6 rounded-lg border border-primary-200 bg-primary-50/50 p-5">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-primary-700">Definition</h2>
        <p data-speakable="definition" className="mt-2 text-base leading-relaxed text-secondary-800">
          {term.definition as string}
        </p>
      </div>

      {/* Detailed content */}
      {contentHtml && (
        <article
          className="prose prose-secondary mt-8 max-w-none prose-headings:scroll-mt-20 prose-h2:text-xl prose-h2:font-bold prose-h3:text-lg prose-h3:font-semibold prose-p:leading-relaxed prose-a:text-primary-600 prose-a:no-underline hover:prose-a:underline prose-li:text-secondary-700"
          dangerouslySetInnerHTML={{ __html: contentHtml }}
        />
      )}

      {/* Related Terms */}
      {relatedTerms.length > 0 && (
        <section className="mt-10">
          <h2 className="text-lg font-semibold text-secondary-800">Related Terms</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {relatedTerms.map((rt) => {
              const r = rt as Record<string, unknown>
              if (!r.slug) return null
              return (
                <Link
                  key={r.slug as string}
                  href={`/glossary/${r.slug}`}
                  className="rounded-lg border border-secondary-200 px-4 py-2 text-sm font-medium text-secondary-700 transition-colors hover:border-primary-400 hover:bg-primary-50 hover:text-primary-700"
                >
                  {r.term as string}
                </Link>
              )
            })}
          </div>
        </section>
      )}

      {/* Related Product Categories */}
      {relatedCategories.length > 0 && (
        <section className="mt-8">
          <h2 className="text-lg font-semibold text-secondary-800">Shop Related Categories</h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {relatedCategories.map((rc) => {
              const c = rc as Record<string, unknown>
              if (!c.slug) return null
              return (
                <Link
                  key={c.slug as string}
                  href={`/category/${c.slug}`}
                  className="flex items-center gap-3 rounded-lg border border-secondary-200 p-4 transition-shadow hover:shadow-sm"
                >
                  <svg className="h-5 w-5 flex-shrink-0 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                  <span className="text-sm font-medium text-secondary-800">{c.name as string}</span>
                </Link>
              )
            })}
          </div>
        </section>
      )}

      {/* Back to glossary + CTA */}
      <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <Link
          href="/glossary"
          className="text-sm font-medium text-primary-600 hover:text-primary-800"
        >
          &larr; Back to Glossary
        </Link>
        <Link href="/rfq" className="btn-accent">
          Need Help? Request a Quote
        </Link>
      </div>
    </div>
  )
}
