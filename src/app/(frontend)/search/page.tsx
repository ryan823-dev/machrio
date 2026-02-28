import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'

export const dynamic = 'force-dynamic'

interface SearchResult {
  id: string
  name: string
  slug: string
  sku: string
  shortDescription: string
  externalImageUrl?: string
  brand: { name: string; slug: string } | null
  category: { name: string; slug: string } | null
  pricing: { basePrice: number; currency: string } | null
  availability: string
}

interface SearchResponse {
  products: SearchResult[]
  totalDocs: number
  totalPages: number
  page: number
  hasNextPage: boolean
  hasPrevPage: boolean
  query: string
}

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>
}): Promise<Metadata> {
  const { q } = await searchParams
  const query = q?.trim()

  if (!query) {
    return {
      title: 'Search Products | Machrio',
      description: 'Search our catalog of tools, parts, and industrial essentials.',
    }
  }

  return {
    title: `Search: ${query} | Machrio`,
    description: `Search results for "${query}" - Tools, parts, and industrial essentials.`,
    robots: { index: false, follow: true }, // Don't index search results
  }
}

async function searchProducts(query: string, page: number): Promise<SearchResponse | null> {
  const serverUrl = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'
  
  try {
    const res = await fetch(
      `${serverUrl}/api/search?q=${encodeURIComponent(query)}&page=${page}&limit=24`,
      { cache: 'no-store' }
    )
    if (!res.ok) return null
    return res.json()
  } catch {
    return null
  }
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>
}) {
  const { q, page: pageParam } = await searchParams
  const query = q?.trim() || ''
  const currentPage = Math.max(parseInt(pageParam || '1'), 1)

  const results = query ? await searchProducts(query, currentPage) : null

  return (
    <div className="container-main py-8">
      {/* Search Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-secondary-900">
          {query ? `Search Results for "${query}"` : 'Search Products'}
        </h1>
        {results && results.totalDocs > 0 && (
          <p className="mt-1 text-secondary-600">
            Found {results.totalDocs} product{results.totalDocs !== 1 ? 's' : ''}
          </p>
        )}
      </div>

      {/* Search Form */}
      <form action="/search" method="GET" className="mb-8">
        <div className="flex gap-2 max-w-xl">
          <input
            type="search"
            name="q"
            defaultValue={query}
            placeholder="Search products, brands, SKUs..."
            className="input-field flex-1 py-3"
            autoFocus
          />
          <button type="submit" className="btn-primary px-6">
            Search
          </button>
        </div>
      </form>

      {/* No Query State */}
      {!query && (
        <div className="rounded-lg border border-secondary-200 bg-secondary-50 p-8 text-center">
          <p className="text-secondary-600">Enter a search term to find products.</p>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            <Link href="/search?q=safety+gloves" className="btn-secondary text-sm">
              Safety Gloves
            </Link>
            <Link href="/search?q=tape" className="btn-secondary text-sm">
              Tape
            </Link>
            <Link href="/search?q=3M" className="btn-secondary text-sm">
              3M Products
            </Link>
          </div>
        </div>
      )}

      {/* No Results State */}
      {query && results && results.products.length === 0 && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-8 text-center">
          <p className="text-amber-800 font-medium">No products found for &quot;{query}&quot;</p>
          <p className="mt-2 text-amber-700 text-sm">
            Try different keywords or browse our categories.
          </p>
          <div className="mt-4 flex flex-wrap justify-center gap-3">
            <Link href="/category" className="btn-primary">
              Browse Categories
            </Link>
            <Link href="/rfq" className="btn-accent">
              Request a Quote
            </Link>
          </div>
        </div>
      )}

      {/* Results Grid */}
      {results && results.products.length > 0 && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {results.products.map((product) => (
              <Link
                key={product.id}
                href={`/product/${product.category?.slug || 'uncategorized'}/${product.slug}`}
                className="card group flex flex-col transition-all hover:border-primary-200 hover:shadow-md"
              >
                {/* Product Image */}
                <div className="relative aspect-[4/3] w-full overflow-hidden rounded-lg bg-secondary-100">
                  {product.externalImageUrl ? (
                    <Image
                      src={product.externalImageUrl}
                      alt={product.name}
                      fill
                      className="object-contain transition-transform group-hover:scale-105"
                      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-secondary-400">
                      <svg className="h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  )}
                </div>

                {/* Product Info */}
                <div className="mt-3 flex flex-1 flex-col">
                  {product.brand && (
                    <span className="text-xs font-medium text-primary-600">{product.brand.name}</span>
                  )}
                  <h2 className="mt-1 line-clamp-2 text-sm font-semibold text-secondary-800 group-hover:text-primary-700">
                    {product.name}
                  </h2>
                  <p className="mt-1 text-xs text-secondary-500">SKU: {product.sku}</p>
                  
                  <div className="mt-auto pt-3">
                    {product.pricing?.basePrice ? (
                      <span className="text-lg font-bold text-secondary-900">
                        ${product.pricing.basePrice.toFixed(2)}
                      </span>
                    ) : (
                      <span className="text-sm font-medium text-amber-600">Request Quote</span>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* Pagination */}
          {results.totalPages > 1 && (
            <div className="mt-8 flex items-center justify-center gap-2">
              {results.hasPrevPage && (
                <Link
                  href={`/search?q=${encodeURIComponent(query)}&page=${currentPage - 1}`}
                  className="btn-secondary px-4 py-2"
                >
                  Previous
                </Link>
              )}
              <span className="px-4 py-2 text-sm text-secondary-600">
                Page {results.page} of {results.totalPages}
              </span>
              {results.hasNextPage && (
                <Link
                  href={`/search?q=${encodeURIComponent(query)}&page=${currentPage + 1}`}
                  className="btn-secondary px-4 py-2"
                >
                  Next
                </Link>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}
