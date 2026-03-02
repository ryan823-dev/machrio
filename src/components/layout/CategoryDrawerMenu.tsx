'use client'

import { useState, useCallback, useEffect } from 'react'
import Link from 'next/link'
import type { NavCategory } from './CategoryFlyoutMenu'

interface CategoryDrawerMenuProps {
  categories: NavCategory[]
  isOpen: boolean
  onClose: () => void
}

export function CategoryDrawerMenu({ categories, isOpen, onClose }: CategoryDrawerMenuProps) {
  const [expandedL1, setExpandedL1] = useState<string | null>(null)
  const [expandedL2, setExpandedL2] = useState<string | null>(null)

  // Reset state when drawer closes
  useEffect(() => {
    if (!isOpen) {
      setExpandedL1(null)
      setExpandedL2(null)
    }
  }, [isOpen])

  // Prevent body scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  const toggleL1 = useCallback((id: string) => {
    setExpandedL1(prev => prev === id ? null : id)
    setExpandedL2(null)
  }, [])

  const toggleL2 = useCallback((id: string) => {
    setExpandedL2(prev => prev === id ? null : id)
  }, [])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose()
    }
  }, [onClose])

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 z-50 bg-black/50 transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />
      
      {/* Drawer */}
      <div 
        className="fixed inset-y-0 left-0 z-50 flex w-full max-w-sm flex-col bg-white shadow-xl"
        role="dialog"
        aria-modal="true"
        aria-label="Category menu"
        onKeyDown={handleKeyDown}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-secondary-200 px-4 py-3">
          <span className="text-lg font-semibold text-secondary-900">Categories</span>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-secondary-500 hover:bg-secondary-100 hover:text-secondary-700"
            aria-label="Close menu"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Category list */}
        <div className="flex-1 overflow-y-auto">
          <nav aria-label="Category navigation">
            {categories.map((l1) => (
              <div key={l1.id} className="border-b border-secondary-100">
                {/* L1 Header */}
                <div className="flex items-center">
                  <Link
                    href={`/category/${l1.slug}`}
                    onClick={onClose}
                    className="flex-1 px-4 py-3 text-sm font-medium text-secondary-900 hover:bg-secondary-50"
                  >
                    {l1.name}
                  </Link>
                  {l1.children && l1.children.length > 0 && (
                    <button
                      type="button"
                      onClick={() => toggleL1(l1.id)}
                      className="px-4 py-3 text-secondary-500 hover:bg-secondary-50 hover:text-secondary-700"
                      aria-expanded={expandedL1 === l1.id}
                      aria-label={`${expandedL1 === l1.id ? 'Collapse' : 'Expand'} ${l1.name}`}
                    >
                      <svg 
                        className={`h-4 w-4 transition-transform ${expandedL1 === l1.id ? 'rotate-180' : ''}`} 
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                  )}
                </div>

                {/* L2 Accordion */}
                {expandedL1 === l1.id && l1.children && l1.children.length > 0 && (
                  <div className="bg-secondary-50">
                    {l1.children.map((l2) => (
                      <div key={l2.id}>
                        {/* L2 Header */}
                        <div className="flex items-center">
                          <Link
                            href={`/category/${l2.slug}`}
                            onClick={onClose}
                            className="flex-1 py-2.5 pl-8 pr-4 text-sm text-secondary-700 hover:bg-secondary-100 hover:text-primary-700"
                          >
                            {l2.name}
                          </Link>
                          {l2.children && l2.children.length > 0 && (
                            <button
                              type="button"
                              onClick={() => toggleL2(l2.id)}
                              className="px-4 py-2.5 text-secondary-400 hover:bg-secondary-100 hover:text-secondary-600"
                              aria-expanded={expandedL2 === l2.id}
                              aria-label={`${expandedL2 === l2.id ? 'Collapse' : 'Expand'} ${l2.name}`}
                            >
                              <svg 
                                className={`h-3 w-3 transition-transform ${expandedL2 === l2.id ? 'rotate-180' : ''}`} 
                                fill="none" 
                                stroke="currentColor" 
                                viewBox="0 0 24 24"
                              >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                              </svg>
                            </button>
                          )}
                        </div>

                        {/* L3 List */}
                        {expandedL2 === l2.id && l2.children && l2.children.length > 0 && (
                          <div className="bg-white">
                            {l2.children.map((l3) => (
                              <Link
                                key={l3.id}
                                href={`/category/${l3.slug}`}
                                onClick={onClose}
                                className="block py-2 pl-12 pr-4 text-sm text-secondary-600 hover:bg-primary-50 hover:text-primary-700"
                              >
                                {l3.name}
                              </Link>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </nav>
        </div>

        {/* Footer */}
        <div className="border-t border-secondary-200 p-4">
          <Link
            href="/category"
            onClick={onClose}
            className="block w-full rounded-lg bg-primary-600 py-2.5 text-center text-sm font-medium text-white hover:bg-primary-700"
          >
            View All Categories
          </Link>
        </div>
      </div>
    </>
  )
}
