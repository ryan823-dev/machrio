'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

interface BoughtTogetherProduct {
  id: string
  name: string
  slug: string
  categorySlug: string
  sku: string
  imageUrl?: string
  price?: number
  currency: string
  coOccurrence: number
}

interface BoughtTogetherProps {
  productId: string
  maxDisplay?: number
}

/**
 * Displays "Frequently Bought Together" recommendations
 * Based on order history co-occurrence analysis
 */
export function BoughtTogether({ productId, maxDisplay = 4 }: BoughtTogetherProps) {
  const [products, setProducts] = useState<BoughtTogetherProduct[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!productId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLoading(false)
      return
    }

    fetch(`/api/bought-together?productId=${productId}&limit=${maxDisplay}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.products && Array.isArray(data.products) && data.products.length > 0) {
          setProducts(data.products)
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [productId, maxDisplay])

  if (loading || products.length === 0) return null

  const bundleTotal = products.reduce((sum, p) => sum + (p.price || 0), 0)

  return (
    <section className="mt-12 border-t border-secondary-200 pt-8">
      <div className="flex items-center gap-2">
        <h2 className="text-lg font-bold text-secondary-900">Frequently Bought Together</h2>
        <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
          Based on orders
        </span>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        {products.map((product, i) => (
          <div key={product.sku} className="flex items-center gap-3">
            {i > 0 && (
              <span className="text-xl font-light text-secondary-300">+</span>
            )}
            <Link
              href={`/product/${product.categorySlug}/${product.slug}`}
              className="group flex w-40 flex-col items-center rounded-lg border border-secondary-200 bg-white p-3 transition-all hover:border-primary-300 hover:shadow-md"
            >
              <div className="flex h-28 w-28 items-center justify-center rounded bg-secondary-50">
                {product.imageUrl ? (
                  <img
                    src={product.imageUrl}
                    alt={product.name}
                    className="h-full w-full object-contain" loading="lazy" decoding="async"
                  />
                ) : (
                  <svg className="h-8 w-8 text-secondary-300" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
              <p className="mt-2 line-clamp-2 text-center text-xs font-medium text-secondary-700 group-hover:text-primary-700">
                {product.name}
              </p>
              {product.price ? (
                <p className="mt-1 text-sm font-semibold text-secondary-900">
                  ${product.price.toFixed(2)}
                </p>
              ) : (
                <p className="mt-1 text-xs text-amber-600">Quote</p>
              )}
            </Link>
          </div>
        ))}

        {/* Bundle summary */}
        {bundleTotal > 0 && (
          <div className="ml-2 flex flex-col items-center rounded-lg border-2 border-dashed border-primary-300 bg-primary-50 p-4">
            <span className="text-xs font-medium text-primary-700">Bundle Total</span>
            <span className="text-lg font-bold text-primary-800">${bundleTotal.toFixed(2)}</span>
          </div>
        )}
      </div>
    </section>
  )
}
