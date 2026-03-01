'use client'

import { useRouter, useSearchParams } from 'next/navigation'

interface SearchSortBarProps {
  query: string
  totalProducts: number
  brands: { name: string; slug: string; count: number }[]
  categories: { name: string; slug: string; count: number }[]
}

function ListIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
    </svg>
  )
}

function GridIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
    </svg>
  )
}

function CloseChipIcon() {
  return (
    <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  )
}

export function SearchSortBar({ totalProducts, brands, categories }: SearchSortBarProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const currentSort = searchParams.get('sort') || ''
  const currentView = searchParams.get('view') || 'list'
  const selectedBrand = searchParams.get('brand') || ''
  const selectedCategory = searchParams.get('category') || ''
  const selectedAvailability = searchParams.get('availability') || ''
  const minPrice = searchParams.get('minPrice') || ''
  const maxPrice = searchParams.get('maxPrice') || ''

  const hasActiveFilters = Boolean(selectedBrand || selectedCategory || selectedAvailability || minPrice || maxPrice)

  function removeParam(key: string) {
    const params = new URLSearchParams(searchParams.toString())
    params.delete(key)
    params.delete('page')
    router.push(`/search?${params.toString()}`)
  }

  function removePriceFilter() {
    const params = new URLSearchParams(searchParams.toString())
    params.delete('minPrice')
    params.delete('maxPrice')
    params.delete('page')
    router.push(`/search?${params.toString()}`)
  }

  function handleSortChange(value: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (value) {
      params.set('sort', value)
    } else {
      params.delete('sort')
    }
    params.delete('page')
    router.push(`/search?${params.toString()}`)
  }

  function handleViewChange(view: 'list' | 'grid') {
    const params = new URLSearchParams(searchParams.toString())
    if (view === 'list') {
      params.delete('view')
    } else {
      params.set('view', view)
    }
    params.delete('page')
    router.push(`/search?${params.toString()}`)
  }

  const availabilityLabels: Record<string, string> = {
    'in-stock': 'In Stock',
    'made-to-order': 'Made to Order',
    'contact': 'Contact',
  }

  return (
    <>
      {/* Desktop sort bar */}
      <div className="mb-4 hidden items-center justify-between lg:flex">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-secondary-500">{totalProducts} products</span>
          {hasActiveFilters && (
            <>
              {selectedBrand && (
                <span className="inline-flex items-center gap-1 rounded-full bg-primary-50 px-2.5 py-1 text-xs font-medium text-primary-700">
                  {brands.find(b => b.slug === selectedBrand)?.name || selectedBrand}
                  <button onClick={() => removeParam('brand')} className="ml-0.5 hover:text-red-600">
                    <CloseChipIcon />
                  </button>
                </span>
              )}
              {selectedCategory && (
                <span className="inline-flex items-center gap-1 rounded-full bg-primary-50 px-2.5 py-1 text-xs font-medium text-primary-700">
                  {categories.find(c => c.slug === selectedCategory)?.name || selectedCategory}
                  <button onClick={() => removeParam('category')} className="ml-0.5 hover:text-red-600">
                    <CloseChipIcon />
                  </button>
                </span>
              )}
              {selectedAvailability && (
                <span className="inline-flex items-center gap-1 rounded-full bg-primary-50 px-2.5 py-1 text-xs font-medium text-primary-700">
                  {availabilityLabels[selectedAvailability] || selectedAvailability}
                  <button onClick={() => removeParam('availability')} className="ml-0.5 hover:text-red-600">
                    <CloseChipIcon />
                  </button>
                </span>
              )}
              {(minPrice || maxPrice) && (
                <span className="inline-flex items-center gap-1 rounded-full bg-primary-50 px-2.5 py-1 text-xs font-medium text-primary-700">
                  ${minPrice || '0'} - ${maxPrice || '...'}
                  <button onClick={removePriceFilter} className="ml-0.5 hover:text-red-600">
                    <CloseChipIcon />
                  </button>
                </span>
              )}
            </>
          )}
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center rounded-lg border border-secondary-200 bg-white p-0.5">
            <button
              onClick={() => handleViewChange('list')}
              className={`rounded-md p-1.5 transition-colors ${
                currentView === 'list'
                  ? 'bg-primary-100 text-primary-700'
                  : 'text-secondary-400 hover:text-secondary-600'
              }`}
              title="List view"
            >
              <ListIcon className="h-4 w-4" />
            </button>
            <button
              onClick={() => handleViewChange('grid')}
              className={`rounded-md p-1.5 transition-colors ${
                currentView === 'grid'
                  ? 'bg-primary-100 text-primary-700'
                  : 'text-secondary-400 hover:text-secondary-600'
              }`}
              title="Grid view"
            >
              <GridIcon className="h-4 w-4" />
            </button>
          </div>
          <select
            value={currentSort}
            onChange={(e) => handleSortChange(e.target.value)}
            className="rounded-lg border border-secondary-200 bg-white px-3 py-1.5 text-sm text-secondary-700"
          >
            <option value="">Relevance</option>
            <option value="price-asc">Price: Low to High</option>
            <option value="price-desc">Price: High to Low</option>
            <option value="name">Name: A to Z</option>
            <option value="newest">Newest</option>
          </select>
        </div>
      </div>

      {/* Mobile sort bar */}
      <div className="mb-4 flex items-center justify-between lg:hidden">
        <div className="flex items-center gap-2">
          <div className="flex items-center rounded-lg border border-secondary-200 bg-white p-0.5">
            <button
              onClick={() => handleViewChange('list')}
              className={`rounded-md p-1.5 transition-colors ${
                currentView === 'list'
                  ? 'bg-primary-100 text-primary-700'
                  : 'text-secondary-400 hover:text-secondary-600'
              }`}
              title="List view"
            >
              <ListIcon className="h-4 w-4" />
            </button>
            <button
              onClick={() => handleViewChange('grid')}
              className={`rounded-md p-1.5 transition-colors ${
                currentView === 'grid'
                  ? 'bg-primary-100 text-primary-700'
                  : 'text-secondary-400 hover:text-secondary-600'
              }`}
              title="Grid view"
            >
              <GridIcon className="h-4 w-4" />
            </button>
          </div>
          <span className="text-sm text-secondary-500">{totalProducts} products</span>
        </div>
        <select
          value={currentSort}
          onChange={(e) => handleSortChange(e.target.value)}
          className="rounded-lg border border-secondary-200 bg-white px-3 py-2 text-sm text-secondary-700"
        >
          <option value="">Relevance</option>
          <option value="price-asc">Price: Low to High</option>
          <option value="price-desc">Price: High to Low</option>
          <option value="name">Name: A to Z</option>
          <option value="newest">Newest</option>
        </select>
      </div>
    </>
  )
}
