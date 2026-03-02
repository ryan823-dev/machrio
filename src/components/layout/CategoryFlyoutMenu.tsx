'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import Link from 'next/link'

export interface NavCategory {
  id: string
  name: string
  slug: string
  children?: NavCategory[]
}

interface CategoryFlyoutMenuProps {
  categories: NavCategory[]
  onClose: () => void
}

export function CategoryFlyoutMenu({ categories, onClose }: CategoryFlyoutMenuProps) {
  const [activeL1, setActiveL1] = useState<string | null>(null)
  const [activeL2, setActiveL2] = useState<string | null>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Get active L2 and L3 children
  const activeL1Cat = categories.find(c => c.id === activeL1)
  const l2Children = activeL1Cat?.children || []
  const activeL2Cat = l2Children.find(c => c.id === activeL2)
  const l3Children = activeL2Cat?.children || []

  // Debounced hover handlers
  const handleL1Enter = useCallback((id: string) => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current)
    setActiveL1(id)
    setActiveL2(null)
  }, [])

  const handleL2Enter = useCallback((id: string) => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current)
    setActiveL2(id)
  }, [])

  const handleMouseLeave = useCallback(() => {
    hoverTimeoutRef.current = setTimeout(() => {
      setActiveL1(null)
      setActiveL2(null)
    }, 200)
  }, [])

  const handlePanelEnter = useCallback(() => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current)
  }, [])

  // Keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose()
    }
  }, [onClose])

  // Auto-select first L1 on mount for better UX
  useEffect(() => {
    if (categories.length > 0 && !activeL1) {
      setActiveL1(categories[0].id)
    }
  }, [categories, activeL1])

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current)
    }
  }, [])

  if (categories.length === 0) return null

  return (
    <div
      ref={menuRef}
      className="absolute left-0 top-full z-50 flex rounded-b-lg border border-t-0 border-secondary-200 bg-white shadow-xl"
      onMouseLeave={handleMouseLeave}
      onKeyDown={handleKeyDown}
      role="menu"
      aria-label="Product categories"
    >
      {/* L1 Column */}
      <div 
        className="w-60 border-r border-secondary-100 bg-secondary-50"
        onMouseEnter={handlePanelEnter}
      >
        <div className="max-h-[70vh] overflow-y-auto py-2">
          {categories.map((l1) => (
            <div
              key={l1.id}
              className={`group relative ${activeL1 === l1.id ? 'bg-white' : ''}`}
              onMouseEnter={() => handleL1Enter(l1.id)}
            >
              <Link
                href={`/category/${l1.slug}`}
                onClick={onClose}
                className={`flex items-center justify-between px-4 py-2.5 text-sm transition-colors ${
                  activeL1 === l1.id 
                    ? 'bg-white font-medium text-primary-700' 
                    : 'text-secondary-700 hover:bg-white hover:text-primary-700'
                }`}
                role="menuitem"
                aria-haspopup={l1.children && l1.children.length > 0 ? 'true' : undefined}
                aria-expanded={activeL1 === l1.id ? 'true' : undefined}
              >
                <span className="truncate">{l1.name}</span>
                {l1.children && l1.children.length > 0 && (
                  <svg 
                    className={`ml-2 h-4 w-4 flex-shrink-0 transition-colors ${
                      activeL1 === l1.id ? 'text-primary-600' : 'text-secondary-400'
                    }`} 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                )}
              </Link>
            </div>
          ))}
        </div>
      </div>

      {/* L2 Column - Shows when L1 is hovered and has children */}
      {activeL1 && l2Children.length > 0 && (
        <div 
          className="w-60 border-r border-secondary-100"
          onMouseEnter={handlePanelEnter}
        >
          <div className="border-b border-secondary-100 bg-secondary-50 px-4 py-2">
            <Link
              href={`/category/${activeL1Cat?.slug}`}
              onClick={onClose}
              className="text-sm font-semibold text-secondary-900 hover:text-primary-700"
            >
              {activeL1Cat?.name}
            </Link>
          </div>
          <div className="max-h-[calc(70vh-40px)] overflow-y-auto py-2">
            {l2Children.map((l2) => (
              <div
                key={l2.id}
                className={`${activeL2 === l2.id ? 'bg-primary-50' : ''}`}
                onMouseEnter={() => handleL2Enter(l2.id)}
              >
                <Link
                  href={`/category/${l2.slug}`}
                  onClick={onClose}
                  className={`flex items-center justify-between px-4 py-2 text-sm transition-colors ${
                    activeL2 === l2.id 
                      ? 'font-medium text-primary-700' 
                      : 'text-secondary-600 hover:bg-primary-50 hover:text-primary-700'
                  }`}
                  role="menuitem"
                  aria-haspopup={l2.children && l2.children.length > 0 ? 'true' : undefined}
                  aria-expanded={activeL2 === l2.id ? 'true' : undefined}
                >
                  <span className="truncate">{l2.name}</span>
                  {l2.children && l2.children.length > 0 && (
                    <svg 
                      className={`ml-2 h-4 w-4 flex-shrink-0 ${
                        activeL2 === l2.id ? 'text-primary-600' : 'text-secondary-400'
                      }`} 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  )}
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* L3 Column - Shows when L2 is hovered and has children */}
      {activeL2 && l3Children.length > 0 && (
        <div 
          className="w-60"
          onMouseEnter={handlePanelEnter}
        >
          <div className="border-b border-secondary-100 bg-secondary-50 px-4 py-2">
            <Link
              href={`/category/${activeL2Cat?.slug}`}
              onClick={onClose}
              className="text-sm font-semibold text-secondary-900 hover:text-primary-700"
            >
              {activeL2Cat?.name}
            </Link>
          </div>
          <div className="max-h-[calc(70vh-40px)] overflow-y-auto py-2">
            {l3Children.map((l3) => (
              <Link
                key={l3.id}
                href={`/category/${l3.slug}`}
                onClick={onClose}
                className="block px-4 py-2 text-sm text-secondary-600 transition-colors hover:bg-primary-50 hover:text-primary-700"
                role="menuitem"
              >
                {l3.name}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Empty state for L2 when L1 has no children */}
      {activeL1 && l2Children.length === 0 && (
        <div className="flex w-60 items-center justify-center p-8 text-sm text-secondary-400">
          <Link
            href={`/category/${activeL1Cat?.slug}`}
            onClick={onClose}
            className="text-center hover:text-primary-600"
          >
            View all {activeL1Cat?.name} products
          </Link>
        </div>
      )}
    </div>
  )
}
