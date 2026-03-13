'use client'

import { useState } from 'react'
import Link from 'next/link'

interface Category {
  id?: string
  name: string
  slug: string
  productCount: number
  iconEmoji?: string | null
}

interface CategoryPaginationProps {
  categories: Category[]
  itemsPerPage?: number
}

// Category icons mapping
const categoryIcons: Record<string, string> = {
  'adhesives-sealants-tape': '🧴',
  'material-handling': '📦',
  'safety': '🛡️',
  'packaging-shipping': '📬',
  'cleaning-and-janitorial': '🧹',
  'lighting': '💡',
  'power-transmission': '⚙️',
  'tool-storage-workbenches': '🗄️',
  'plumbing-pumps': '🔧',
  'abrasives': '🔄',
  'electrical': '⚡',
  'fasteners': '🔩',
  'fleet-vehicle-maintenance': '🚗',
  'furnishings-appliances-hospitality': '🛋️',
  'hvac-refrigeration': '❄️',
  'hardware': '🔨',
  'hydraulics': '💧',
  'lab-supplies': '🔬',
  'lubrication': '🛢️',
  'machining': '⚙️',
  'motors': '🔌',
  'office-supplies': '📎',
  'outdoor-ground-maintenance': '🌳',
  'painting-equipment': '🎨',
  'pneumatics': '💨',
  'raw-materials': '🧱',
  'safety-security': '🔒',
  'test-instruments': '📊',
  'tools': '🛠️',
  'welding': '🔥',
  'wire-cable': '🔗',
}

export function CategoryPagination({ categories, itemsPerPage = 12 }: CategoryPaginationProps) {
  const [currentPage, setCurrentPage] = useState(1)
  const totalPages = Math.ceil(categories.length / itemsPerPage)

  // Get categories for current page
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentCategories = categories.slice(startIndex, endIndex)

  const goToPage = (page: number) => {
    setCurrentPage(page)
    // Scroll to categories section
    document.getElementById('browse-categories')?.scrollIntoView({ behavior: 'smooth' })
  }

  if (categories.length === 0) {
    return null
  }

  return (
    <div id="browse-categories">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
        {currentCategories.map((cat) => (
          <Link
            key={cat.id || cat.slug}
            href={`/category/${cat.slug}`}
            className="card flex flex-col items-center py-6 text-center transition-all hover:border-primary-200 hover:shadow-md"
          >
            <span className="text-3xl">{cat.iconEmoji || categoryIcons[cat.slug] || '📦'}</span>
            <span className="mt-3 font-semibold text-secondary-800">{cat.name}</span>
            {cat.productCount < 5 ? (
              <span className="mt-1 text-xs text-amber-600 font-medium">Coming Soon</span>
            ) : (
              <span className="mt-1 text-xs text-secondary-500">{cat.productCount.toLocaleString()} products</span>
            )}
          </Link>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-8 flex items-center justify-center gap-2">
          {/* Previous button */}
          <button
            onClick={() => goToPage(currentPage - 1)}
            disabled={currentPage === 1}
            className="flex items-center gap-1 rounded-lg border border-secondary-200 bg-white px-3 py-2 text-sm font-medium text-secondary-600 transition-all hover:border-primary-300 hover:bg-primary-50 hover:text-primary-700 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:border-secondary-200 disabled:hover:bg-white disabled:hover:text-secondary-600"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Previous
          </button>

          {/* Page numbers */}
          <div className="flex items-center gap-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => goToPage(page)}
                className={`flex h-10 w-10 items-center justify-center rounded-lg text-sm font-medium transition-all ${
                  currentPage === page
                    ? 'bg-primary-600 text-white'
                    : 'border border-secondary-200 bg-white text-secondary-600 hover:border-primary-300 hover:bg-primary-50 hover:text-primary-700'
                }`}
              >
                {page}
              </button>
            ))}
          </div>

          {/* Next button */}
          <button
            onClick={() => goToPage(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="flex items-center gap-1 rounded-lg border border-secondary-200 bg-white px-3 py-2 text-sm font-medium text-secondary-600 transition-all hover:border-primary-300 hover:bg-primary-50 hover:text-primary-700 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:border-secondary-200 disabled:hover:bg-white disabled:hover:text-secondary-600"
          >
            Next
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      )}

      {/* Page indicator */}
      {totalPages > 1 && (
        <p className="mt-4 text-center text-sm text-secondary-500">
          Page {currentPage} of {totalPages} · {categories.length} categories total
        </p>
      )}
    </div>
  )
}
