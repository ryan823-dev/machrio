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

export interface CartAddInput extends Omit<CartItem, 'quantity'> {
  quantity?: number
}

export interface CartNotice {
  id: number
  title: string
  message: string
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
  addItem: (item: CartAddInput) => void
  addItems: (items: CartAddInput[]) => void
  removeItem: (productId: string) => void
  updateQuantity: (productId: string, quantity: number) => void
  clearCart: () => void
  toggleItem: (productId: string) => void
  selectAll: () => void
  deselectAll: () => void
  setShippingCountry: (country: string) => void
  setShippingMethod: (code: string) => void
  hasLiveShippingQuote: boolean
  cartNotice: CartNotice | null
  dismissCartNotice: () => void
}

const STORAGE_KEY = 'machrio_cart'
const SELECTION_KEY = 'machrio_cart_selection'
const SHIPPING_COUNTRY_KEY = 'machrio_shipping_country'
const SHIPPING_METHOD_KEY = 'machrio_shipping_method'

const CartContext = createContext<CartContextType | null>(null)

interface CartAdditionSummary {
  nextItems: CartItem[]
  totalQuantity: number
  totalQuantityAdded: number
  addedProducts: number
  updatedProducts: number
  lastAddedItem: CartItem
}

function summarizeCartAddition(currentItems: CartItem[], additions: CartAddInput[]): CartAdditionSummary | null {
  if (additions.length === 0) return null

  const nextItems = currentItems.map((item) => ({ ...item }))
  let totalQuantityAdded = 0
  let addedProducts = 0
  let updatedProducts = 0
  let lastAddedItem: CartItem | null = null

  for (const addition of additions) {
    const quantity = addition.quantity && addition.quantity > 0 ? addition.quantity : 1
    totalQuantityAdded += quantity
    lastAddedItem = { ...addition, quantity }

    const existingIndex = nextItems.findIndex((item) => item.productId === addition.productId)
    if (existingIndex >= 0) {
      nextItems[existingIndex] = {
        ...nextItems[existingIndex],
        quantity: nextItems[existingIndex].quantity + quantity,
      }
      updatedProducts += 1
      continue
    }

    nextItems.push({ ...addition, quantity })
    addedProducts += 1
  }

  if (!lastAddedItem) return null

  return {
    nextItems,
    totalQuantity: nextItems.reduce((sum, item) => sum + item.quantity, 0),
    totalQuantityAdded,
    addedProducts,
    updatedProducts,
    lastAddedItem,
  }
}

function buildCartNotice(summary: CartAdditionSummary, additionsCount: number): CartNotice {
  if (additionsCount === 1) {
    const title = summary.updatedProducts > 0 ? 'Updated cart quantity' : 'Added to cart'
    const message = `${summary.lastAddedItem.name} x${summary.totalQuantityAdded}. Cart now has ${summary.totalQuantity} ${summary.totalQuantity === 1 ? 'item' : 'items'}.`

    return {
      id: Date.now(),
      title,
      message,
    }
  }

  const message = `${additionsCount} ${additionsCount === 1 ? 'product' : 'products'} added. Cart now has ${summary.totalQuantity} ${summary.totalQuantity === 1 ? 'item' : 'items'}.`

  return {
    id: Date.now(),
    title: 'Added items to cart',
    message,
  }
}

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
  const [cartNotice, setCartNotice] = useState<CartNotice | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const itemsRef = useRef<CartItem[]>([])
  const selectedItemsRef = useRef<Set<string>>(new Set())

  // Hydrate from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        if (Array.isArray(parsed)) {
          itemsRef.current = parsed
          setItems(parsed)
          // Hydrate selection: default all selected
          const storedSelection = localStorage.getItem(SELECTION_KEY)
          if (storedSelection) {
            const selParsed = JSON.parse(storedSelection)
            if (Array.isArray(selParsed)) {
              const nextSelected = new Set(selParsed)
              selectedItemsRef.current = nextSelected
              setSelectedItems(nextSelected)
            }
          } else {
            const nextSelected = new Set(parsed.map((i: CartItem) => i.productId))
            selectedItemsRef.current = nextSelected
            setSelectedItems(nextSelected)
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

  useEffect(() => {
    itemsRef.current = items
  }, [items])

  useEffect(() => {
    selectedItemsRef.current = selectedItems
  }, [selectedItems])

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
  const hasLiveShippingQuote = Boolean(selectedQuote)
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
      setShippingMethodCodeState('')
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
      if (data.success && Array.isArray(data.methods) && data.methods.length > 0) {
        setShippingQuotes(data.methods)
        setEstimatedShipDate(data.estimatedShipDate || '')
        setTotalWeight(data.totalWeight || 0)
      } else {
        setShippingQuotes([])
        setEstimatedShipDate('')
        setTotalWeight(0)
        setShippingMethodCodeState('')
      }
    } catch {
      setShippingQuotes([])
      setEstimatedShipDate('')
      setTotalWeight(0)
      setShippingMethodCodeState('')
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

  const addItem = useCallback((newItem: CartAddInput) => {
    const summary = summarizeCartAddition(itemsRef.current, [newItem])
    if (!summary) return

    itemsRef.current = summary.nextItems
    setItems(summary.nextItems)
    setSelectedItems(prev => {
      const next = new Set(prev)
      next.add(newItem.productId)
      selectedItemsRef.current = next
      return next
    })
    setCartNotice(buildCartNotice(summary, 1))
  }, [])

  const addItems = useCallback((newItems: CartAddInput[]) => {
    const summary = summarizeCartAddition(itemsRef.current, newItems)
    if (!summary) return

    itemsRef.current = summary.nextItems
    setItems(summary.nextItems)
    setSelectedItems(prev => {
      const next = new Set(prev)
      newItems.forEach((item) => next.add(item.productId))
      selectedItemsRef.current = next
      return next
    })
    setCartNotice(buildCartNotice(summary, newItems.length))
  }, [])

  const removeItem = useCallback((productId: string) => {
    const nextItems = itemsRef.current.filter(i => i.productId !== productId)
    itemsRef.current = nextItems
    setItems(nextItems)
    setSelectedItems(prev => {
      const next = new Set(prev)
      next.delete(productId)
      selectedItemsRef.current = next
      return next
    })
  }, [])

  const updateQuantity = useCallback((productId: string, quantity: number) => {
    if (quantity < 1) return
    const nextItems = itemsRef.current.map(i =>
      i.productId === productId ? { ...i, quantity } : i
    )
    itemsRef.current = nextItems
    setItems(nextItems)
  }, [])

  const clearCart = useCallback(() => {
    itemsRef.current = []
    selectedItemsRef.current = new Set()
    setItems([])
    setSelectedItems(new Set())
    setShippingQuotes([])
    setCartNotice(null)
  }, [])

  const toggleItem = useCallback((productId: string) => {
    setSelectedItems(prev => {
      const next = new Set(prev)
      if (next.has(productId)) {
        next.delete(productId)
      } else {
        next.add(productId)
      }
      selectedItemsRef.current = next
      return next
    })
  }, [])

  const selectAll = useCallback(() => {
    const next = new Set(itemsRef.current.map(i => i.productId))
    selectedItemsRef.current = next
    setSelectedItems(next)
  }, [])

  const deselectAll = useCallback(() => {
    selectedItemsRef.current = new Set()
    setSelectedItems(new Set())
  }, [])

  const setShippingCountry = useCallback((country: string) => {
    setShippingCountryState(country)
  }, [])

  const setShippingMethod = useCallback((code: string) => {
    setShippingMethodCodeState(code)
  }, [])

  const dismissCartNotice = useCallback(() => {
    setCartNotice(null)
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
      addItems,
      removeItem,
      updateQuantity,
      clearCart,
      toggleItem,
      selectAll,
      deselectAll,
      setShippingCountry,
      setShippingMethod,
      hasLiveShippingQuote,
      cartNotice,
      dismissCartNotice,
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

export function useOptionalCart() {
  return useContext(CartContext)
}
