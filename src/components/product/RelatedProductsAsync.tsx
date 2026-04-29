'use client'

import { useEffect, useState } from 'react'
import { RelatedProducts, type RelatedProduct } from '@/components/product/RelatedProducts'

interface RelatedProductsAsyncProps {
  productId: string
  maxDisplay?: number
}

export function RelatedProductsAsync({
  productId,
  maxDisplay = 8,
}: RelatedProductsAsyncProps) {
  const [products, setProducts] = useState<RelatedProduct[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!productId) {
      setLoading(false)
      return
    }

    const controller = new AbortController()

    fetch(`/api/related-products?productId=${encodeURIComponent(productId)}&limit=${maxDisplay}`, {
      signal: controller.signal,
    })
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error('Failed to load related products'))))
      .then((data) => {
        if (Array.isArray(data.products)) {
          setProducts(data.products)
        }
      })
      .catch(() => {
        // Related products are supportive content, so failures stay silent.
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setLoading(false)
        }
      })

    return () => controller.abort()
  }, [productId, maxDisplay])

  if (loading || products.length === 0) return null

  return <RelatedProducts products={products} maxDisplay={maxDisplay} />
}
