import Link from 'next/link'
import { ProductImage } from '@/components/shared/ProductImage'

interface RelatedProduct {
  name: string
  slug: string
  categorySlug: string
  sku: string
  imageUrl?: string
  price?: number
  currency?: string
  source?: 'manual' | 'same-brand' | 'same-category'
}

interface RelatedProductsProps {
  products: RelatedProduct[]
  title?: string
  maxDisplay?: number
}

export function RelatedProducts({ 
  products, 
  title = 'Related Products',
  maxDisplay = 8 
}: RelatedProductsProps) {
  if (!products || products.length === 0) return null

  const displayProducts = products.slice(0, maxDisplay)

  return (
    <section className="mt-12 border-t border-secondary-200 pt-8">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-secondary-900">{title}</h2>
        <span className="text-sm text-secondary-500">{products.length} products</span>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
        {displayProducts.map((product) => {
          const hasPrice = typeof product.price === 'number' && Number.isFinite(product.price)

          return (
            <Link
              key={product.sku}
              href={`/product/${product.categorySlug}/${product.slug}`}
              className="group rounded-lg border border-secondary-200 bg-white p-3 transition-shadow hover:shadow-md"
            >
              <div className="flex aspect-[4/3] items-center justify-center rounded bg-secondary-50">
                <ProductImage
                  src={product.imageUrl}
                  alt={product.name}
                  className="h-full w-full object-contain"
                  fallbackClassName="h-12 w-12 text-secondary-300"
                />
              </div>
              <div className="mt-2">
                <p className="line-clamp-2 text-xs font-medium text-secondary-700 group-hover:text-primary-600">
                  {product.name}
                </p>
                {hasPrice ? (
                  <p className="mt-1 text-sm font-semibold text-secondary-900">
                    {product.currency === 'CAD' ? 'C$' : '$'}{product.price.toFixed(2)}
                  </p>
                ) : (
                  <p className="mt-1 text-xs text-amber-600">Contact for Price</p>
                )}
              </div>
            </Link>
          )
        })}
      </div>
    </section>
  )
}
