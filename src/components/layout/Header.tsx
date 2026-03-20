'use client'

import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useCart } from '@/contexts/CartContext'
import { CategoryFlyoutMenu, type NavCategory } from './CategoryFlyoutMenu'
import { CategoryDrawerMenu } from './CategoryDrawerMenu'

const HISTORY_KEY = 'machrio_search_history'
const MAX_HISTORY = 5

// Accessibility: Focus trap utility for mega-menu
function useFocusTrap(isActive: boolean, containerRef: React.RefObject<HTMLElement | null>) {
  useEffect(() => {
    if (!isActive || !containerRef.current) return

    const container = containerRef.current
    const focusableElements = container.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])'
    )
    const firstElement = focusableElements[0]
    const lastElement = focusableElements[focusableElements.length - 1]

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault()
          lastElement?.focus()
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault()
          firstElement?.focus()
        }
      }
    }

    container.addEventListener('keydown', handleKeyDown)
    return () => container.removeEventListener('keydown', handleKeyDown)
  }, [isActive, containerRef])
}

const mainNav = [
  { label: 'Industries', href: '/industry/manufacturing' },
  { label: 'New Arrivals', href: '/category?sort=newest' },
  { label: 'Volume Pricing', href: '/deals' },
  { label: 'Knowledge Center', href: '/knowledge-center' },
  { label: 'Request a Quote', href: '/rfq' },
]

interface ProductSuggestion {
  name: string
  slug: string
  categorySlug: string
  sku: string
  imageUrl: string | null
  price: number | null
  currency: string
  brand: string | null
}

interface CategorySuggestion {
  name: string
  slug: string
  productCount: number
}

interface BrandSuggestion {
  name: string
  slug: string
}

function highlightMatch(text: string, query: string): React.ReactNode {
  if (!query || query.length < 2) return text
  const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi')
  const parts = text.split(regex)
  if (parts.length === 1) return text
  return parts.map((part, i) =>
    regex.test(part) ? <strong key={i} className="font-semibold text-secondary-900">{part}</strong> : part
  )
}

function getSearchHistory(): string[] {
  try {
    const stored = localStorage.getItem(HISTORY_KEY)
    if (stored) {
      const parsed = JSON.parse(stored)
      if (Array.isArray(parsed)) return parsed.slice(0, MAX_HISTORY)
    }
  } catch { /* ignore */ }
  return []
}

function addToSearchHistory(query: string) {
  try {
    const history = getSearchHistory().filter(h => h.toLowerCase() !== query.toLowerCase())
    history.unshift(query)
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(0, MAX_HISTORY)))
  } catch { /* ignore */ }
}

export function Header() {
  const { itemCount } = useCart()
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')
  const [products, setProducts] = useState<ProductSuggestion[]>([])
  const [categories, setCategories] = useState<CategorySuggestion[]>([])
  const [brands, setBrands] = useState<BrandSuggestion[]>([])
  const [showDropdown, setShowDropdown] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [searchHistory, setSearchHistory] = useState<string[]>([])
  const [showHistory, setShowHistory] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)
  const debounceRef = useRef<NodeJS.Timeout | null>(null)

  // Categories mega-menu state
  const [navCategories, setNavCategories] = useState<NavCategory[]>([])
  const [showMegaMenu, setShowMegaMenu] = useState(false)
  const [showMobileMenu, setShowMobileMenu] = useState(false)
  const megaMenuRef = useRef<HTMLDivElement>(null)
  const megaMenuButtonRef = useRef<HTMLButtonElement>(null)
  const megaMenuTimeout = useRef<NodeJS.Timeout | null>(null)
  
  // Accessibility: Track previous cart count for aria-live announcements
  const [cartAnnouncement, setCartAnnouncement] = useState('')
  const prevItemCount = useRef(itemCount)

  const hasSuggestions = products.length > 0 || categories.length > 0 || brands.length > 0

  // Accessibility: Announce cart updates
  useEffect(() => {
    if (prevItemCount.current !== itemCount && itemCount > 0) {
      setCartAnnouncement(`Cart updated: ${itemCount} ${itemCount === 1 ? 'item' : 'items'} in cart`)
      const timeout = setTimeout(() => setCartAnnouncement(''), 3000)
      return () => clearTimeout(timeout)
    }
    prevItemCount.current = itemCount
  }, [itemCount])

  // Load search history on mount
  useEffect(() => {
    setSearchHistory(getSearchHistory())
  }, [])

  // Load nav categories on mount - 直接从静态JSON获取，避免API冷启动
  useEffect(() => {
    fetch('/data/nav-categories.json')
      .then(res => res.json())
      .then(data => setNavCategories(data.categories || []))
      .catch(() => {})
  }, [])

  // Close mega-menu on outside click
  useEffect(() => {
    function handleClickOutsideMega(e: MouseEvent) {
      if (megaMenuRef.current && !megaMenuRef.current.contains(e.target as Node)) {
        setShowMegaMenu(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutsideMega)
    return () => document.removeEventListener('mousedown', handleClickOutsideMega)
  }, [])

  // Debounced fetch suggestions
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)

    if (searchQuery.trim().length < 2) {
      setProducts([])
      setCategories([])
      setBrands([])
      setShowDropdown(false)
      return
    }

    setShowHistory(false)
    debounceRef.current = setTimeout(async () => {
      setIsLoading(true)
      try {
        const res = await fetch(`/api/search/suggest?q=${encodeURIComponent(searchQuery.trim())}`)
        const data = await res.json()
        setProducts(data.products || [])
        setCategories(data.categories || [])
        setBrands(data.brands || [])
        setShowDropdown(true)
      } catch {
        setProducts([])
        setCategories([])
        setBrands([])
      } finally {
        setIsLoading(false)
      }
    }, 300)

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [searchQuery])

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowDropdown(false)
        setShowHistory(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const query = searchQuery.trim()
    if (query) {
      addToSearchHistory(query)
      setSearchHistory(getSearchHistory())
      setShowDropdown(false)
      setShowHistory(false)
      router.push(`/search?q=${encodeURIComponent(query)}`)
    }
  }

  const handleFocus = () => {
    if (searchQuery.trim().length >= 2 && hasSuggestions) {
      setShowDropdown(true)
    } else if (searchQuery.trim().length < 2 && searchHistory.length > 0) {
      setShowHistory(true)
    }
  }

  const handleHistoryClick = (q: string) => {
    setSearchQuery(q)
    setShowHistory(false)
    addToSearchHistory(q)
    setSearchHistory(getSearchHistory())
    router.push(`/search?q=${encodeURIComponent(q)}`)
  }

  // Accessibility: Keyboard navigation for mega-menu
  const handleMegaMenuKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setShowMegaMenu(false)
      megaMenuButtonRef.current?.focus()
    } else if (e.key === 'ArrowDown' && !showMegaMenu) {
      e.preventDefault()
      setShowMegaMenu(true)
    }
  }, [showMegaMenu])

  // Accessibility: Close mega-menu and return focus to trigger button
  const closeMegaMenu = useCallback(() => {
    setShowMegaMenu(false)
    megaMenuButtonRef.current?.focus()
  }, [])

  const trimmedQuery = useMemo(() => searchQuery.trim(), [searchQuery])

  return (
    <header className="sticky top-0 z-50 border-b border-secondary-200 bg-white">
      {/* Top bar */}
      <div className="bg-gradient-to-r from-primary-900 via-primary-800 to-primary-900 text-white">
        <div className="container-main flex items-center justify-between py-2.5">
          <div className="flex items-center gap-6 text-sm">
            <span className="flex items-center gap-1.5 font-medium">
              <svg className="h-4 w-4 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                <path d="M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
                <path d="M3 4a1 1 0 00-1 1v10a1 1 0 001 1h1.05a2.5 2.5 0 014.9 0H10a1 1 0 001-1v-1h3.05a2.5 2.5 0 014.9 0H19a1 1 0 001-1v-4a.5.5 0 00-.146-.354l-3-3A.5.5 0 0016.5 6H15V5a1 1 0 00-1-1H3z" />
              </svg>
              Same-Day Shipping
            </span>
            <span className="hidden sm:flex items-center gap-1.5">
              <svg className="h-4 w-4 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Quality Guaranteed
            </span>
            <span className="hidden md:flex items-center gap-1.5">
              <svg className="h-4 w-4 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
              </svg>
              Free Quotes in 24h
            </span>
          </div>
          <div className="flex items-center gap-5 text-sm">
            <a href="mailto:sales@machrio.com" className="hidden sm:flex items-center gap-1.5 hover:text-amber-300 transition-colors">
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
              </svg>
              sales@machrio.com
            </a>
            <Link href="/rfq" className="rounded-full bg-amber-500 px-4 py-1 font-semibold text-primary-900 hover:bg-amber-400 transition-colors">
              Get a Quote
            </Link>
          </div>
        </div>
      </div>

      {/* Main header */}
      <div className="container-main flex items-center gap-6 py-3">
        <Link href="/" className="flex-shrink-0">
          <span className="text-2xl font-bold text-primary-800">
            Mach<span className="text-amber-500">rio</span>
          </span>
        </Link>

        {/* Search */}
        <div ref={searchRef} className="flex flex-1 items-center">
          <form onSubmit={handleSearch} className="relative w-full max-w-2xl" role="search">
            {/* Accessibility: Screen reader label for search input */}
            <label htmlFor="header-search-input" className="sr-only">
              Search products, brands, and SKUs
            </label>
            <input
              id="header-search-input"
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={handleFocus}
              placeholder="Search products, brands, SKUs..."
              className="input-field w-full py-2.5 pl-4 pr-10"
              autoComplete="off"
              aria-label="Search products, brands, and SKUs"
              aria-describedby={showDropdown && hasSuggestions ? 'search-suggestions-status' : undefined}
              aria-expanded={showDropdown && hasSuggestions}
              aria-controls={showDropdown && hasSuggestions ? 'search-suggestions-dropdown' : undefined}
              aria-haspopup="listbox"
            />
            <button
              type="submit"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-secondary-400 hover:text-primary-600"
              aria-label="Submit search"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>

            {/* Accessibility: Live region for search status */}
            <div id="search-suggestions-status" className="sr-only" aria-live="polite">
              {isLoading && 'Searching...'}
              {!isLoading && hasSuggestions && `${products.length} products, ${categories.length} categories, ${brands.length} brands found`}
            </div>

            {/* Search history dropdown */}
            {showHistory && searchHistory.length > 0 && !showDropdown && (
              <div className="absolute left-0 right-0 top-full z-50 mt-1 overflow-hidden rounded-lg border border-secondary-200 bg-white shadow-lg">
                <div className="px-4 py-2 text-xs font-semibold uppercase tracking-wider text-secondary-400">
                  Recent Searches
                </div>
                {searchHistory.map((h, i) => (
                  <button
                    key={i}
                    onClick={() => handleHistoryClick(h)}
                    className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-secondary-700 transition-colors hover:bg-secondary-50"
                  >
                    <svg className="h-4 w-4 flex-shrink-0 text-secondary-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {h}
                  </button>
                ))}
              </div>
            )}

            {/* Autocomplete dropdown */}
            {showDropdown && (hasSuggestions || isLoading) && (
              <div 
                id="search-suggestions-dropdown"
                role="listbox"
                aria-label="Search suggestions"
                className="absolute left-0 right-0 top-full z-50 mt-1 overflow-hidden rounded-lg border border-secondary-200 bg-white shadow-lg"
              >
                {isLoading && !hasSuggestions ? (
                  <div className="px-4 py-3 text-sm text-secondary-400">Searching...</div>
                ) : (
                  <>
                    {/* Products section */}
                    {products.length > 0 && (
                      <div>
                        <div className="px-4 py-2 text-xs font-semibold uppercase tracking-wider text-secondary-400">
                          Products
                        </div>
                        {products.map((item) => (
                          <Link
                            key={item.slug}
                            href={`/product/${item.categorySlug}/${item.slug}`}
                            onClick={() => { setShowDropdown(false); setSearchQuery('') }}
                            className="flex items-center gap-3 px-4 py-2.5 transition-colors hover:bg-secondary-50"
                          >
                            {item.imageUrl ? (
                              <img src={item.imageUrl} alt="" className="h-10 w-10 rounded object-contain" />
                            ) : (
                              <div className="flex h-10 w-10 items-center justify-center rounded bg-secondary-100 text-secondary-300">
                                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                                </svg>
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="truncate text-sm text-secondary-700">
                                {highlightMatch(item.name, trimmedQuery)}
                              </p>
                              <p className="text-xs text-secondary-400">
                                {item.brand && <span>{item.brand} | </span>}
                                SKU: {item.sku}
                              </p>
                            </div>
                            {item.price && (
                              <span className="flex-shrink-0 text-sm font-semibold text-secondary-900">
                                ${item.price.toFixed(2)}
                              </span>
                            )}
                          </Link>
                        ))}
                      </div>
                    )}

                    {/* Categories section */}
                    {categories.length > 0 && (
                      <div className={products.length > 0 ? 'border-t border-secondary-100' : ''}>
                        <div className="px-4 py-2 text-xs font-semibold uppercase tracking-wider text-secondary-400">
                          Categories
                        </div>
                        {categories.map((cat) => (
                          <Link
                            key={cat.slug}
                            href={`/category/${cat.slug}`}
                            onClick={() => { setShowDropdown(false); setSearchQuery('') }}
                            className="flex items-center justify-between px-4 py-2.5 transition-colors hover:bg-secondary-50"
                          >
                            <div className="flex items-center gap-3">
                              <div className="flex h-8 w-8 items-center justify-center rounded bg-primary-50 text-primary-600">
                                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                                </svg>
                              </div>
                              <span className="text-sm text-secondary-700">{highlightMatch(cat.name, trimmedQuery)}</span>
                            </div>
                            <span className="rounded-full bg-secondary-100 px-2 py-0.5 text-xs text-secondary-500">
                              {cat.productCount} products
                            </span>
                          </Link>
                        ))}
                      </div>
                    )}

                    {/* Brands section */}
                    {brands.length > 0 && (
                      <div className={(products.length > 0 || categories.length > 0) ? 'border-t border-secondary-100' : ''}>
                        <div className="px-4 py-2 text-xs font-semibold uppercase tracking-wider text-secondary-400">
                          Brands
                        </div>
                        {brands.map((brand) => (
                          <Link
                            key={brand.slug}
                            href={`/search?q=${encodeURIComponent(brand.name)}`}
                            onClick={() => { setShowDropdown(false); setSearchQuery('') }}
                            className="flex items-center gap-3 px-4 py-2.5 transition-colors hover:bg-secondary-50"
                          >
                            <div className="flex h-8 w-8 items-center justify-center rounded bg-amber-50 text-amber-600">
                              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A2 2 0 013 12V7a4 4 0 014-4z" />
                              </svg>
                            </div>
                            <span className="text-sm text-secondary-700">{highlightMatch(brand.name, trimmedQuery)}</span>
                          </Link>
                        ))}
                      </div>
                    )}

                    {/* View all results link */}
                    <Link
                      href={`/search?q=${encodeURIComponent(trimmedQuery)}`}
                      onClick={() => {
                        addToSearchHistory(trimmedQuery)
                        setSearchHistory(getSearchHistory())
                        setShowDropdown(false)
                      }}
                      className="block border-t border-secondary-100 px-4 py-2.5 text-center text-sm font-medium text-primary-600 hover:bg-primary-50"
                    >
                      View all results for &ldquo;{trimmedQuery}&rdquo;
                    </Link>
                  </>
                )}
              </div>
            )}
          </form>
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-4">
          <Link 
            href="/account" 
            className="flex min-h-[44px] min-w-[44px] flex-col items-center justify-center text-xs text-secondary-600 hover:text-primary-700"
            aria-label="My account"
          >
            <svg className="mb-0.5 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            Account
          </Link>
          <Link 
            href="/cart" 
            className="relative flex min-h-[44px] min-w-[44px] flex-col items-center justify-center text-xs text-secondary-600 hover:text-primary-700"
            aria-label={`Shopping cart${itemCount > 0 ? `, ${itemCount} ${itemCount === 1 ? 'item' : 'items'}` : ', empty'}`}
          >
            <svg className="mb-0.5 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" />
            </svg>
            <span aria-hidden="true">Cart</span>
            <span className="sr-only">{itemCount > 0 ? `${itemCount} items in cart` : 'Cart is empty'}</span>
            {itemCount > 0 && (
              <span className="absolute -right-2 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-amber-500 text-[10px] font-bold text-white" aria-hidden="true">
                {itemCount}
              </span>
            )}
          </Link>
          {/* Accessibility: Live region for cart updates */}
          <div aria-live="polite" aria-atomic="true" className="sr-only">
            {cartAnnouncement}
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="border-t border-secondary-100 bg-secondary-50" aria-label="Main navigation">
        <div className="container-main flex items-center gap-1">
          {/* Mobile menu button */}
          <button
            type="button"
            className="flex items-center gap-1.5 px-3 py-2.5 text-sm font-medium text-secondary-700 transition-colors hover:bg-primary-50 hover:text-primary-700 md:hidden"
            onClick={() => setShowMobileMenu(true)}
            aria-label="Open category menu"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          {/* Desktop: Categories flyout menu trigger */}
          <div
            ref={megaMenuRef}
            className="relative hidden md:block"
            onMouseEnter={() => {
              if (megaMenuTimeout.current) clearTimeout(megaMenuTimeout.current)
              setShowMegaMenu(true)
            }}
            onMouseLeave={() => {
              megaMenuTimeout.current = setTimeout(() => setShowMegaMenu(false), 200)
            }}
          >
            <button
              ref={megaMenuButtonRef}
              type="button"
              className="flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium text-secondary-700 transition-colors hover:bg-primary-50 hover:text-primary-700"
              onClick={() => setShowMegaMenu(!showMegaMenu)}
              onKeyDown={handleMegaMenuKeyDown}
              aria-expanded={showMegaMenu}
              aria-controls="flyout-menu-panel"
              aria-haspopup="true"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
              All Categories
              <svg className={`h-3 w-3 transition-transform ${showMegaMenu ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* Desktop: Three-level flyout menu */}
            {showMegaMenu && navCategories.length > 0 && (
              <CategoryFlyoutMenu 
                categories={navCategories} 
                onClose={closeMegaMenu} 
              />
            )}
          </div>

          {/* Main nav links */}
          <div className="hidden md:flex items-center gap-1">
            {mainNav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="px-4 py-2.5 text-sm font-medium text-secondary-700 transition-colors hover:bg-primary-50 hover:text-primary-700"
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      </nav>

      {/* Mobile: Category drawer menu */}
      <CategoryDrawerMenu 
        categories={navCategories}
        isOpen={showMobileMenu}
        onClose={() => setShowMobileMenu(false)}
      />
    </header>
  )
}
