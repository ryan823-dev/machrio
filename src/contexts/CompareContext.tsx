'use client'

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'

export interface CompareProduct {
  id: string
  name: string
  slug: string
  categorySlug: string
  sku: string
  brand: string
  image?: string
  price?: number
  currency?: string
  priceUnit?: string
  availability?: string
  specs?: { label: string; value: string }[]
}

interface CompareContextType {
  compareItems: CompareProduct[]
  addToCompare: (product: CompareProduct) => void
  removeFromCompare: (id: string) => void
  clearCompare: () => void
  isInCompare: (id: string) => boolean
  isCompareOpen: boolean
  setCompareOpen: (open: boolean) => void
}

const COMPARE_KEY = 'machrio_compare_products'
const MAX_COMPARE = 4

const CompareContext = createContext<CompareContextType | null>(null)

export function CompareProvider({ children }: { children: ReactNode }) {
  const [compareItems, setCompareItems] = useState<CompareProduct[]>([])
  const [isCompareOpen, setCompareOpen] = useState(false)
  const [hydrated, setHydrated] = useState(false)

  // Hydrate from localStorage on mount (client-side only)
  useEffect(() => {
    try {
      const stored = localStorage.getItem(COMPARE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        // eslint-disable-next-line react-hooks/set-state-in-effect
        if (Array.isArray(parsed)) setCompareItems(parsed.slice(0, MAX_COMPARE))
      }
    } catch { /* ignore */ }
    setHydrated(true)
  }, [])

  useEffect(() => {
    if (hydrated) {
      localStorage.setItem(COMPARE_KEY, JSON.stringify(compareItems))
    }
  }, [compareItems, hydrated])

  const addToCompare = useCallback((product: CompareProduct) => {
    setCompareItems(prev => {
      if (prev.length >= MAX_COMPARE) return prev
      if (prev.some(p => p.id === product.id)) return prev
      return [...prev, product]
    })
  }, [])

  const removeFromCompare = useCallback((id: string) => {
    setCompareItems(prev => prev.filter(p => p.id !== id))
  }, [])

  const clearCompare = useCallback(() => {
    setCompareItems([])
    setCompareOpen(false)
  }, [])

  const isInCompare = useCallback((id: string) => {
    return compareItems.some(p => p.id === id)
  }, [compareItems])

  return (
    <CompareContext.Provider value={{
      compareItems,
      addToCompare,
      removeFromCompare,
      clearCompare,
      isInCompare,
      isCompareOpen,
      setCompareOpen,
    }}>
      {children}
    </CompareContext.Provider>
  )
}

export function useCompare() {
  const context = useContext(CompareContext)
  if (!context) throw new Error('useCompare must be used within a CompareProvider')
  return context
}
