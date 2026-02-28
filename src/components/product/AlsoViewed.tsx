'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

const SESSION_KEY = 'machrio_session_id'

// Generate or retrieve session ID
function getSessionId(): string {
  if (typeof window === 'undefined') return ''
  
  let sessionId = localStorage.getItem(SESSION_KEY)
  if (!sessionId) {
    sessionId = `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`
    localStorage.setItem(SESSION_KEY, sessionId)
  }
  return sessionId
}

interface AlsoViewedProduct {
  id: string
  name: string
  slug: string
  categorySlug: string
  sku: string
  imageUrl?: string
  price?: number
  currency: string
}

interface TrackProductViewProps {
  productId: string
  referrer?: string
}

/**
 * Tracks product views for collaborative filtering
 * Sends view event to server
 */
export function TrackProductViewServer({ productId, referrer }: TrackProductViewProps) {
  useEffect(() => {
    const sessionId = getSessionId()
    if (!sessionId || !productId) return

    // Fire and forget - don't block UI
    fetch('/api/product-views', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        productId,
        sessionId,
        referrer: referrer || document.referrer,
      }),
    }).catch(() => {
      // Silently fail - analytics shouldn't break the page
    })
  }, [productId, referrer])

  return null
}

interface AlsoViewedProps {
  productId: string
  maxDisplay?: number
}

/**
 * Displays "Customers Also Viewed" recommendations
 * Based on collaborative filtering of view data
 */
export function AlsoViewed({ productId, maxDisplay = 6 }: AlsoViewedProps) {
  const [products, setProducts] = useState<AlsoViewedProduct[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!productId) {
      setLoading(false)
      return
    }

    fetch(`/api/product-views?productId=${productId}&limit=${maxDisplay}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.products && Array.isArray(data.products)) {
          setProducts(data.products)
        }
      })
      .catch(() => {
        // Silently fail
      })
      .finally(() => {
        setLoading(false)
      })
  }, [productId, maxDisplay])

  // Don't show section if no data or loading
  if (loading || products.length === 0) return null

  return (
    <section className="mt-12 border-t border-secondary-200 pt-8">
      <div className="flex items-center gap-2">
        <h2 className="text-lg font-bold text-secondary-900">Customers Also Viewed</h2>
        <span className="rounded-full bg-primary-100 px-2 py-0.5 text-xs font-medium text-primary-700">
          Based on browsing
        </span>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
        {products.map((product) => (
          <Link
            key={product.sku}
            href={`/product/${product.categorySlug}/${product.slug}`}
            className="group rounded-lg border border-secondary-200 bg-white p-3 transition-all hover:border-primary-300 hover:shadow-md"
          >
            <div className="flex aspect-[4/3] items-center justify-center rounded bg-secondary-50">
              {product.imageUrl ? (
                <img
                  src={product.imageUrl}
                  alt={product.name}
                  className="h-full w-full object-contain" loading="lazy" decoding="async"
                />
              ) : (
                <svg className="h-10 w-10 text-secondary-300" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                </svg>
              )}
            </div>
            <div className="mt-2">
              <p className="line-clamp-2 text-xs font-medium text-secondary-700 group-hover:text-primary-700">
                {product.name}
              </p>
              {product.price ? (
                <p className="mt-1 text-sm font-semibold text-secondary-900">
                  ${product.price.toFixed(2)}
                </p>
              ) : (
                <p className="mt-1 text-xs text-amber-600">Contact for Price</p>
              )}
            </div>
          </Link>
        ))}
      </div>
    </section>
  )
}
