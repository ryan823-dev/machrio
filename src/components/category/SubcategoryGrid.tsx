'use client'

import Link from 'next/link'

interface Subcategory {
  id: string
  name: string
  slug: string
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
  return (
    <section className="mb-8">
      <h2 className="mb-4 text-lg font-semibold text-secondary-800">
        Browse {categoryName} Categories
      </h2>
      
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {subcategories.map((child) => {
          const productCount = child.productCount ?? 0
          
          return (
            <Link
              key={child.id}
              href={`/category/${child.slug}`}
              className="group flex flex-col items-center justify-center rounded-lg border border-secondary-200 bg-white px-4 py-6 text-center transition-all hover:border-primary-300 hover:bg-primary-50 hover:shadow-md"
            >
              <span className="text-sm font-medium text-secondary-700 group-hover:text-primary-700">
                {child.name}
              </span>
              
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
            </Link>
          )
        })}
      </div>
    </section>
  )
}
