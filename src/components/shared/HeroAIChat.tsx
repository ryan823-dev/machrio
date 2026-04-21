'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useOptionalCart } from '@/contexts/CartContext'
import { useAIAssistantVisibility } from '@/contexts/AIAssistantVisibilityContext'
import { AIMessageContent } from './AIMessageContent'
import { 
  generateSessionId, 
  ConversationTracker 
} from '@/lib/conversation-tracker'
import {
  getOrderLookupPrompt,
  mergeOrderLookupDraft,
  requestDirectOrderLookup,
  type OrderLookupDraft,
} from '@/lib/order-lookup-chat'

interface Message {
  role: 'user' | 'assistant'
  content: string
  actions?: AIAction[]
  products?: ProductResult[]
}

interface AIAction {
  type: 'add_to_cart' | 'save_list' | 'create_rfq' | 'link'
  label: string
  data?: Record<string, unknown>
}

interface ProductResult {
  id: string
  name: string
  sku: string
  slug?: string
  categorySlug?: string
  imageUrl?: string
  price: string
  rawPrice?: number
  priceUnit?: string
  currency?: string
  inStock: boolean
}

interface RequirementSheet {
  category?: string
  useCase?: string
  keySpecs?: string[]
  qty?: string
  delivery?: string
  purchaseMode?: 'buy-online' | 'rfq' | 'both'
  shortlist: ProductResult[]
}

interface ConversationMessage {
  role: 'user' | 'assistant'
  content: string
}

function HeroProductCard({
  product,
  onAddToCart,
  canAddToCart,
}: {
  product: ProductResult
  onAddToCart: (p: ProductResult) => void
  canAddToCart: boolean
}) {
  const href = product.slug && product.categorySlug
    ? `/product/${product.categorySlug}/${product.slug}`
    : null

  return (
    <div className="flex gap-2 rounded-lg bg-white/10 border border-white/20 p-2">
      {/* Thumbnail */}
      <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded bg-white/10">
        {product.imageUrl ? (
          <img src={product.imageUrl} alt={product.name} className="h-10 w-10 object-contain" loading="lazy" decoding="async" />
        ) : (
          <svg className="h-5 w-5 text-primary-300" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
          </svg>
        )}
      </div>
      {/* Info */}
      <div className="flex-1 min-w-0">
        {href ? (
          <Link href={href} className="text-xs font-medium text-white hover:text-amber-300 line-clamp-1">
            {product.name}
          </Link>
        ) : (
          <p className="text-xs font-medium text-white line-clamp-1">{product.name}</p>
        )}
        <div className="mt-0.5 flex items-center justify-between gap-1">
          <span className="text-xs font-semibold text-amber-300">{product.price}</span>
          {product.rawPrice && product.rawPrice > 0 && canAddToCart ? (
            <button
              onClick={() => onAddToCart(product)}
              className="flex-shrink-0 rounded bg-emerald-500/40 px-1.5 py-0.5 text-[10px] font-medium text-emerald-100 hover:bg-emerald-500/60 transition-colors"
            >
              + Cart
            </button>
          ) : (
            <span className="text-[10px] text-amber-200/70">Quote</span>
          )}
        </div>
      </div>
    </div>
  )
}

export function HeroAIChat() {
  const [messages, setMessages] = useState<Message[]>([])
  const [conversationHistory, setConversationHistory] = useState<ConversationMessage[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [orderLookupDraft, setOrderLookupDraft] = useState<OrderLookupDraft | null>(null)
  const [reqSheet, setReqSheet] = useState<RequirementSheet>({ shortlist: [] })
  const [showReqSheet, setShowReqSheet] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const heroContainerRef = useRef<HTMLDivElement>(null)
  const conversationTrackerRef = useRef<ConversationTracker | null>(null)
  const { setShouldHideFloatingButton } = useAIAssistantVisibility()
  const cart = useOptionalCart()
  const canAddToCart = Boolean(cart)

  // Initialize conversation tracker
  useEffect(() => {
    const sessionId = generateSessionId()
    conversationTrackerRef.current = new ConversationTracker(sessionId)
    
    // Enable auto-save with 10 second debounce
    conversationTrackerRef.current.enableAutoSave(10000)
    
    return () => {
      // Save any remaining messages on unmount
      if (conversationTrackerRef.current) {
        conversationTrackerRef.current.save()
      }
    }
  }, [])

  // Track hero visibility to control floating AI button
  useEffect(() => {
    const el = heroContainerRef.current
    if (!el) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        setShouldHideFloatingButton(entry.isIntersecting)
      },
      { threshold: 0.3 }
    )
    observer.observe(el)

    return () => {
      observer.disconnect()
      setShouldHideFloatingButton(false)
    }
  }, [setShouldHideFloatingButton])
  
  const scrollToBottom = () => {
    // Only scroll within the messages container, not the whole page
    const container = messagesEndRef.current?.parentElement
    if (container) {
      container.scrollTop = container.scrollHeight
    }
  }
  
  useEffect(() => {
    // Only scroll if there are messages (avoid page scroll on initial load)
    if (messages.length > 0) {
      scrollToBottom()
    }
  }, [messages])

  function handleAddToCart(product: ProductResult) {
    if (!cart) return

    cart.addItem({
      productId: product.id,
      sku: product.sku,
      name: product.name,
      slug: product.slug || product.sku,
      categorySlug: product.categorySlug || 'products',
      image: product.imageUrl,
      price: product.rawPrice || 0,
      priceUnit: product.priceUnit,
    })
  }

  const appendAssistantMessage = useCallback((content: string) => {
    setMessages(prev => [...prev, { role: 'assistant', content }])

    if (conversationTrackerRef.current) {
      conversationTrackerRef.current.addMessage({
        role: 'assistant',
        content,
      })
    }
  }, [])

  const startOrderLookup = useCallback(() => {
    setOrderLookupDraft({})
    appendAssistantMessage(getOrderLookupPrompt())
  }, [appendAssistantMessage])

  const handleOrderLookupFlow = useCallback(async (userMessage: string) => {
    const nextDraft = mergeOrderLookupDraft(orderLookupDraft, userMessage)

    if (!nextDraft.orderNumber || !nextDraft.email) {
      setOrderLookupDraft(nextDraft)
      appendAssistantMessage(getOrderLookupPrompt(nextDraft))
      return
    }

    setOrderLookupDraft(null)
    setIsLoading(true)

    try {
      const result = await requestDirectOrderLookup({
        orderNumber: nextDraft.orderNumber,
        email: nextDraft.email,
      })

      if (!result.success) {
        appendAssistantMessage(
          `${result.error} Please double-check the order number and purchasing email, or try the secure email link flow on [Find Order](/find-order).`,
        )
        return
      }

      appendAssistantMessage(
        `I found your order. [Open Order Details](${result.orderPath})`,
      )
    } catch {
      appendAssistantMessage(
        'I could not check that order right now. Please try again in a moment, or use [Find Order](/find-order) to request a secure link by email.',
      )
    } finally {
      setIsLoading(false)
    }
  }, [appendAssistantMessage, orderLookupDraft])
  
  // Extract products from tool results
  const extractProducts = (toolResults: Record<string, unknown>[] | undefined): ProductResult[] => {
    if (!toolResults) return []
    const products: ProductResult[] = []
    for (const result of toolResults) {
      if (result.tool === 'search_products') {
        const inner = result.result as Record<string, unknown>
        const prods = (inner?.products || []) as ProductResult[]
        products.push(...prods)
      }
    }
    return products
  }
  
  // Build action buttons from tool results
  const buildActions = (toolResults: Record<string, unknown>[] | undefined, products: ProductResult[]): AIAction[] => {
    if (products.length === 0) return []
    const actions: AIAction[] = []
    if (canAddToCart) {
      actions.push({ type: 'add_to_cart', label: 'Add All to Cart', data: { products } })
    }
    actions.push({ type: 'create_rfq', label: 'Create RFQ Draft', data: { products } })
    return actions
  }
  
  // Update requirement sheet from tool results
  const updateReqSheet = useCallback((toolResults: Record<string, unknown>[] | undefined, userMsg: string) => {
    if (!toolResults) return
    for (const result of toolResults) {
      if (result.tool === 'search_products') {
        const args = result.args as Record<string, unknown>
        const inner = result.result as Record<string, unknown>
        const prods = (inner?.products || []) as ProductResult[]
        setReqSheet(prev => {
          const existingSkus = new Set(prev.shortlist.map(p => p.sku))
          const newProducts = prods.filter(p => !existingSkus.has(p.sku))
          return {
            ...prev,
            category: (args?.category as string) || prev.category,
            useCase: prev.useCase || userMsg.slice(0, 120),
            shortlist: [...prev.shortlist, ...newProducts],
          }
        })
      }
    }
  }, [])
  
  const sendMessage = async (userMessage: string) => {
    if (!userMessage.trim() || isLoading) return
    
    setMessages(prev => [...prev, { role: 'user', content: userMessage }])
    setIsLoading(true)
    
    // Track user message
    if (conversationTrackerRef.current) {
      conversationTrackerRef.current.addMessage({
        role: 'user',
        content: userMessage,
      })
    }
    
    // Build conversation history for multi-turn context
    const historyForApi: ConversationMessage[] = [
      ...conversationHistory,
      { role: 'user' as const, content: userMessage },
    ]
    
    try {
      const response = await fetch('/api/ai-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          messages: historyForApi,
        }),
      })
      
      const data = await response.json()
      const reply = data.reply || 'Sorry, I encountered an issue. Please try again.'
      
      // Extract products & build action buttons
      const products = extractProducts(data.toolResults)
      const actions = buildActions(data.toolResults, products)
      
      // Update requirement sheet
      updateReqSheet(data.toolResults, userMessage)
      
      // Update conversation history
      setConversationHistory([
        ...historyForApi,
        { role: 'assistant' as const, content: reply },
      ])
      
      const assistantMsg: Message = { 
        role: 'assistant', 
        content: reply,
        actions: actions.length > 0 ? actions : undefined,
        products: products.length > 0 ? products : undefined,
      }
      
      setMessages(prev => [...prev, assistantMsg])

      // Track assistant message
      if (conversationTrackerRef.current) {
        conversationTrackerRef.current.addMessage({
          role: 'assistant',
          content: reply,
          products: products.length > 0 ? products.map(p => ({
            id: p.id,
            name: p.name,
            sku: p.sku,
            price: p.price,
          })) : undefined,
        })
      }
    } catch (error) {
      console.error('AI chat error:', error)
      const errorMsg: Message = { 
        role: 'assistant', 
        content: "I'm having trouble connecting. Please try again or email us at sales@machrio.com."
      }
      setMessages(prev => [...prev, errorMsg])

      // Track error message
      if (conversationTrackerRef.current) {
        conversationTrackerRef.current.addMessage({
          role: 'assistant',
          content: "I'm having trouble connecting. Please try again or email us at sales@machrio.com.",
        })
      }
    } finally {
      setIsLoading(false)
    }
  }
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return
    const userMessage = input.trim()
    setInput('')

    if (orderLookupDraft) {
      setMessages(prev => [...prev, { role: 'user', content: userMessage }])

      if (conversationTrackerRef.current) {
        conversationTrackerRef.current.addMessage({
          role: 'user',
          content: userMessage,
        })
      }

      await handleOrderLookupFlow(userMessage)
      return
    }

    await sendMessage(userMessage)
  }
  
  const handleQuickAction = async (action: string) => {
    await sendMessage(action)
  }
  
  const handleActionClick = (action: AIAction) => {
    if (action.type === 'link') {
      const url = (action.data as Record<string, unknown>)?.url as string
      if (url) window.location.href = url
    } else if (action.type === 'create_rfq') {
      const products = (action.data as Record<string, unknown>)?.products as ProductResult[] | undefined
      if (products && products.length > 0) {
        setReqSheet(prev => ({ ...prev, purchaseMode: 'rfq' }))
        setMessages(prev => [...prev, { 
          role: 'assistant', 
          content: `RFQ draft created with ${products.length} item(s):\n${products.map(p => `  - ${p.name} (${p.sku})`).join('\n')}\n\nView your draft at /rfq or tell me more specs to refine it.`
        }])
      }
    } else if (action.type === 'add_to_cart') {
      const products = (action.data as Record<string, unknown>)?.products as ProductResult[] | undefined
      if (products && products.length > 0) {
        const cartProducts = products
          .filter((product) => product.rawPrice && product.rawPrice > 0)
          .map((product) => ({
            productId: product.id,
            sku: product.sku,
            name: product.name,
            slug: product.slug || product.sku,
            categorySlug: product.categorySlug || 'products',
            image: product.imageUrl,
            price: product.rawPrice || 0,
            priceUnit: product.priceUnit,
          }))

        if (cart && cartProducts.length > 0) {
          cart.addItems(cartProducts)
        }

        const addedCount = cartProducts.length
        setReqSheet(prev => ({ ...prev, purchaseMode: 'buy-online' }))
        const skippedCount = products.length - addedCount
        let msg = `Added ${addedCount} item(s) to your cart:\n${products.filter(p => p.rawPrice && p.rawPrice > 0).map(p => `  - ${p.name} (${p.sku}) - ${p.price}`).join('\n')}`
        if (skippedCount > 0) {
          msg += `\n\n${skippedCount} item(s) require a quote and were not added.`
        }
        msg += '\n\n[View Cart](/cart) or continue shopping.'
        setMessages(prev => [...prev, { role: 'assistant', content: msg }])
      }
    } else if (action.type === 'save_list') {
      const products = (action.data as Record<string, unknown>)?.products as ProductResult[] | undefined
      if (products && products.length > 0) {
        setMessages(prev => [...prev, { 
          role: 'assistant', 
          content: `Saved ${products.length} item(s) to your shopping list:\n${products.map(p => `  - ${p.name} (${p.sku})`).join('\n')}\n\nYou can review your list anytime at /account/lists.`
        }])
      }
    }
  }
  
  // Format category slug for display
  const formatCategory = (slug: string) => {
    return slug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
  }
  
  return (
    <div ref={heroContainerRef} className="flex h-full flex-col rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/10 bg-white/5 px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-400 text-primary-900">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
          </div>
          <div>
            <h3 className="font-semibold text-white">AI Sourcing Assistant</h3>
            <p className="text-xs text-primary-200">Find products · Add to cart · Get quotes</p>
          </div>
        </div>
        {/* Requirement Sheet toggle */}
        {reqSheet.shortlist.length > 0 && (
          <button
            onClick={() => setShowReqSheet(prev => !prev)}
            className="flex items-center gap-1 rounded-full bg-amber-400/20 px-2.5 py-1 text-xs text-amber-300 hover:bg-amber-400/30 transition-colors"
            title="View Requirement Sheet"
          >
            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            {reqSheet.shortlist.length}
          </button>
        )}
      </div>
      
      {/* Requirement Sheet Panel (collapsible) */}
      {showReqSheet && reqSheet.shortlist.length > 0 && (
        <div className="border-b border-white/10 bg-white/5 px-4 py-3 text-xs text-primary-200 space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-amber-300">Requirement Sheet</span>
            <button
              onClick={() => setShowReqSheet(false)}
              className="text-primary-400 hover:text-white"
            >
              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          {reqSheet.category && (
            <div><span className="text-primary-400">Category:</span> {formatCategory(reqSheet.category)}</div>
          )}
          {reqSheet.useCase && (
            <div><span className="text-primary-400">Use case:</span> {reqSheet.useCase}</div>
          )}
          {reqSheet.qty && (
            <div><span className="text-primary-400">Qty:</span> {reqSheet.qty}</div>
          )}
          {reqSheet.delivery && (
            <div><span className="text-primary-400">Delivery:</span> {reqSheet.delivery}</div>
          )}
          {reqSheet.purchaseMode && (
            <div><span className="text-primary-400">Mode:</span> {reqSheet.purchaseMode === 'buy-online' ? 'Buy Online' : reqSheet.purchaseMode === 'rfq' ? 'RFQ' : 'Both'}</div>
          )}
          <div>
            <span className="text-primary-400">Shortlist ({reqSheet.shortlist.length}):</span>
            <ul className="mt-1 space-y-0.5 pl-2">
              {reqSheet.shortlist.map((p, i) => (
                <li key={i} className="truncate">- {p.name} ({p.sku}) {p.price}</li>
              ))}
            </ul>
          </div>
        </div>
      )}
      
      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[200px] max-h-[280px]">
        {messages.length === 0 ? (
          <div className="text-center py-4">
            <p className="text-primary-200 text-sm mb-4">Tell me what you need, I&apos;ll help you find it!</p>
            <div className="flex flex-wrap justify-center gap-2">
              <button 
                onClick={() => handleQuickAction('I want to find products')}
                className="rounded-full bg-white/10 px-3 py-1.5 text-xs text-white hover:bg-white/20 transition-colors"
              >
                Find Products
              </button>
              <button 
                onClick={() => handleQuickAction('I need a bulk quote')}
                className="rounded-full bg-white/10 px-3 py-1.5 text-xs text-white hover:bg-white/20 transition-colors"
              >
                Request a Quote
              </button>
              <button 
                onClick={() => handleQuickAction('I need help with my order')}
                className="rounded-full bg-white/10 px-3 py-1.5 text-xs text-white hover:bg-white/20 transition-colors"
              >
                Order Help
              </button>
              <button
                onClick={startOrderLookup}
                className="rounded-full bg-amber-400/20 px-3 py-1.5 text-xs text-amber-200 hover:bg-amber-400/30 transition-colors"
              >
                Find Order
              </button>
            </div>
          </div>
        ) : (
          messages.map((msg, idx) => (
            <div key={idx}>
              <div className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
                  msg.role === 'user' 
                    ? 'bg-amber-400 text-primary-900' 
                    : 'bg-white/10 text-white'
                }`}>
                  {msg.role === 'assistant' ? (
                    <AIMessageContent content={msg.content} />
                  ) : (
                    <div className="whitespace-pre-wrap">{msg.content}</div>
                  )}
                  {/* Batch action buttons */}
                  {msg.actions && msg.actions.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {msg.actions.map((action, aidx) => (
                        <button
                          key={aidx}
                          onClick={() => handleActionClick(action)}
                          className={`rounded px-2 py-1 text-xs font-medium transition-colors ${
                            action.type === 'add_to_cart'
                              ? 'bg-emerald-500/30 text-emerald-200 hover:bg-emerald-500/50'
                              : action.type === 'create_rfq'
                              ? 'bg-amber-500/30 text-amber-200 hover:bg-amber-500/50'
                              : 'bg-white/20 text-white/90 hover:bg-white/30'
                          }`}
                        >
                          {action.type === 'add_to_cart' && (
                            <span className="mr-1">+</span>
                          )}
                          {action.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              {/* Product cards with individual Add to Cart */}
              {msg.products && msg.products.length > 0 && (
                <div className="mt-2 space-y-1.5 ml-1 max-w-[85%]">
                  {msg.products.slice(0, 5).map((product) => (
                    <HeroProductCard
                      key={product.sku}
                      product={product}
                      onAddToCart={handleAddToCart}
                      canAddToCart={canAddToCart}
                    />
                  ))}
                </div>
              )}
            </div>
          ))
        )}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white/10 text-white rounded-lg px-3 py-2 text-sm">
              <span className="inline-flex gap-1">
                <span className="animate-bounce">.</span>
                <span className="animate-bounce" style={{ animationDelay: '0.1s' }}>.</span>
                <span className="animate-bounce" style={{ animationDelay: '0.2s' }}>.</span>
              </span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      
      {/* Input area */}
      <form onSubmit={handleSubmit} className="border-t border-white/10 bg-white/5 p-3">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="What are you looking for? e.g., safety gloves..."
            className="min-w-0 flex-1 rounded-lg border border-white/20 bg-white/10 px-4 py-2.5 text-sm text-white placeholder-primary-300 focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-400"
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="rounded-lg bg-amber-400 px-4 py-2.5 text-sm font-medium text-primary-900 hover:bg-amber-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </div>
      </form>
    </div>
  )
}
