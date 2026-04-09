'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface Subcategory {
  id: string
  name: string
  slug: string
}

interface SubcategoryWithCount extends Subcategory {
  productCount?: number
}

interface SubcategoryGridProps {
  categorySlug: string
  categoryName: string
  subcategories: Subcategory[]
}

export function SubcategoryGrid({ 
  categorySlug, 
  categoryName, 
  subcategories 
}: SubcategoryGridProps) {
  const [counts, setCounts] = useState<Record<string, number>>({})
  const [isLoading, setIsLoading] = useState(true)
  
  useEffect(() => {
    async function fetchProductCounts() {
      try {
        const response = await fetch(
          `/api/category/${categorySlug}/subcategory-counts`
        )
        
        if (!response.ok) {
          throw new Error('Failed to fetch product counts')
        }
        
        const data = await response.json()
        setCounts(data.counts || {})
      } catch (error) {
        console.error('Error fetching product counts:', error)
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchProductCounts()
  }, [categorySlug])
  
  return (
    <section className="mb-8">
      <h2 className="mb-4 text-lg font-semibold text-secondary-800">
        Browse {categoryName} Categories
      </h2>
      
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {subcategories.map((child) => {
          const productCount = counts[child.id] ?? (isLoading ? null : 0)
          
          return (
            <Link
              key={child.id}
              href={`/category/${child.slug}`}
              className="group flex flex-col items-center justify-center rounded-lg border border-secondary-200 bg-white px-4 py-6 text-center transition-all hover:border-primary-300 hover:bg-primary-50 hover:shadow-md"
            >
              <span className="text-sm font-medium text-secondary-700 group-hover:text-primary-700">
                {child.name}
              </span>
              
              {productCount !== null && (
                <span className={`mt-2 text-xs ${
                  productCount > 0 
                    ? 'text-secondary-500' 
                    : 'text-secondary-400'
                }`}>
                  {productCount === 0 
                    ? 'No products' 
                    : productCount === 1
                    ? '1 product'
                    : `${productCount} products`
                  }
                </span>
              )}
              
              {isLoading && (
                <span className="mt-2 h-3 w-12 animate-pulse rounded bg-secondary-100" />
              )}
            </Link>
          )
        })}
      </div>
    </section>
  )
}
