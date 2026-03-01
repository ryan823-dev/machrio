'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

interface FilterBarProps {
  categorySlug: string
  brands: { name: string; slug: string; count: number }[]
  priceRange: { min: number; max: number }
  totalProducts: number
}

// View toggle icon components
function GridIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
    </svg>
  )
}

function ListIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
    </svg>
  )
}

export function FilterBar({ categorySlug, brands, priceRange, totalProducts }: FilterBarProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const [selectedBrand, setSelectedBrand] = useState(searchParams.get('brand') || '')
  const [minPrice, setMinPrice] = useState(searchParams.get('minPrice') || '')
  const [maxPrice, setMaxPrice] = useState(searchParams.get('maxPrice') || '')
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const currentSort = searchParams.get('sort') || ''
  const currentView = searchParams.get('view') || 'list'

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSelectedBrand(searchParams.get('brand') || '')
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMinPrice(searchParams.get('minPrice') || '')
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMaxPrice(searchParams.get('maxPrice') || '')
  }, [searchParams])

  function applyFilters(overrides?: { brand?: string; min?: string; max?: string }) {
    const params = new URLSearchParams()
    const brand = overrides?.brand !== undefined ? overrides.brand : selectedBrand
    const min = overrides?.min !== undefined ? overrides.min : minPrice
    const max = overrides?.max !== undefined ? overrides.max : maxPrice
    if (brand) params.set('brand', brand)
    if (min) params.set('minPrice', min)
    if (max) params.set('maxPrice', max)
    if (currentSort) params.set('sort', currentSort)
    if (currentView && currentView !== 'list') params.set('view', currentView)
    
    const queryString = params.toString()
    router.push(`/category/${categorySlug}${queryString ? `?${queryString}` : ''}`)
  }

  function clearFilters() {
    setSelectedBrand('')
    setMinPrice('')
    setMaxPrice('')
    const params = new URLSearchParams()
    if (currentSort) params.set('sort', currentSort)
    if (currentView && currentView !== 'list') params.set('view', currentView)
    const queryString = params.toString()
    router.push(`/category/${categorySlug}${queryString ? `?${queryString}` : ''}`)
  }

  function handleBrandClick(brandSlug: string) {
    const newBrand = selectedBrand === brandSlug ? '' : brandSlug
    setSelectedBrand(newBrand)
    applyFilters({ brand: newBrand })
  }

  function handlePriceApply() {
    applyFilters()
    setIsMobileOpen(false)
  }

  function handleViewChange(view: 'list' | 'grid') {
    const params = new URLSearchParams(searchParams.toString())
    if (view === 'list') {
      params.delete('view')
    } else {
      params.set('view', view)
    }
    params.delete('page')
    router.push(`/category/${categorySlug}?${params.toString()}`)
  }

  const hasActiveFilters = selectedBrand || minPrice || maxPrice

  const filterContent = (
    <div className="space-y-5" role="group" aria-label="Product filters">
      {/* Brands */}
      {brands.length > 0 && (
        <fieldset>
          <legend className="mb-2 text-xs font-semibold uppercase tracking-wider text-secondary-500">Brand</legend>
          <div className="space-y-1" role="group" aria-label="Filter by brand">
            {brands.slice(0, 12).map((brand) => (
              <button
                key={brand.slug}
                type="button"
                onClick={() => handleBrandClick(brand.slug)}
                aria-pressed={selectedBrand === brand.slug}
                className={`flex w-full items-center justify-between rounded px-2 py-1.5 text-left text-sm transition-colors ${
                  selectedBrand === brand.slug
                    ? 'bg-primary-50 font-medium text-primary-700'
                    : 'text-secondary-700 hover:bg-secondary-50'
                }`}
              >
                <span className="truncate">{brand.name}</span>
                <span className="ml-2 flex-shrink-0 text-xs text-secondary-400" aria-label={`${brand.count} products`}>{brand.count}</span>
              </button>
            ))}
          </div>
        </fieldset>
      )}

      {/* Price Range */}
      <fieldset>
        <legend className="mb-2 text-xs font-semibold uppercase tracking-wider text-secondary-500">Price Range</legend>
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <label htmlFor="filter-min-price" className="sr-only">Minimum price</label>
            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-secondary-400" aria-hidden="true">$</span>
            <input
              id="filter-min-price"
              type="number"
              value={minPrice}
              onChange={(e) => setMinPrice(e.target.value)}
              placeholder={priceRange.min > 0 ? String(Math.floor(priceRange.min)) : '0'}
              min="0"
              aria-label="Minimum price in dollars"
              className="input-field w-full py-1.5 pl-5 pr-2 text-sm"
            />
          </div>
          <span className="text-secondary-400" aria-hidden="true">—</span>
          <span className="sr-only">to</span>
          <div className="relative flex-1">
            <label htmlFor="filter-max-price" className="sr-only">Maximum price</label>
            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-secondary-400" aria-hidden="true">$</span>
            <input
              id="filter-max-price"
              type="number"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
              placeholder={priceRange.max > 0 ? String(Math.ceil(priceRange.max)) : '999'}
              min="0"
              aria-label="Maximum price in dollars"
              className="input-field w-full py-1.5 pl-5 pr-2 text-sm"
            />
          </div>
        </div>
        <button
          type="button"
          onClick={handlePriceApply}
          className="mt-2 w-full rounded-lg bg-primary-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-primary-700"
        >
          Apply Price
        </button>
      </fieldset>

      {/* Availability */}
      <div>
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-secondary-500">Availability</h3>
        <div className="rounded bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
          All products are available for order. Volume pricing shown on product pages.
        </div>
      </div>

      {/* Clear filters */}
      {hasActiveFilters && (
        <button
          type="button"
          onClick={clearFilters}
          className="w-full rounded-lg border border-secondary-300 px-3 py-2 text-xs font-medium text-secondary-600 hover:bg-secondary-50"
        >
          Clear All Filters
        </button>
      )}
    </div>
  )

  return (
    <div>
      {/* Mobile: Sort bar + filter toggle + view toggle + collapsible panel */}
      <div className="mb-4 flex items-center justify-between lg:hidden">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsMobileOpen(!isMobileOpen)}
              aria-expanded={isMobileOpen}
              aria-controls="mobile-filter-panel"
              className="flex items-center gap-2 rounded-lg border border-secondary-200 bg-white px-3 py-2 text-sm font-medium text-secondary-700"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              Filters
              {hasActiveFilters && (
                <span className="rounded-full bg-primary-100 px-1.5 py-0.5 text-[10px] font-bold text-primary-700" aria-label="Filters active">!</span>
              )}
            </button>
            {/* Mobile view toggle */}
            <div className="flex items-center rounded-lg border border-secondary-200 bg-white p-0.5" role="group" aria-label="View options">
              <button
                type="button"
                onClick={() => handleViewChange('list')}
                aria-pressed={currentView === 'list'}
                aria-label="List view"
                className={`rounded-md p-1.5 transition-colors ${
                  currentView === 'list'
                    ? 'bg-primary-100 text-primary-700'
                    : 'text-secondary-400 hover:text-secondary-600'
                }`}
              >
                <ListIcon className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => handleViewChange('grid')}
                aria-pressed={currentView === 'grid'}
                aria-label="Grid view"
                className={`rounded-md p-1.5 transition-colors ${
                  currentView === 'grid'
                    ? 'bg-primary-100 text-primary-700'
                    : 'text-secondary-400 hover:text-secondary-600'
                }`}
              >
                <GridIcon className="h-4 w-4" />
              </button>
            </div>
            <span className="text-sm text-secondary-500">{totalProducts} products</span>
          </div>
          <div>
            <label htmlFor="mobile-sort-select" className="sr-only">Sort products</label>
            <select
              id="mobile-sort-select"
              value={currentSort}
              onChange={(e) => {
                const params = new URLSearchParams(searchParams.toString())
                if (e.target.value) {
                  params.set('sort', e.target.value)
                } else {
                  params.delete('sort')
                }
                params.delete('page')
                router.push(`/category/${categorySlug}?${params.toString()}`)
              }}
              className="rounded-lg border border-secondary-200 bg-white px-3 py-2 text-sm text-secondary-700"
            >
              <option value="">Newest</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="name">Name: A to Z</option>
            </select>
          </div>
        </div>

        {/* Mobile: Collapsible filter panel */}
        {isMobileOpen && (
          <div id="mobile-filter-panel" className="mb-4 rounded-lg border border-secondary-200 bg-white p-4 lg:hidden">
            {filterContent}
          </div>
        )}

      {/* Desktop: Sticky sidebar */}
      <div className="hidden lg:block">
        <div className="sticky top-20 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-secondary-800">Filters</h2>
            <span className="text-xs text-secondary-500">{totalProducts} products</span>
          </div>
          {filterContent}
        </div>
      </div>
    </div>
  )
}

// Desktop sort bar component - self-contained, reads from URL params
export function DesktopSortBar({ 
  categorySlug, 
  brands,
  totalProducts,
}: { 
  categorySlug: string
  brands: { name: string; slug: string; count: number }[]
  totalProducts: number
}) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const currentSort = searchParams.get('sort') || ''
  const currentView = searchParams.get('view') || 'list'
  const selectedBrand = searchParams.get('brand') || ''
  const minPrice = searchParams.get('minPrice') || ''
  const maxPrice = searchParams.get('maxPrice') || ''
  const hasActiveFilters = Boolean(selectedBrand || minPrice || maxPrice)

  function handleViewChange(view: 'list' | 'grid') {
    const params = new URLSearchParams(searchParams.toString())
    if (view === 'list') {
      params.delete('view')
    } else {
      params.set('view', view)
    }
    params.delete('page')
    router.push(`/category/${categorySlug}?${params.toString()}`)
  }

  function clearBrand() {
    const params = new URLSearchParams(searchParams.toString())
    params.delete('brand')
    params.delete('page')
    router.push(`/category/${categorySlug}?${params.toString()}`)
  }

  function clearPrice() {
    const params = new URLSearchParams(searchParams.toString())
    params.delete('minPrice')
    params.delete('maxPrice')
    params.delete('page')
    router.push(`/category/${categorySlug}?${params.toString()}`)
  }

  return (
    <div className="mb-4 hidden items-center justify-between lg:flex">
      <div className="flex items-center gap-2">
        <span className="text-sm text-secondary-500">{totalProducts} products</span>
        {hasActiveFilters && (
          <div role="list" aria-label="Applied filters" className="flex items-center gap-2">
            {selectedBrand && (
              <span role="listitem" className="inline-flex items-center gap-1 rounded-full bg-primary-50 px-2.5 py-1 text-xs font-medium text-primary-700">
                {brands.find(b => b.slug === selectedBrand)?.name || selectedBrand}
                <button 
                  type="button"
                  onClick={clearBrand} 
                  aria-label={`Remove filter: ${brands.find(b => b.slug === selectedBrand)?.name || selectedBrand}`}
                  className="ml-0.5 hover:text-red-600"
                >
                  <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </span>
            )}
            {(minPrice || maxPrice) && (
              <span role="listitem" className="inline-flex items-center gap-1 rounded-full bg-primary-50 px-2.5 py-1 text-xs font-medium text-primary-700">
                ${minPrice || '0'} - ${maxPrice || '...'}
                <button 
                  type="button"
                  onClick={clearPrice} 
                  aria-label="Remove price filter"
                  className="ml-0.5 hover:text-red-600"
                >
                  <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </span>
            )}
          </div>
        )}
      </div>
      <div className="flex items-center gap-3">
        {/* View toggle buttons */}
        <div className="flex items-center rounded-lg border border-secondary-200 bg-white p-0.5" role="group" aria-label="View options">
          <button
            type="button"
            onClick={() => handleViewChange('list')}
            aria-pressed={currentView === 'list'}
            aria-label="List view"
            className={`rounded-md p-1.5 transition-colors ${
              currentView === 'list'
                ? 'bg-primary-100 text-primary-700'
                : 'text-secondary-400 hover:text-secondary-600'
            }`}
          >
            <ListIcon className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => handleViewChange('grid')}
            aria-pressed={currentView === 'grid'}
            aria-label="Grid view"
            className={`rounded-md p-1.5 transition-colors ${
              currentView === 'grid'
                ? 'bg-primary-100 text-primary-700'
                : 'text-secondary-400 hover:text-secondary-600'
            }`}
          >
            <GridIcon className="h-4 w-4" />
          </button>
        </div>
        <div>
          <label htmlFor="desktop-sort-select" className="sr-only">Sort products</label>
          <select
            id="desktop-sort-select"
            value={currentSort}
            onChange={(e) => {
              const params = new URLSearchParams(searchParams.toString())
              if (e.target.value) {
                params.set('sort', e.target.value)
              } else {
                params.delete('sort')
              }
              params.delete('page')
              router.push(`/category/${categorySlug}?${params.toString()}`)
            }}
            className="rounded-lg border border-secondary-200 bg-white px-3 py-1.5 text-sm text-secondary-700"
          >
            <option value="">Newest</option>
            <option value="price-asc">Price: Low to High</option>
            <option value="price-desc">Price: High to Low</option>
            <option value="name">Name: A to Z</option>
          </select>
        </div>
      </div>
    </div>
  )
}
