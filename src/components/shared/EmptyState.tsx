import Link from 'next/link'

interface EmptyStateProps {
  title?: string
  message?: string
  /** Popular categories to suggest when no results found */
  suggestedCategories?: { name: string; slug: string }[]
  /** Show search suggestion text */
  showSearchSuggestion?: boolean
}

/**
 * Unified empty state component for search results, category pages,
 * and filtered product listings. Provides remedial suggestions
 * and links to popular categories to keep users engaged.
 */
export function EmptyState({
  title = 'No products found',
  message = 'Try adjusting your filters or search terms.',
  suggestedCategories,
  showSearchSuggestion = true,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center" role="status">
      <svg
        className="h-16 w-16 text-secondary-300"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
        />
      </svg>
      <h3 className="mt-4 text-lg font-semibold text-secondary-800">{title}</h3>
      <p className="mt-2 max-w-md text-sm text-secondary-500">{message}</p>

      {showSearchSuggestion && (
        <div className="mt-6 rounded-lg border border-secondary-200 bg-secondary-50 px-6 py-4 text-left">
          <p className="text-sm font-medium text-secondary-700">Suggestions:</p>
          <ul className="mt-2 space-y-1.5 text-sm text-secondary-500">
            <li>Check your spelling or try broader search terms</li>
            <li>Remove some filters to see more results</li>
            <li>
              <Link href="/rfq" className="font-medium text-primary-600 hover:text-primary-800">
                Submit an RFQ
              </Link>
              {' '}and our sourcing team will find it for you
            </li>
          </ul>
        </div>
      )}

      {suggestedCategories && suggestedCategories.length > 0 && (
        <div className="mt-6">
          <p className="text-sm font-medium text-secondary-600">Popular Categories</p>
          <div className="mt-3 flex flex-wrap justify-center gap-2">
            {suggestedCategories.map((cat) => (
              <Link
                key={cat.slug}
                href={`/category/${cat.slug}`}
                className="rounded-full border border-secondary-200 bg-white px-4 py-1.5 text-sm text-secondary-700 transition-colors hover:border-primary-300 hover:bg-primary-50 hover:text-primary-700"
              >
                {cat.name}
              </Link>
            ))}
          </div>
        </div>
      )}

      <Link
        href="/"
        className="mt-6 text-sm font-medium text-primary-600 hover:text-primary-800"
      >
        Back to Home
      </Link>
    </div>
  )
}
