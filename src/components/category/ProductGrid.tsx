'use client'

import Link from 'next/link'
import { useCart } from '@/contexts/CartContext'

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
  packageQty?: number
  packageUnit?: string
}

interface ProductGridProps {
  products: ProductCardData[]
  view?: 'list' | 'grid'
}

export function ProductGrid({ products, view = 'list' }: ProductGridProps) {
  const { addItem } = useCart()
  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center py-16 text-center">
        <svg className="h-12 w-12 text-secondary-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <p className="mt-3 text-secondary-500">No products found matching your filters.</p>
        <p className="text-sm text-secondary-400">Try adjusting your filter criteria.</p>
      </div>
    )
  }

  if (view === 'grid') {
    return (
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
        {products.map((product) => (
          <GridCard key={product.sku} product={product} />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {products.map((product) => (
        <ListRow key={product.sku} product={product} onAddToCart={addItem} />
      ))}
    </div>
  )
}

function GridCard({ product }: { product: ProductCardData }) {
  return (
    <Link
      href={`/product/${product.categorySlug}/${product.slug}`}
      className="card flex flex-col p-4"
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
      {product.packageQty && (
        <p className="mt-1 text-xs text-secondary-400">
          Pkg Qty: {product.packageQty}{product.packageUnit ? ` / ${product.packageUnit}` : ''}
        </p>
      )}
      <div className="mt-auto pt-3">
        <PriceDisplay product={product} />
      </div>
    </Link>
  )
}

function ListRow({ product, onAddToCart }: { product: ProductCardData; onAddToCart: (item: { productId: string; sku: string; name: string; slug: string; categorySlug: string; image?: string; price: number; priceUnit?: string }) => void }) {
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
        <div className="flex items-center gap-2 text-xs text-secondary-500">
          <span>{product.brand}</span>
          <span>|</span>
          <span>SKU: {product.sku}</span>
          {product.packageQty && (
            <>
              <span>|</span>
              <span className="font-medium text-primary-600">
                Pkg Qty: {product.packageQty}{product.packageUnit ? ` / ${product.packageUnit}` : ''}
              </span>
            </>
          )}
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
  const unitPrice = product.packageQty && product.packageQty > 1 && product.pricing.basePrice
    ? (product.pricing.basePrice / product.packageQty)
    : null
  if (product.purchaseMode === 'rfq-only' || !product.pricing.basePrice) {
    return <span className="text-sm font-semibold text-amber-600">Contact for Price</span>
  }
  return (
    <span className="text-sm font-semibold text-secondary-900">
      ${product.pricing.basePrice.toFixed(2)}
      {unitPrice && (
        <span className="text-xs font-normal text-secondary-500"> (${unitPrice.toFixed(2)}/each)</span>
      )}
      {product.pricing.priceUnit && (
        <span className="text-xs font-normal text-secondary-500"> /{product.pricing.priceUnit}</span>
      )}
    </span>
  )
}

function AvailabilityBadge({ availability }: { availability: string }) {
  if (availability === 'in-stock') {
    return <span className="badge-success">In Stock</span>
  }
  if (availability === 'made-to-order') {
    return <span className="badge-warning">Made to Order</span>
  }
  return <span className="badge-info">Contact</span>
}
