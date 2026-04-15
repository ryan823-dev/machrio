'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ProductImage } from '@/components/shared/ProductImage'

interface Product {
  id: string
  name: string
  slug: string
  categorySlug?: string
  sku: string
  primaryImage?: string
  pricing: {
    basePrice?: number
    currency: string
  }
}

interface ProductRecommendationProps {
  categoryId: string
  categorySlug: string
  categoryName: string
  limit?: number
}

export function ProductRecommendation({ 
  categoryId, 
  categorySlug,
  categoryName,
  limit = 8 
}: ProductRecommendationProps) {
  const [products, setProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  useEffect(() => {
    async function fetchProducts() {
      try {
        setIsLoading(true)
        const response = await fetch(`/api/category-products/${categoryId}/random-products?limit=${limit}`)
        
        if (!response.ok) {
          throw new Error('Failed to fetch products')
        }
        
        const data = await response.json()
        setProducts(data.products || [])
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchProducts()
  }, [categoryId, limit])
  
  if (isLoading) {
    return (
      <section className="mb-10 rounded-xl border border-secondary-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-bold text-secondary-900">
          Recommended Products
        </h2>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {Array.from({ length: limit }).map((_, i) => (
            <div key={i} className="animate-pulse rounded-lg border border-secondary-100 bg-secondary-50 p-4">
              <div className="mb-3 aspect-square rounded bg-secondary-200" />
              <div className="mb-2 h-4 rounded bg-secondary-200" />
              <div className="h-3 w-2/3 rounded bg-secondary-200" />
            </div>
          ))}
        </div>
      </section>
    )
  }
  
  if (error || products.length === 0) {
    return null
  }
  
  return (
    <section className="mb-10 rounded-xl border border-secondary-200 bg-white p-6 shadow-sm">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-accent-100 text-accent-600">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" 
              />
            </svg>
          </div>
          <div>
            <h2 className="text-lg font-bold text-secondary-900">
              Recommended {categoryName}
            </h2>
            <p className="text-xs text-secondary-500">
              Popular choices from our collection
            </p>
          </div>
        </div>
        
        <Link
          href={`/category/${categorySlug}`}
          className="text-sm font-medium text-primary-600 hover:text-primary-700"
        >
          View All →
        </Link>
      </div>
      
      {/* Product Grid */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  )
}

function ProductCard({ product }: { product: Product }) {
  const productHref = `/product/${product.categorySlug || 'products'}/${product.slug}`

  return (
    <Link
      href={productHref}
      className="group rounded-lg border border-secondary-200 bg-white p-4 transition-all hover:border-primary-300 hover:shadow-md"
    >
      {/* Product Image */}
      <div className="mb-3 aspect-square overflow-hidden rounded-lg bg-secondary-50">
        <div className="flex h-full items-center justify-center text-secondary-300">
          <ProductImage
            src={product.primaryImage}
            alt={product.name}
            className="h-full w-full object-contain p-2 transition-transform group-hover:scale-105"
            fallbackClassName="h-12 w-12 text-secondary-300"
          />
        </div>
      </div>
      
      {/* Product Info */}
      <h3 className="line-clamp-2 text-sm font-medium text-secondary-800 group-hover:text-primary-700">
        {product.name}
      </h3>
      
      <p className="mt-1 text-xs text-secondary-500">
        SKU: {product.sku}
      </p>
      
      {/* Price */}
      {product.pricing.basePrice && (
        <p className="mt-2 text-base font-bold text-secondary-900">
          ${product.pricing.basePrice.toFixed(2)}
        </p>
      )}
    </Link>
  )
}
