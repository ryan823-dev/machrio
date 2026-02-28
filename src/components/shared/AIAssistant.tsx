'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { useCart } from '@/contexts/CartContext'
import { useAIAssistantVisibility } from '@/contexts/AIAssistantVisibilityContext'

interface ProductCard {
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
}

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  products?: ProductCard[]
}

const INITIAL_MESSAGE: Message = {
  id: 'welcome',
  role: 'assistant',
  content:
    "Hi! I'm your Machrio sourcing assistant. Tell me what you're working on and I'll help you find the right products. What do you need today?",
}

// Extract product cards from toolResults
function extractProducts(toolResults?: Record<string, unknown>[]): ProductCard[] {
  if (!toolResults) return []
  for (const tr of toolResults) {
    if (tr.tool === 'search_products') {
      const result = tr.result as Record<string, unknown>
      const products = result.products as ProductCard[] | undefined
      if (products && products.length > 0) return products
    }
  }
  return []
}

function ProductCardItem({ product, onAddToCart }: { product: ProductCard; onAddToCart: (p: ProductCard) => void }) {
  const href = product.slug && product.categorySlug
    ? `/product/${product.categorySlug}/${product.slug}`
    : null

  return (
    <div className="flex gap-2 rounded-lg border border-secondary-200 bg-white p-2">
      {/* Thumbnail */}
      <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded bg-secondary-50">
        {product.imageUrl ? (
          <img src={product.imageUrl} alt={product.name} className="h-12 w-12 object-contain" />
        ) : (
          <svg className="h-6 w-6 text-secondary-300" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
          </svg>
        )}
      </div>
      {/* Info */}
      <div className="flex-1 min-w-0">
        {href ? (
          <Link href={href} className="text-xs font-medium text-secondary-800 hover:text-primary-700 line-clamp-2">
            {product.name}
          </Link>
        ) : (
          <p className="text-xs font-medium text-secondary-800 line-clamp-2">{product.name}</p>
        )}
        <div className="mt-0.5 flex items-center justify-between">
          <span className="text-xs font-semibold text-secondary-900">{product.price}</span>
          {product.rawPrice && product.rawPrice > 0 && (
            <button
              onClick={() => onAddToCart(product)}
              className="rounded bg-primary-700 px-2 py-0.5 text-[10px] font-medium text-white hover:bg-primary-800"
            >
              Add to Cart
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export function AIAssistant() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([INITIAL_MESSAGE])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const { addItem } = useCart()
  const { shouldHideFloatingButton } = useAIAssistantVisibility()

  // Hide both button and panel when hero chat is visible (unless panel is already open)
  const isHidden = shouldHideFloatingButton && !isOpen

  useEffect(() => {
    // Scroll within the chat container only, not the entire viewport
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight
    }
  }, [messages])

  function handleAddToCart(product: ProductCard) {
    addItem({
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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = input.trim()
    if (!trimmed || isLoading) return

    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: trimmed }
    setMessages((prev) => [...prev, userMsg])
    setInput('')
    setIsLoading(true)

    try {
      const res = await fetch('/api/ai-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMsg].map((m) => ({ role: m.role, content: m.content })),
        }),
      })
      const data = await res.json()

      const products = extractProducts(data.toolResults)

      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: data.reply || 'Sorry, something went wrong.',
          products: products.length > 0 ? products : undefined,
        },
      ])
    } catch {
      setMessages((prev) => [
        ...prev,
        { id: (Date.now() + 1).toString(), role: 'assistant', content: 'Connection error. Please try again.' },
      ])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-primary-700 text-white shadow-lg transition-all duration-300 ease-in-out hover:bg-primary-800 hover:shadow-xl ${
          isHidden ? 'pointer-events-none scale-95 opacity-0' : 'pointer-events-auto scale-100 opacity-100'
        }`}
        aria-label="AI Sourcing Assistant"
      >
        {isOpen ? (
          <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        )}
      </button>

      {/* Chat panel */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-50 flex h-[520px] w-[400px] flex-col overflow-hidden rounded-xl border border-secondary-200 bg-white shadow-2xl">
          {/* Header */}
          <div className="flex items-center gap-3 border-b bg-primary-700 px-4 py-3 text-white">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-500">
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6z" />
              </svg>
            </div>
            <div>
              <h3 className="text-sm font-semibold">AI Sourcing Assistant</h3>
              <p className="text-xs text-primary-200">Tell me what you need - I'll find it</p>
            </div>
          </div>

          {/* Messages */}
          <div ref={messagesContainerRef} className="flex-1 overflow-y-auto px-4 py-3">
            {messages.map((msg) => (
              <div key={msg.id} className="mb-3">
                <div className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-[90%] rounded-lg px-3 py-2 text-sm leading-relaxed ${
                      msg.role === 'user'
                        ? 'bg-primary-700 text-white'
                        : 'bg-secondary-100 text-secondary-800'
                    }`}
                  >
                    {msg.content}
                  </div>
                </div>
                {/* Product cards */}
                {msg.products && msg.products.length > 0 && (
                  <div className="mt-2 space-y-1.5 pl-1">
                    {msg.products.slice(0, 5).map((product) => (
                      <ProductCardItem
                        key={product.sku}
                        product={product}
                        onAddToCart={handleAddToCart}
                      />
                    ))}
                  </div>
                )}
              </div>
            ))}
            {isLoading && (
              <div className="mb-3 flex justify-start">
                <div className="flex items-center gap-1 rounded-lg bg-secondary-100 px-4 py-3">
                  <span className="h-2 w-2 animate-bounce rounded-full bg-secondary-400" style={{ animationDelay: '0ms' }} />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-secondary-400" style={{ animationDelay: '150ms' }} />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-secondary-400" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick actions */}
          {messages.length <= 1 && (
            <div className="flex flex-wrap gap-1.5 border-t border-secondary-100 px-4 py-2">
              {['I need tape for marking floors', 'Safety gloves for chemicals', 'Packaging supplies', 'Get a bulk quote'].map(
                (action) => (
                  <button
                    key={action}
                    onClick={() => setInput(action)}
                    className="rounded-full border border-primary-200 bg-primary-50 px-2.5 py-1 text-xs text-primary-700 transition-colors hover:bg-primary-100"
                  >
                    {action}
                  </button>
                ),
              )}
            </div>
          )}

          {/* Input */}
          <form onSubmit={handleSubmit} className="border-t border-secondary-200 p-3">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Describe what you're looking for..."
                className="input-field flex-1"
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={isLoading || !input.trim()}
                className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-md bg-primary-700 text-white transition-colors hover:bg-primary-800 disabled:opacity-50"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  )
}
