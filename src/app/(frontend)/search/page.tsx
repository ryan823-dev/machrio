import { Suspense } from 'react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { CompareFloatingBar } from '@/components/search/ProductCompare'
import { SearchResultsContent } from './SearchResultsContent'

export const dynamic = 'force-dynamic'

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
    robots: { index: false, follow: true },
  }
}

interface SearchResponse {
  products: Array<{
    id: string
    name: string
    slug: string
    sku: string
    shortDescription: string
    externalImageUrl?: string
    brand: { name: string; slug: string } | null
    category: { name: string; slug: string } | null
    pricing: { basePrice: number; currency: string; priceUnit?: string } | null
    packageQty?: number | null
    availability: string
    purchaseMode: string
  }>
  facets: {
    brands: { name: string; slug: string; count: number }[]
    categories: { name: string; slug: string; count: number }[]
    priceRange: { min: number; max: number }
    availability: { value: string; count: number }[]
  }
  totalDocs: number
  totalPages: number
  page: number
  hasNextPage: boolean
  hasPrevPage: boolean
  query: string
}

async function searchProducts(
  query: string,
  page: number,
  filters: Record<string, string>
): Promise<SearchResponse | null> {
  const serverUrl = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'

  try {
    const params = new URLSearchParams()
    params.set('q', query)
    params.set('page', String(page))
    params.set('limit', '24')
    for (const [key, value] of Object.entries(filters)) {
      if (value) params.set(key, value)
    }

    const res = await fetch(`${serverUrl}/api/search?${params.toString()}`, {
      cache: 'no-store',
    })
    if (!res.ok) return null
    return res.json()
  } catch {
    return null
  }
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string
    page?: string
    brand?: string
    category?: string
    minPrice?: string
    maxPrice?: string
    availability?: string
    sort?: string
    view?: string
  }>
}) {
  const params = await searchParams
  const query = params.q?.trim() || ''
  const currentPage = Math.max(parseInt(params.page || '1'), 1)
  const view = (params.view === 'grid' ? 'grid' : 'list') as 'list' | 'grid'

  const filters: Record<string, string> = {}
  if (params.brand) filters.brand = params.brand
  if (params.category) filters.category = params.category
  if (params.minPrice) filters.minPrice = params.minPrice
  if (params.maxPrice) filters.maxPrice = params.maxPrice
  if (params.availability) filters.availability = params.availability
  if (params.sort) filters.sort = params.sort

  const results = query ? await searchProducts(query, currentPage, filters) : null

  // Map products to ProductGrid format
  const gridProducts = results?.products.map((p) => {
    const primaryCategory = p.category
    let categorySlug = 'products'
    if (primaryCategory) {
      categorySlug = primaryCategory.slug
    }

    return {
      name: p.name,
      slug: p.slug,
      categorySlug,
      sku: p.sku,
      brand: p.brand?.name || 'Unbranded',
      primaryImage: p.externalImageUrl,
      shortDescription: p.shortDescription || '',
      pricing: {
        basePrice: p.pricing?.basePrice,
        currency: p.pricing?.currency || 'USD',
        priceUnit: p.pricing?.priceUnit,
      },
      packageQty: p.packageQty || undefined,
      purchaseMode: (p.purchaseMode as 'both' | 'buy-online' | 'rfq-only') || 'both',
      availability: p.availability || 'contact',
    }
  }) || []

  // Serialize filter params so the client component can build page URLs
  const filterParams: Record<string, string> = {}
  if (params.brand) filterParams.brand = params.brand
  if (params.category) filterParams.category = params.category
  if (params.minPrice) filterParams.minPrice = params.minPrice
  if (params.maxPrice) filterParams.maxPrice = params.maxPrice
  if (params.availability) filterParams.availability = params.availability
  if (params.sort) filterParams.sort = params.sort
  if (params.view) filterParams.view = params.view

  return (
    <div className="container-main py-8">
      {/* Search Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-secondary-900">
          {query ? `Search Results for "${query}"` : 'Search Products'}
        </h1>
        {results && results.totalDocs > 0 && (
          <p className="mt-1 text-secondary-500">
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
            <Link href="/search?q=safety+gloves" className="btn-secondary text-sm">Safety Gloves</Link>
            <Link href="/search?q=tape" className="btn-secondary text-sm">Tape</Link>
            <Link href="/search?q=3M" className="btn-secondary text-sm">3M Products</Link>
            <Link href="/search?q=platform+truck" className="btn-secondary text-sm">Platform Trucks</Link>
          </div>
        </div>
      )}

      {/* Results with filters */}
      {query && results && results.totalDocs > 0 && (
        <Suspense fallback={<div className="h-96 animate-pulse rounded bg-secondary-100" />}>
          <SearchResultsContent
            query={query}
            results={results}
            gridProducts={gridProducts}
            view={view}
            currentPage={currentPage}
            filterParams={filterParams}
          />
        </Suspense>
      )}

      {/* No Results State */}
      {query && results && results.products.length === 0 && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-8 text-center">
          <p className="text-amber-800 font-medium">No products found for &quot;{query}&quot;</p>
          <p className="mt-2 text-amber-700 text-sm">
            Try different keywords, remove filters, or browse our categories.
          </p>
          <div className="mt-4 flex flex-wrap justify-center gap-3">
            <Link href="/category" className="btn-primary">Browse Categories</Link>
            <Link href="/rfq" className="btn-accent">Request a Quote</Link>
          </div>
        </div>
      )}

      <CompareFloatingBar />
    </div>
  )
}
