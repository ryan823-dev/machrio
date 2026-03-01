import Link from 'next/link'

interface LinkItem {
  title: string
  href: string
  description?: string
}

interface RelatedLinksProps {
  /** Related buying guides and how-to articles */
  guides?: LinkItem[]
  /** Related industry standards (ANSI, EN, ISO, etc.) */
  standards?: LinkItem[]
  /** Industry use cases / application scenarios */
  industries?: LinkItem[]
  /** Related glossary terms */
  glossaryTerms?: LinkItem[]
  /** Section heading override */
  heading?: string
}

/**
 * Modular internal linking component providing stable, predictable
 * theme-based link paths. Used on product pages and category pages
 * to strengthen topical authority and help Google understand site structure.
 *
 * Not random recommendations — structured by theme:
 * - Related Guides (buying guides, how-to articles)
 * - Standards (ANSI/EN/ISO references)
 * - Industry Use Cases
 * - Glossary Terms
 */
export function RelatedLinks({
  guides,
  standards,
  industries,
  glossaryTerms,
  heading = 'Related Resources',
}: RelatedLinksProps) {
  const hasContent =
    (guides && guides.length > 0) ||
    (standards && standards.length > 0) ||
    (industries && industries.length > 0) ||
    (glossaryTerms && glossaryTerms.length > 0)

  if (!hasContent) return null

  return (
    <section className="mt-10" aria-label={heading}>
      <h2 className="text-lg font-bold text-secondary-900">{heading}</h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {/* Related Guides */}
        {guides && guides.length > 0 && (
          <div className="rounded-lg border border-secondary-200 bg-white p-4">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-secondary-800">
              <svg className="h-4 w-4 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              Buying Guides
            </h3>
            <ul className="mt-3 space-y-2">
              {guides.map((guide) => (
                <li key={guide.href}>
                  <Link
                    href={guide.href}
                    className="group block text-sm text-secondary-600 hover:text-primary-700"
                  >
                    <span className="font-medium group-hover:underline">{guide.title}</span>
                    {guide.description && (
                      <span className="mt-0.5 block text-xs text-secondary-400">{guide.description}</span>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Standards & Compliance */}
        {standards && standards.length > 0 && (
          <div className="rounded-lg border border-secondary-200 bg-white p-4">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-secondary-800">
              <svg className="h-4 w-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              Standards &amp; Compliance
            </h3>
            <ul className="mt-3 space-y-2">
              {standards.map((standard) => (
                <li key={standard.href}>
                  <Link
                    href={standard.href}
                    className="group block text-sm text-secondary-600 hover:text-primary-700"
                  >
                    <span className="font-medium group-hover:underline">{standard.title}</span>
                    {standard.description && (
                      <span className="mt-0.5 block text-xs text-secondary-400">{standard.description}</span>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Industry Use Cases */}
        {industries && industries.length > 0 && (
          <div className="rounded-lg border border-secondary-200 bg-white p-4">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-secondary-800">
              <svg className="h-4 w-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              Industry Applications
            </h3>
            <ul className="mt-3 space-y-2">
              {industries.map((industry) => (
                <li key={industry.href}>
                  <Link
                    href={industry.href}
                    className="group block text-sm text-secondary-600 hover:text-primary-700"
                  >
                    <span className="font-medium group-hover:underline">{industry.title}</span>
                    {industry.description && (
                      <span className="mt-0.5 block text-xs text-secondary-400">{industry.description}</span>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Glossary Terms */}
        {glossaryTerms && glossaryTerms.length > 0 && (
          <div className="rounded-lg border border-secondary-200 bg-white p-4">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-secondary-800">
              <svg className="h-4 w-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Key Terms
            </h3>
            <ul className="mt-3 space-y-2">
              {glossaryTerms.map((term) => (
                <li key={term.href}>
                  <Link
                    href={term.href}
                    className="group block text-sm text-secondary-600 hover:text-primary-700"
                  >
                    <span className="font-medium group-hover:underline">{term.title}</span>
                    {term.description && (
                      <span className="mt-0.5 block text-xs text-secondary-400">{term.description}</span>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </section>
  )
}
