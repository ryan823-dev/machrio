'use client'

import Link from 'next/link'
import { useCart } from '@/contexts/CartContext'
import { type CompareProduct } from '@/contexts/CompareContext'
import { SearchFilters } from '@/components/search/SearchFilters'
import { SearchSortBar } from '@/components/search/SearchSortBar'
import { CompareCheckbox } from '@/components/search/ProductCompare'

interface ProductCardData {
  name: string
  slug: string
  categorySlug: string
  sku: string
  brand: string
  primaryImage?: string
  shortDescription: string
  pricing: {
    basePrice?: number
    currency: string
    priceUnit?: string
  }
  purchaseMode: 'both' | 'buy-online' | 'rfq-only'
  availability: string
}

interface SearchResultsContentProps {
  query: string
  results: {
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
  }
  gridProducts: ProductCardData[]
  view: 'list' | 'grid'
  currentPage: number
  buildPageUrl: (page: number) => string
}

export function SearchResultsContent({
  query,
  results,
  gridProducts,
  view,
  currentPage,
  buildPageUrl,
}: SearchResultsContentProps) {
  const { addItem } = useCart()

  return (
    <>
      <div className="lg:grid lg:grid-cols-[220px_1fr] lg:gap-6">
        {/* Sidebar filters */}
        <div>
          <SearchFilters
            query={query}
            brands={results.facets.brands}
            categories={results.facets.categories}
            priceRange={results.facets.priceRange}
            availability={results.facets.availability}
            totalProducts={results.totalDocs}
          />
        </div>

        {/* Main content */}
        <div className="min-w-0">
          <SearchSortBar
            query={query}
            totalProducts={results.totalDocs}
            brands={results.facets.brands}
            categories={results.facets.categories}
          />

          {/* Product list/grid */}
          {view === 'grid' ? (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
              {gridProducts.map((product) => (
                <SearchGridCard key={product.sku} product={product} />
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {gridProducts.map((product) => (
                <SearchListRow key={product.sku} product={product} onAddToCart={addItem} />
              ))}
            </div>
          )}

          {/* Pagination */}
          {results.totalPages > 1 && (
            <div className="mt-8 flex items-center justify-center gap-2">
              {results.hasPrevPage && (
                <Link
                  href={buildPageUrl(currentPage - 1)}
                  className="rounded border border-secondary-300 px-3 py-1.5 text-sm text-secondary-600 hover:bg-secondary-50"
                >
                  Previous
                </Link>
              )}
              {Array.from({ length: Math.min(results.totalPages, 7) }, (_, i) => {
                let pageNum: number
                if (results.totalPages <= 7) {
                  pageNum = i + 1
                } else if (currentPage <= 4) {
                  pageNum = i + 1
                } else if (currentPage >= results.totalPages - 3) {
                  pageNum = results.totalPages - 6 + i
                } else {
                  pageNum = currentPage - 3 + i
                }
                return (
                  <Link
                    key={pageNum}
                    href={buildPageUrl(pageNum)}
                    className={`rounded border px-3 py-1.5 text-sm ${
                      pageNum === currentPage
                        ? 'border-primary-200 bg-primary-50 font-medium text-primary-700'
                        : 'border-secondary-200 text-secondary-600 hover:bg-secondary-50'
                    }`}
                  >
                    {pageNum}
                  </Link>
                )
              })}
              {results.hasNextPage && (
                <Link
                  href={buildPageUrl(currentPage + 1)}
                  className="rounded border border-secondary-300 px-3 py-1.5 text-sm text-secondary-600 hover:bg-secondary-50"
                >
                  Next
                </Link>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  )
}

function SearchGridCard({ product }: { product: ProductCardData }) {
  const compareProduct = toCompareProduct(product)

  return (
    <div className="card flex flex-col p-4">
      <div className="mb-1 flex justify-end">
        <CompareCheckbox product={compareProduct} />
      </div>
      <Link
        href={`/product/${product.categorySlug}/${product.slug}`}
        className="flex flex-1 flex-col"
      >
        <div className="mb-3 flex h-48 items-center justify-center rounded bg-secondary-50">
          {product.primaryImage ? (
            <img src={product.primaryImage} alt={product.name} className="h-full w-full object-contain" loading="lazy" decoding="async" />
          ) : (
            <svg className="h-16 w-16 text-secondary-200" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
            </svg>
          )}
        </div>
        <p className="text-xs text-secondary-500">{product.brand}</p>
        <h3 className="mt-1 line-clamp-2 text-sm font-medium text-secondary-800">{product.name}</h3>
        <div className="mt-auto pt-3">
          <PriceDisplay product={product} />
        </div>
      </Link>
    </div>
  )
}

function SearchListRow({
  product,
  onAddToCart,
}: {
  product: ProductCardData
  onAddToCart: (item: { productId: string; sku: string; name: string; slug: string; categorySlug: string; image?: string; price: number; priceUnit?: string }) => void
}) {
  const compareProduct = toCompareProduct(product)

  return (
    <div className="flex gap-4 rounded-lg border border-secondary-200 bg-white p-4 transition-shadow hover:shadow-sm">
      {/* Image */}
      <Link
        href={`/product/${product.categorySlug}/${product.slug}`}
        className="flex h-28 w-28 flex-shrink-0 items-center justify-center rounded bg-secondary-50"
      >
        {product.primaryImage ? (
          <img src={product.primaryImage} alt={product.name} className="h-full w-full object-contain" loading="lazy" decoding="async" />
        ) : (
          <svg className="h-10 w-10 text-secondary-200" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
          </svg>
        )}
      </Link>

      {/* Details */}
      <div className="flex flex-1 flex-col">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-secondary-500">
            <span>{product.brand}</span>
            <span>|</span>
            <span>SKU: {product.sku}</span>
          </div>
          <CompareCheckbox product={compareProduct} />
        </div>
        <Link
          href={`/product/${product.categorySlug}/${product.slug}`}
          className="mt-1 text-sm font-medium text-secondary-800 hover:text-primary-700"
        >
          {product.name}
        </Link>
        <p className="mt-1 line-clamp-1 text-xs text-secondary-500">{product.shortDescription}</p>
        <div className="mt-auto flex items-center justify-between pt-2">
          <PriceDisplay product={product} />
          <AvailabilityBadge availability={product.availability} />
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-shrink-0 flex-col items-end justify-center gap-2">
        {(product.purchaseMode === 'both' || product.purchaseMode === 'buy-online') && product.pricing.basePrice && (
          <button
            onClick={() => onAddToCart({
              productId: product.sku,
              sku: product.sku,
              name: product.name,
              slug: product.slug,
              categorySlug: product.categorySlug,
              image: product.primaryImage,
              price: product.pricing.basePrice || 0,
              priceUnit: product.pricing.priceUnit,
            })}
            className="btn-primary px-4 py-1.5 text-xs"
          >
            Add to Cart
          </button>
        )}
        {(product.purchaseMode === 'both' || product.purchaseMode === 'rfq-only') && (
          <Link href={`/rfq?product=${product.sku}`} className="btn-secondary px-4 py-1.5 text-xs">
            Get Quote
          </Link>
        )}
      </div>
    </div>
  )
}

function PriceDisplay({ product }: { product: ProductCardData }) {
  if (product.purchaseMode === 'rfq-only' || !product.pricing.basePrice) {
    return <span className="text-sm font-semibold text-amber-600">Contact for Price</span>
  }
  return (
    <span className="text-sm font-semibold text-secondary-900">
      ${product.pricing.basePrice.toFixed(2)}
      {product.pricing.priceUnit && (
        <span className="text-xs font-normal text-secondary-500"> /{product.pricing.priceUnit}</span>
      )}
    </span>
  )
}

function AvailabilityBadge({ availability }: { availability: string }) {
  if (availability === 'in-stock') return <span className="badge-success">In Stock</span>
  if (availability === 'made-to-order') return <span className="badge-warning">Made to Order</span>
  return <span className="badge-info">Contact</span>
}

function toCompareProduct(product: ProductCardData): CompareProduct {
  return {
    id: product.sku,
    name: product.name,
    slug: product.slug,
    categorySlug: product.categorySlug,
    sku: product.sku,
    brand: product.brand,
    image: product.primaryImage,
    price: product.pricing.basePrice,
    currency: product.pricing.currency,
    priceUnit: product.pricing.priceUnit,
    availability: product.availability,
  }
}
