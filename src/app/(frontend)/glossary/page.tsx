import type { Metadata } from 'next'
import Link from 'next/link'
import { getGlossaryTerms } from '@/lib/db'
import { Breadcrumbs } from '@/components/shared/Breadcrumbs'
import { StructuredData } from '@/components/shared/StructuredData'

// SSR: 直接查询 PostgreSQL
export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Industrial Glossary — MRO & Supply Chain Terms | Machrio',
  description: 'Definitions of key industrial terms, acronyms, and concepts used in MRO procurement, workplace safety, maintenance operations, and supply chain management.',
  alternates: { canonical: '/glossary/' },
  openGraph: {
    title: 'Industrial Glossary — MRO & Supply Chain Terms | Machrio',
    description: 'Definitions of key industrial terms, acronyms, and concepts used in MRO procurement, workplace safety, maintenance operations, and supply chain management.',
  },
}

const categoryLabels: Record<string, string> = {
  safety: 'Safety & Compliance',
  maintenance: 'Maintenance & Operations',
  materials: 'Materials & Components',
  procurement: 'Procurement & Supply Chain',
  tools: 'Tools & Equipment',
  standards: 'Standards & Certifications',
}

const categoryColors: Record<string, string> = {
  safety: 'bg-red-50 text-red-700 border-red-200',
  maintenance: 'bg-blue-50 text-blue-700 border-blue-200',
  materials: 'bg-amber-50 text-amber-700 border-amber-200',
  procurement: 'bg-green-50 text-green-700 border-green-200',
  tools: 'bg-purple-50 text-purple-700 border-purple-200',
  standards: 'bg-teal-50 text-teal-700 border-teal-200',
}

export default async function GlossaryPage() {
  const terms = await getGlossaryTerms(500)
  const serverUrl = process.env.NEXT_PUBLIC_SERVER_URL || 'https://machrio.com'

  // Group terms by first letter
  const grouped = new Map<string, typeof terms>()
  for (const term of terms) {
    const letter = (term.term?.[0] || '#').toUpperCase()
    if (!grouped.has(letter)) grouped.set(letter, [])
    grouped.get(letter)!.push(term)
  }
  const sortedLetters = [...grouped.keys()].sort()

  // DefinedTermSet schema
  const glossarySchema = {
    '@context': 'https://schema.org',
    '@type': 'DefinedTermSet',
    name: 'Machrio Industrial Glossary',
    description: 'Definitions of key industrial terms, acronyms, and concepts used in MRO procurement, workplace safety, and supply chain management.',
    url: `${serverUrl}/glossary/`,
    hasDefinedTerm: terms.map((t) => ({
      '@type': 'DefinedTerm',
      name: t.term,
      description: t.definition,
      url: `${serverUrl}/glossary/${t.slug}/`,
    })),
  }

  const breadcrumbs = [{ label: 'Home', href: '/' }, { label: 'Glossary' }]

  return (
    <div className="container-main pb-16 pt-8">
      <StructuredData data={glossarySchema} />
      <Breadcrumbs items={breadcrumbs} />

      <header className="mt-2">
        <h1 className="text-3xl font-bold text-secondary-900">Industrial Glossary</h1>
        <p className="mt-3 max-w-3xl text-sm leading-relaxed text-secondary-600">
          Key terms, acronyms, and concepts used in MRO procurement, workplace safety,
          maintenance operations, and industrial supply chain management.
        </p>
      </header>

      {/* Letter index */}
      {sortedLetters.length > 0 && (
        <nav className="mt-6 flex flex-wrap gap-1" aria-label="Alphabetical index">
          {sortedLetters.map((letter) => (
            <a
              key={letter}
              href={`#letter-${letter}`}
              className="flex h-8 w-8 items-center justify-center rounded border border-secondary-200 text-sm font-medium text-secondary-700 transition-colors hover:border-primary-400 hover:bg-primary-50 hover:text-primary-700"
            >
              {letter}
            </a>
          ))}
        </nav>
      )}

      {/* Terms by letter */}
      <div className="mt-8 space-y-10">
        {sortedLetters.map((letter) => (
          <section key={letter} id={`letter-${letter}`}>
            <h2 className="border-b border-secondary-200 pb-2 text-xl font-bold text-secondary-800">
              {letter}
            </h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {grouped.get(letter)!.map((term) => {
                const cat = term.category || 'standards'
                return (
                  <Link
                    key={term.slug}
                    href={`/glossary/${term.slug}`}
                    className="group rounded-lg border border-secondary-200 p-4 transition-shadow hover:shadow-md"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-semibold text-secondary-900 group-hover:text-primary-700">
                        {term.term}
                      </h3>
                      <span
                        className={`flex-shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-medium ${categoryColors[cat] || 'bg-secondary-50 text-secondary-600 border-secondary-200'}`}
                      >
                        {categoryLabels[cat] || cat}
                      </span>
                    </div>
                    {term.full_name && (
                      <p className="mt-1 text-xs text-secondary-500">
                        {term.full_name}
                      </p>
                    )}
                    <p className="mt-2 line-clamp-2 text-sm text-secondary-600">
                      {term.definition}
                    </p>
                  </Link>
                )
              })}
            </div>
          </section>
        ))}
      </div>

      {terms.length === 0 && (
        <p className="mt-12 text-center text-sm text-secondary-500">
          No glossary terms published yet. Check back soon!
        </p>
      )}

      {/* CTA */}
      <section className="mt-12 rounded-lg border border-primary-200 bg-primary-50 p-6 text-center">
        <h2 className="text-lg font-semibold text-primary-900">
          Looking for a Specific Product?
        </h2>
        <p className="mt-2 text-sm text-primary-700">
          Browse our catalog of industrial supplies or request a custom quote.
        </p>
        <div className="mt-4 flex justify-center gap-3">
          <Link href="/category" className="btn-primary">Browse Products</Link>
          <Link href="/rfq" className="btn-accent">Request a Quote</Link>
        </div>
      </section>
    </div>
  )
}