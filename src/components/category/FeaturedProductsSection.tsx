import Link from 'next/link'
import { ProductImage } from '@/components/shared/ProductImage'

interface FeaturedProduct {
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
  packageQty?: number
  purchaseMode: 'both' | 'buy-online' | 'rfq-only'
  availability: string
}

interface FeaturedProductsSectionProps {
  title: string
  products: FeaturedProduct[]
  viewAllHref: string
  viewAllLabel?: string
}

export function FeaturedProductsSection({ 
  title, 
  products, 
  viewAllHref,
  viewAllLabel = 'View All Products'
}: FeaturedProductsSectionProps) {
  if (products.length === 0) return null

  return (
    <section className="mt-8">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-secondary-900">{title}</h2>
        <Link 
          href={viewAllHref}
          className="text-sm font-medium text-primary-600 hover:text-primary-700"
        >
          {viewAllLabel} &rarr;
        </Link>
      </div>
      
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
        {products.slice(0, 8).map((product) => (
          <ProductCard key={product.sku} product={product} />
        ))}
      </div>
    </section>
  )
}

function ProductCard({ product }: { product: FeaturedProduct }) {
  const unitPrice = product.packageQty && product.packageQty > 1 && product.pricing.basePrice
    ? (product.pricing.basePrice / product.packageQty)
    : null

  return (
    <Link
      href={`/product/${product.categorySlug}/${product.slug}`}
      className="group rounded-lg border border-secondary-200 bg-white p-4 transition-all hover:border-primary-200 hover:shadow-md"
    >
      <div className="mb-3 flex h-40 items-center justify-center rounded bg-secondary-50">
        <ProductImage
          src={product.primaryImage}
          alt={product.name}
          className="h-full w-full object-contain"
          fallbackClassName="h-12 w-12 text-secondary-200"
        />
      </div>
      <p className="text-xs text-secondary-500">{product.brand}</p>
      <h3 className="mt-1 line-clamp-2 text-sm font-medium text-secondary-800 group-hover:text-primary-700">
        {product.name}
      </h3>
      {product.packageQty && product.packageQty > 1 && (
        <p className="mt-1 text-xs text-secondary-400">
          Pkg Qty: {product.packageQty}
        </p>
      )}
      <div className="mt-3">
        {product.purchaseMode === 'rfq-only' || !product.pricing.basePrice ? (
          <span className="text-sm font-semibold text-amber-600">Contact for Price</span>
        ) : (
          <span className="text-sm font-semibold text-secondary-900">
            ${product.pricing.basePrice.toFixed(2)}
            {unitPrice && (
              <span className="text-xs font-normal text-secondary-500"> (${unitPrice.toFixed(2)}/ea)</span>
            )}
          </span>
        )}
      </div>
    </Link>
  )
}
