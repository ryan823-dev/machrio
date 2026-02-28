'use client'

import { createContext, useContext, useState, useEffect, useCallback, useRef, type ReactNode } from 'react'

export interface CartItem {
  productId: string
  sku: string
  name: string
  slug: string
  categorySlug: string
  image?: string
  price: number
  quantity: number
  priceUnit?: string
}

export interface ShippingMethodQuote {
  code: string
  name: string
  transitDays: number
  estimatedDeliveryDate: string
  cost: number
  breakdown: {
    baseWeight: number
    baseRate: number
    overageWeight: number
    additionalRate: number
    overageCost: number
    handlingFee: number
  }
  isFreeShipping: boolean
  freeShippingThreshold?: number
  gapToFreeShipping?: number
}

interface CartState {
  items: CartItem[]
  selectedItems: Set<string>
  itemCount: number
  subtotal: number
  shippingCost: number
  total: number
  shippingCountry: string
  shippingMethodCode: string
  shippingQuotes: ShippingMethodQuote[]
  shippingLoading: boolean
  estimatedShipDate: string
  totalWeight: number
}

interface CartContextType extends CartState {
  addItem: (item: Omit<CartItem, 'quantity'> & { quantity?: number }) => void
  removeItem: (productId: string) => void
  updateQuantity: (productId: string, quantity: number) => void
  clearCart: () => void
  toggleItem: (productId: string) => void
  selectAll: () => void
  deselectAll: () => void
  setShippingCountry: (country: string) => void
  setShippingMethod: (code: string) => void
}

const STORAGE_KEY = 'machrio_cart'
const SELECTION_KEY = 'machrio_cart_selection'
const SHIPPING_COUNTRY_KEY = 'machrio_shipping_country'
const SHIPPING_METHOD_KEY = 'machrio_shipping_method'

const CartContext = createContext<CartContextType | null>(null)

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set())
  const [shippingCountry, setShippingCountryState] = useState('US')
  const [shippingMethodCode, setShippingMethodCodeState] = useState('')
  const [shippingQuotes, setShippingQuotes] = useState<ShippingMethodQuote[]>([])
  const [shippingLoading, setShippingLoading] = useState(false)
  const [estimatedShipDate, setEstimatedShipDate] = useState('')
  const [totalWeight, setTotalWeight] = useState(0)
  const [hydrated, setHydrated] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Hydrate from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        if (Array.isArray(parsed)) {
          setItems(parsed)
          // Hydrate selection: default all selected
          const storedSelection = localStorage.getItem(SELECTION_KEY)
          if (storedSelection) {
            const selParsed = JSON.parse(storedSelection)
            if (Array.isArray(selParsed)) {
              setSelectedItems(new Set(selParsed))
            }
          } else {
            setSelectedItems(new Set(parsed.map((i: CartItem) => i.productId)))
          }
        }
      }
      const storedCountry = localStorage.getItem(SHIPPING_COUNTRY_KEY)
      if (storedCountry) setShippingCountryState(storedCountry)
      const storedMethod = localStorage.getItem(SHIPPING_METHOD_KEY)
      if (storedMethod) setShippingMethodCodeState(storedMethod)
    } catch { /* ignore corrupt data */ }
    setHydrated(true)
  }, [])

  // Persist to localStorage on change
  useEffect(() => {
    if (hydrated) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
      localStorage.setItem(SELECTION_KEY, JSON.stringify([...selectedItems]))
      localStorage.setItem(SHIPPING_COUNTRY_KEY, shippingCountry)
      if (shippingMethodCode) localStorage.setItem(SHIPPING_METHOD_KEY, shippingMethodCode)
    }
  }, [items, selectedItems, shippingCountry, shippingMethodCode, hydrated])

  // Compute selected-only subtotal
  const selectedCartItems = items.filter(i => selectedItems.has(i.productId))
  const subtotal = selectedCartItems.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const itemCount = selectedCartItems.reduce((sum, item) => sum + item.quantity, 0)

  // Get shipping cost from selected method
  const selectedQuote = shippingQuotes.find(q => q.code === shippingMethodCode)
  const shippingCost = selectedQuote?.cost ?? 0
  const total = subtotal + shippingCost

  // Fetch shipping quotes
  const fetchShippingQuotes = useCallback(async (
    cartItems: CartItem[],
    selected: Set<string>,
    country: string,
    sub: number,
  ) => {
    const selectedProducts = cartItems.filter(i => selected.has(i.productId))
    if (selectedProducts.length === 0) {
      setShippingQuotes([])
      setEstimatedShipDate('')
      setTotalWeight(0)
      return
    }

    setShippingLoading(true)
    try {
      const res = await fetch('/api/shipping/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: selectedProducts.map(i => ({ productId: i.productId, quantity: i.quantity })),
          country,
          subtotal: sub,
        }),
      })
      const data = await res.json()
      if (data.success && data.methods) {
        setShippingQuotes(data.methods)
        setEstimatedShipDate(data.estimatedShipDate || '')
        setTotalWeight(data.totalWeight || 0)
      } else {
        setShippingQuotes([])
      }
    } catch {
      setShippingQuotes([])
    } finally {
      setShippingLoading(false)
    }
  }, [])

  // Debounced shipping quote refresh
  useEffect(() => {
    if (!hydrated) return
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      fetchShippingQuotes(items, selectedItems, shippingCountry, subtotal)
    }, 500)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, selectedItems, shippingCountry, hydrated])

  // Auto-select first method if current selection is invalid
  useEffect(() => {
    if (shippingQuotes.length > 0 && !shippingQuotes.find(q => q.code === shippingMethodCode)) {
      setShippingMethodCodeState(shippingQuotes[0].code)
    }
  }, [shippingQuotes, shippingMethodCode])

  const addItem = useCallback((newItem: Omit<CartItem, 'quantity'> & { quantity?: number }) => {
    const qty = newItem.quantity || 1
    setItems(prev => {
      const existing = prev.find(i => i.productId === newItem.productId)
      if (existing) {
        return prev.map(i =>
          i.productId === newItem.productId
            ? { ...i, quantity: i.quantity + qty }
            : i
        )
      }
      return [...prev, { ...newItem, quantity: qty }]
    })
    // Auto-select new item
    setSelectedItems(prev => new Set([...prev, newItem.productId]))
  }, [])

  const removeItem = useCallback((productId: string) => {
    setItems(prev => prev.filter(i => i.productId !== productId))
    setSelectedItems(prev => {
      const next = new Set(prev)
      next.delete(productId)
      return next
    })
  }, [])

  const updateQuantity = useCallback((productId: string, quantity: number) => {
    if (quantity < 1) return
    setItems(prev => prev.map(i =>
      i.productId === productId ? { ...i, quantity } : i
    ))
  }, [])

  const clearCart = useCallback(() => {
    setItems([])
    setSelectedItems(new Set())
    setShippingQuotes([])
  }, [])

  const toggleItem = useCallback((productId: string) => {
    setSelectedItems(prev => {
      const next = new Set(prev)
      if (next.has(productId)) {
        next.delete(productId)
      } else {
        next.add(productId)
      }
      return next
    })
  }, [])

  const selectAll = useCallback(() => {
    setSelectedItems(new Set(items.map(i => i.productId)))
  }, [items])

  const deselectAll = useCallback(() => {
    setSelectedItems(new Set())
  }, [])

  const setShippingCountry = useCallback((country: string) => {
    setShippingCountryState(country)
  }, [])

  const setShippingMethod = useCallback((code: string) => {
    setShippingMethodCodeState(code)
  }, [])

  return (
    <CartContext.Provider value={{
      items,
      selectedItems,
      itemCount,
      subtotal,
      shippingCost,
      total,
      shippingCountry,
      shippingMethodCode,
      shippingQuotes,
      shippingLoading,
      estimatedShipDate,
      totalWeight,
      addItem,
      removeItem,
      updateQuantity,
      clearCart,
      toggleItem,
      selectAll,
      deselectAll,
      setShippingCountry,
      setShippingMethod,
    }}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const context = useContext(CartContext)
  if (!context) throw new Error('useCart must be used within a CartProvider')
  return context
}
