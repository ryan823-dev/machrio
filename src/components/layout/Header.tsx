'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useCart } from '@/contexts/CartContext'

const mainNav = [
  { label: 'All Categories', href: '/category' },
  { label: 'Industries', href: '/industry/manufacturing' },
  { label: 'New Arrivals', href: '/category?sort=newest' },
  { label: 'Volume Pricing', href: '/deals' },
  { label: 'Knowledge Center', href: '/knowledge-center' },
  { label: 'Request a Quote', href: '/rfq' },
]

export function Header() {
  const { itemCount } = useCart()
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')
  const [suggestions, setSuggestions] = useState<Array<{
    name: string; slug: string; categorySlug: string; sku: string;
    imageUrl: string | null; price: number | null; currency: string;
  }>>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)
  const debounceRef = useRef<NodeJS.Timeout | null>(null)

  // Debounced fetch suggestions
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)

    if (searchQuery.trim().length < 2) {
      setSuggestions([])
      setShowSuggestions(false)
      return
    }

    debounceRef.current = setTimeout(async () => {
      setIsLoading(true)
      try {
        const res = await fetch(`/api/search/suggest?q=${encodeURIComponent(searchQuery.trim())}`)
        const data = await res.json()
        setSuggestions(data.suggestions || [])
        setShowSuggestions(true)
      } catch {
        setSuggestions([])
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
        setShowSuggestions(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const query = searchQuery.trim()
    if (query) {
      setShowSuggestions(false)
      router.push(`/search?q=${encodeURIComponent(query)}`)
    }
  }

  return (
    <header className="sticky top-0 z-50 border-b border-secondary-200 bg-white">
      {/* Top bar */}
      <div className="bg-gradient-to-r from-primary-900 via-primary-800 to-primary-900 text-white">
        <div className="container-main flex items-center justify-between py-2.5">
          {/* Left: Value props */}
          <div className="flex items-center gap-6 text-sm">
            <span className="flex items-center gap-1.5 font-medium">
              <svg className="h-4 w-4 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                <path d="M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
                <path d="M3 4a1 1 0 00-1 1v10a1 1 0 001 1h1.05a2.5 2.5 0 014.9 0H10a1 1 0 001-1v-1h3.05a2.5 2.5 0 014.9 0H19a1 1 0 001-1v-4a.5.5 0 00-.146-.354l-3-3A.5.5 0 0016.5 6H15V5a1 1 0 00-1-1H3z" />
              </svg>
              Same-Day Shipping
            </span>
            <span className="flex items-center gap-1.5">
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
          {/* Right: Contact */}
          <div className="flex items-center gap-5 text-sm">
            <a href="mailto:sales@machrio.com" className="flex items-center gap-1.5 hover:text-amber-300 transition-colors">
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
        {/* Logo */}
        <Link href="/" className="flex-shrink-0">
          <span className="text-2xl font-bold text-primary-800">
            Mach<span className="text-amber-500">rio</span>
          </span>
        </Link>

        {/* Search */}
        <div ref={searchRef} className="flex flex-1 items-center">
          <form onSubmit={handleSearch} className="relative w-full max-w-2xl">
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => { if (suggestions.length > 0) setShowSuggestions(true) }}
              placeholder="Search products, brands, SKUs..."
              className="input-field w-full py-2.5 pl-4 pr-10"
              autoComplete="off"
            />
            <button
              type="submit"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-secondary-400 hover:text-primary-600"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </button>

            {/* Autocomplete dropdown */}
            {showSuggestions && (suggestions.length > 0 || isLoading) && (
              <div className="absolute left-0 right-0 top-full z-50 mt-1 overflow-hidden rounded-lg border border-secondary-200 bg-white shadow-lg">
                {isLoading && suggestions.length === 0 ? (
                  <div className="px-4 py-3 text-sm text-secondary-400">Searching...</div>
                ) : (
                  <>
                    {suggestions.map((item) => (
                      <Link
                        key={item.slug}
                        href={`/product/${item.categorySlug}/${item.slug}`}
                        onClick={() => { setShowSuggestions(false); setSearchQuery('') }}
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
                          <p className="truncate text-sm font-medium text-secondary-800">{item.name}</p>
                          <p className="text-xs text-secondary-400">SKU: {item.sku}</p>
                        </div>
                        {item.price && (
                          <span className="flex-shrink-0 text-sm font-semibold text-secondary-900">
                            ${item.price.toFixed(2)}
                          </span>
                        )}
                      </Link>
                    ))}
                    <Link
                      href={`/search?q=${encodeURIComponent(searchQuery.trim())}`}
                      onClick={() => { setShowSuggestions(false) }}
                      className="block border-t border-secondary-100 px-4 py-2.5 text-center text-sm font-medium text-primary-600 hover:bg-primary-50"
                    >
                      View all results for &ldquo;{searchQuery.trim()}&rdquo;
                    </Link>
                  </>
                )}
              </div>
            )}
          </form>
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-4">
          <Link href="/account" className="flex flex-col items-center text-xs text-secondary-600 hover:text-primary-700">
            <svg className="mb-0.5 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            Account
          </Link>
          <Link href="/cart" className="relative flex flex-col items-center text-xs text-secondary-600 hover:text-primary-700">
            <svg className="mb-0.5 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" />
            </svg>
            Cart
            {itemCount > 0 && (
              <span className="absolute -right-2 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-amber-500 text-[10px] font-bold text-white">
                {itemCount}
              </span>
            )}
          </Link>
        </div>
      </div>

      {/* Navigation */}
      <nav className="border-t border-secondary-100 bg-secondary-50">
        <div className="container-main flex items-center gap-1">
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
      </nav>
    </header>
  )
}
