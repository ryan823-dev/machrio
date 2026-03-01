'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

interface SearchFiltersProps {
  query: string
  brands: { name: string; slug: string; count: number }[]
  categories: { name: string; slug: string; count: number }[]
  priceRange: { min: number; max: number }
  availability: { value: string; count: number }[]
  totalProducts: number
}

const availabilityLabels: Record<string, string> = {
  'in-stock': 'In Stock',
  'made-to-order': 'Made to Order',
  'contact': 'Contact',
}

export function SearchFilters({
  query,
  brands,
  categories,
  priceRange,
  availability,
  totalProducts,
}: SearchFiltersProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  // Derive filter state from URL params - use key to reset controlled inputs
  const urlBrand = searchParams.get('brand') || ''
  const urlCategory = searchParams.get('category') || ''
  const urlAvailability = searchParams.get('availability') || ''
  const urlMinPrice = searchParams.get('minPrice') || ''
  const urlMaxPrice = searchParams.get('maxPrice') || ''

  const [selectedBrand, setSelectedBrand] = useState(urlBrand)
  const [selectedCategory, setSelectedCategory] = useState(urlCategory)
  const [selectedAvailability, setSelectedAvailability] = useState(urlAvailability)
  const [minPrice, setMinPrice] = useState(urlMinPrice)
  const [maxPrice, setMaxPrice] = useState(urlMaxPrice)
  const [isMobileOpen, setIsMobileOpen] = useState(false)

  // Sync state when URL changes (e.g., back/forward navigation)
  const paramsKey = `${urlBrand}|${urlCategory}|${urlAvailability}|${urlMinPrice}|${urlMaxPrice}`
  useEffect(() => {
    setSelectedBrand(urlBrand)
    setSelectedCategory(urlCategory)
    setSelectedAvailability(urlAvailability)
    setMinPrice(urlMinPrice)
    setMaxPrice(urlMaxPrice)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paramsKey])

  function buildUrl(overrides: Record<string, string> = {}) {
    const params = new URLSearchParams()
    params.set('q', query)
    const brand = overrides.brand !== undefined ? overrides.brand : selectedBrand
    const category = overrides.category !== undefined ? overrides.category : selectedCategory
    const avail = overrides.availability !== undefined ? overrides.availability : selectedAvailability
    const min = overrides.minPrice !== undefined ? overrides.minPrice : minPrice
    const max = overrides.maxPrice !== undefined ? overrides.maxPrice : maxPrice
    const sort = searchParams.get('sort') || ''
    const view = searchParams.get('view') || ''

    if (brand) params.set('brand', brand)
    if (category) params.set('category', category)
    if (avail) params.set('availability', avail)
    if (min) params.set('minPrice', min)
    if (max) params.set('maxPrice', max)
    if (sort) params.set('sort', sort)
    if (view && view !== 'list') params.set('view', view)

    return `/search?${params.toString()}`
  }

  function applyFilter(overrides: Record<string, string>) {
    router.push(buildUrl(overrides))
  }

  function clearFilters() {
    setSelectedBrand('')
    setSelectedCategory('')
    setSelectedAvailability('')
    setMinPrice('')
    setMaxPrice('')
    const params = new URLSearchParams()
    params.set('q', query)
    const sort = searchParams.get('sort') || ''
    const view = searchParams.get('view') || ''
    if (sort) params.set('sort', sort)
    if (view && view !== 'list') params.set('view', view)
    router.push(`/search?${params.toString()}`)
  }

  const hasActiveFilters = Boolean(selectedBrand || selectedCategory || selectedAvailability || minPrice || maxPrice)

  const filterContent = (
    <div className="space-y-5">
      {/* Categories */}
      {categories.length > 0 && (
        <div>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-secondary-500">Category</h3>
          <div className="space-y-1">
            {categories.slice(0, 10).map((cat) => (
              <button
                key={cat.slug}
                onClick={() => {
                  const newCat = selectedCategory === cat.slug ? '' : cat.slug
                  setSelectedCategory(newCat)
                  applyFilter({ category: newCat })
                }}
                className={`flex w-full items-center justify-between rounded px-2 py-1.5 text-left text-sm transition-colors ${
                  selectedCategory === cat.slug
                    ? 'bg-primary-50 font-medium text-primary-700'
                    : 'text-secondary-700 hover:bg-secondary-50'
                }`}
              >
                <span className="truncate">{cat.name}</span>
                <span className="ml-2 flex-shrink-0 text-xs text-secondary-400">{cat.count}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Brands */}
      {brands.length > 0 && (
        <div>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-secondary-500">Brand</h3>
          <div className="space-y-1">
            {brands.slice(0, 12).map((brand) => (
              <button
                key={brand.slug}
                onClick={() => {
                  const newBrand = selectedBrand === brand.slug ? '' : brand.slug
                  setSelectedBrand(newBrand)
                  applyFilter({ brand: newBrand })
                }}
                className={`flex w-full items-center justify-between rounded px-2 py-1.5 text-left text-sm transition-colors ${
                  selectedBrand === brand.slug
                    ? 'bg-primary-50 font-medium text-primary-700'
                    : 'text-secondary-700 hover:bg-secondary-50'
                }`}
              >
                <span className="truncate">{brand.name}</span>
                <span className="ml-2 flex-shrink-0 text-xs text-secondary-400">{brand.count}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Price Range */}
      <div>
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-secondary-500">Price Range</h3>
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-secondary-400">$</span>
            <input
              type="number"
              value={minPrice}
              onChange={(e) => setMinPrice(e.target.value)}
              placeholder={priceRange.min > 0 ? String(Math.floor(priceRange.min)) : '0'}
              min="0"
              className="input-field w-full py-1.5 pl-5 pr-2 text-sm"
            />
          </div>
          <span className="text-secondary-400">&mdash;</span>
          <div className="relative flex-1">
            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-secondary-400">$</span>
            <input
              type="number"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
              placeholder={priceRange.max > 0 ? String(Math.ceil(priceRange.max)) : '999'}
              min="0"
              className="input-field w-full py-1.5 pl-5 pr-2 text-sm"
            />
          </div>
        </div>
        <button
          onClick={() => {
            applyFilter({})
            setIsMobileOpen(false)
          }}
          className="mt-2 w-full rounded-lg bg-primary-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-primary-700"
        >
          Apply Price
        </button>
      </div>

      {/* Availability */}
      {availability.length > 0 && (
        <div>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-secondary-500">Availability</h3>
          <div className="space-y-1">
            {availability.map((item) => (
              <button
                key={item.value}
                onClick={() => {
                  const newAvail = selectedAvailability === item.value ? '' : item.value
                  setSelectedAvailability(newAvail)
                  applyFilter({ availability: newAvail })
                }}
                className={`flex w-full items-center justify-between rounded px-2 py-1.5 text-left text-sm transition-colors ${
                  selectedAvailability === item.value
                    ? 'bg-primary-50 font-medium text-primary-700'
                    : 'text-secondary-700 hover:bg-secondary-50'
                }`}
              >
                <span>{availabilityLabels[item.value] || item.value}</span>
                <span className="ml-2 flex-shrink-0 text-xs text-secondary-400">{item.count}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Clear filters */}
      {hasActiveFilters && (
        <button
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
      {/* Mobile: Filter toggle + collapsible panel */}
      <div className="mb-4 lg:hidden">
        <button
          onClick={() => setIsMobileOpen(!isMobileOpen)}
          className="flex items-center gap-2 rounded-lg border border-secondary-200 bg-white px-3 py-2 text-sm font-medium text-secondary-700"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
          Filters
          {hasActiveFilters && (
            <span className="rounded-full bg-primary-100 px-1.5 py-0.5 text-[10px] font-bold text-primary-700">!</span>
          )}
        </button>
        {isMobileOpen && (
          <div className="mt-2 rounded-lg border border-secondary-200 bg-white p-4">
            {filterContent}
          </div>
        )}
      </div>

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
