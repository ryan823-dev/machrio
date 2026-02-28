'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

const STORAGE_KEY = 'machrio_recently_viewed'
const MAX_ITEMS = 8

interface ViewedProduct {
  name: string
  slug: string
  categorySlug: string
  sku: string
  imageUrl?: string
  price?: number
  currency: string
  viewedAt: number
}

function formatTimeAgo(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000)
  if (seconds < 60) return 'Just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  return 'Over a week ago'
}

export function TrackProductView({ product }: { product: Omit<ViewedProduct, 'viewedAt'> }) {
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      const items: ViewedProduct[] = stored ? JSON.parse(stored) : []
      const filtered = items.filter((item) => item.slug !== product.slug)
      filtered.unshift({ ...product, viewedAt: Date.now() })
      localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered.slice(0, MAX_ITEMS)))
    } catch {
      // localStorage unavailable
    }
  }, [product.slug])

  return null
}

interface RecentlyViewedProps {
  excludeSlug?: string
  maxDisplay?: number
  showTimestamp?: boolean
}

export function RecentlyViewed({ 
  excludeSlug, 
  maxDisplay = 6,
  showTimestamp = true 
}: RecentlyViewedProps) {
  const [products, setProducts] = useState<ViewedProduct[]>([])

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const items: ViewedProduct[] = JSON.parse(stored)
        setProducts(
          items.filter((item) => item.slug !== excludeSlug).slice(0, maxDisplay)
        )
      }
    } catch {
      // localStorage unavailable
    }
  }, [excludeSlug, maxDisplay])

  if (products.length === 0) return null

  return (
    <section className="mt-12 border-t border-secondary-200 pt-8">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-secondary-900">Recently Viewed</h2>
        <button 
          onClick={() => {
            localStorage.removeItem(STORAGE_KEY)
            setProducts([])
          }}
          className="text-xs text-secondary-400 hover:text-secondary-600"
        >
          Clear History
        </button>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
        {products.map((product) => (
          <Link
            key={product.slug}
            href={`/product/${product.categorySlug}/${product.slug}`}
            className="group relative rounded-lg border border-secondary-200 bg-white p-3 transition-all hover:border-primary-300 hover:shadow-md"
          >
            <div className="flex aspect-[4/3] items-center justify-center rounded bg-secondary-50">
              {product.imageUrl ? (
                <img
                  src={product.imageUrl}
                  alt={product.name}
                  className="h-full w-full object-contain" loading="lazy" decoding="async"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-secondary-300">
                  <svg className="h-10 w-10" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
            </div>
            <div className="mt-2">
              <p className="line-clamp-2 text-xs font-medium text-secondary-700 group-hover:text-primary-700">
                {product.name}
              </p>
              <div className="mt-1 flex items-center justify-between">
                {product.price ? (
                  <span className="text-sm font-semibold text-secondary-900">
                    ${product.price.toFixed(2)}
                  </span>
                ) : (
                  <span className="text-xs text-amber-600">Quote</span>
                )}
                {showTimestamp && (
                  <span className="text-[10px] text-secondary-400">
                    {formatTimeAgo(product.viewedAt)}
                  </span>
                )}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  )
}
