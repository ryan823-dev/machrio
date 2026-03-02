'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'

interface EmptyStateAIDialogProps {
  categoryName: string
  categorySlug: string
  parentCategories: string[]
}

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

export function EmptyStateAIDialog({ categoryName, categorySlug, parentCategories }: EmptyStateAIDialogProps) {
  const [mode, setMode] = useState<'ai' | 'rfq'>('ai')
  const [message, setMessage] = useState('')
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [rfqSubmitted, setRfqSubmitted] = useState(false)
  const [rfqError, setRfqError] = useState('')
  const chatEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatHistory])

  const contextPrefix = parentCategories.length > 0
    ? `I'm looking for products in ${categoryName} (under ${parentCategories.join(' > ')}).`
    : `I'm looking for ${categoryName} products.`

  const handleAISubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const text = message.trim()
    if (!text || isLoading) return

    const userMessage = text
    const fullMessage = chatHistory.length === 0
      ? `${contextPrefix} ${text}`
      : text

    setChatHistory(prev => [...prev, { role: 'user', content: userMessage }])
    setMessage('')
    setIsLoading(true)

    try {
      const response = await fetch('/api/ai-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: fullMessage,
          conversationHistory: chatHistory.map(m => ({
            role: m.role,
            content: m.content,
          })),
        }),
      })

      if (!response.ok) throw new Error('Failed to get response')

      const data = await response.json()
      const assistantContent = data.response || data.message || 'Sorry, I could not process your request.'
      setChatHistory(prev => [...prev, { role: 'assistant', content: assistantContent }])
    } catch {
      setChatHistory(prev => [...prev, {
        role: 'assistant',
        content: 'Sorry, something went wrong. Please try again or submit a quote request instead.',
      }])
    } finally {
      setIsLoading(false)
    }
  }

  const handleRFQSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setRfqError('')
    const form = e.target as HTMLFormElement
    const formData = new FormData(form)

    const body = {
      name: formData.get('name') as string,
      email: formData.get('email') as string,
      company: formData.get('company') as string,
      phone: formData.get('phone') as string || '',
      products: `[${categoryName}] ${formData.get('productDescription') as string}`,
      quantity: formData.get('quantity') as string,
      timeline: formData.get('timeline') as string || 'flexible',
      message: formData.get('specs') as string || '',
      honeypot: '',
    }

    try {
      const response = await fetch('/api/rfq', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (!response.ok) throw new Error('Failed to submit')
      setRfqSubmitted(true)
    } catch {
      setRfqError('Failed to submit. Please try again.')
    }
  }

  return (
    <div className="mx-auto max-w-3xl">
      {/* Hero */}
      <div className="rounded-t-lg border border-b-0 border-secondary-200 bg-gradient-to-b from-primary-50 to-white px-8 pb-4 pt-8 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary-100">
          <svg className="h-7 w-7 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        </div>
        <h2 className="mt-3 text-xl font-bold text-secondary-900">
          Building Our {categoryName} Catalog
        </h2>
        <p className="mx-auto mt-2 max-w-lg text-sm text-secondary-600">
          We&apos;re expanding this category. Let our AI assistant help you find what you need, or submit a quote request for specific products.
        </p>

        {/* Mode tabs */}
        <div className="mt-5 inline-flex rounded-lg border border-secondary-200 bg-secondary-50 p-1">
          <button
            onClick={() => setMode('ai')}
            className={`rounded-md px-4 py-2 text-sm font-medium transition-all ${
              mode === 'ai'
                ? 'bg-white text-primary-700 shadow-sm'
                : 'text-secondary-600 hover:text-secondary-900'
            }`}
          >
            AI Assistant
          </button>
          <button
            onClick={() => setMode('rfq')}
            className={`rounded-md px-4 py-2 text-sm font-medium transition-all ${
              mode === 'rfq'
                ? 'bg-white text-primary-700 shadow-sm'
                : 'text-secondary-600 hover:text-secondary-900'
            }`}
          >
            Request Quote
          </button>
        </div>
      </div>

      {/* Content area */}
      <div className="rounded-b-lg border border-secondary-200 bg-white p-6">
        {/* AI Chat mode */}
        {mode === 'ai' && (
          <div>
            {chatHistory.length === 0 && (
              <div className="mb-4 text-center">
                <p className="text-sm text-secondary-500">
                  Describe what you&apos;re looking for and our AI will help you find it.
                </p>
                <div className="mt-3 flex flex-wrap justify-center gap-2">
                  {[
                    `What ${categoryName.toLowerCase()} do you recommend?`,
                    `I need bulk ${categoryName.toLowerCase()}`,
                    'What certifications are available?',
                  ].map((suggestion) => (
                    <button
                      key={suggestion}
                      onClick={() => setMessage(suggestion)}
                      className="rounded-full border border-secondary-200 px-3 py-1.5 text-xs text-secondary-600 transition-colors hover:border-primary-300 hover:bg-primary-50 hover:text-primary-700"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {chatHistory.length > 0 && (
              <div className="mb-4 max-h-72 space-y-3 overflow-y-auto rounded-lg bg-secondary-50 p-4">
                {chatHistory.map((msg, i) => (
                  <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div
                      className={`max-w-[85%] rounded-lg px-4 py-2.5 text-sm leading-relaxed ${
                        msg.role === 'user'
                          ? 'bg-primary-600 text-white'
                          : 'bg-white text-secondary-800 shadow-sm'
                      }`}
                    >
                      <div className="whitespace-pre-wrap">{msg.content}</div>
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="rounded-lg bg-white px-4 py-3 shadow-sm">
                      <div className="flex space-x-1">
                        <div className="h-2 w-2 animate-bounce rounded-full bg-secondary-400" />
                        <div className="h-2 w-2 animate-bounce rounded-full bg-secondary-400" style={{ animationDelay: '0.15s' }} />
                        <div className="h-2 w-2 animate-bounce rounded-full bg-secondary-400" style={{ animationDelay: '0.3s' }} />
                      </div>
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>
            )}

            <form onSubmit={handleAISubmit} className="flex gap-2">
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={`e.g., "I need ${categoryName.toLowerCase()} for..."`}
                className="flex-1 rounded-lg border border-secondary-300 px-4 py-2.5 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                disabled={isLoading}
              />
              <button
                type="submit"
                className="rounded-lg bg-primary-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-700 disabled:bg-secondary-300"
                disabled={isLoading || !message.trim()}
              >
                Send
              </button>
            </form>

            <p className="mt-3 text-center text-xs text-secondary-400">
              Need a formal quote?{' '}
              <button onClick={() => setMode('rfq')} className="text-primary-600 hover:underline">
                Switch to Request Quote
              </button>{' '}
              or visit our{' '}
              <Link href="/rfq" className="text-primary-600 hover:underline">
                full RFQ page
              </Link>
            </p>
          </div>
        )}

        {/* RFQ mode */}
        {mode === 'rfq' && !rfqSubmitted && (
          <form onSubmit={handleRFQSubmit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-secondary-700">Name *</label>
                <input name="name" required className="w-full rounded-lg border border-secondary-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-secondary-700">Email *</label>
                <input name="email" type="email" required className="w-full rounded-lg border border-secondary-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500" />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-secondary-700">Company *</label>
                <input name="company" required className="w-full rounded-lg border border-secondary-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-secondary-700">Phone</label>
                <input name="phone" type="tel" className="w-full rounded-lg border border-secondary-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500" />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-secondary-700">Product Description *</label>
              <input
                name="productDescription"
                required
                defaultValue={categoryName}
                className="w-full rounded-lg border border-secondary-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-secondary-700">Quantity *</label>
                <input name="quantity" required placeholder="e.g., 100 units" className="w-full rounded-lg border border-secondary-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-secondary-700">Timeline</label>
                <select name="timeline" className="w-full rounded-lg border border-secondary-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500">
                  <option value="flexible">Flexible</option>
                  <option value="1-week">Within 1 week</option>
                  <option value="2-weeks">Within 2 weeks</option>
                  <option value="1-month">Within 1 month</option>
                </select>
              </div>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-secondary-700">Specifications / Notes</label>
              <textarea
                name="specs"
                rows={3}
                placeholder="Size, material, certifications, or any special requirements..."
                className="w-full rounded-lg border border-secondary-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              />
            </div>

            {rfqError && <p className="text-sm text-red-600">{rfqError}</p>}

            <button
              type="submit"
              className="w-full rounded-lg bg-accent-600 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-accent-700"
            >
              Submit Quote Request
            </button>
          </form>
        )}

        {mode === 'rfq' && rfqSubmitted && (
          <div className="py-8 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-green-100">
              <svg className="h-7 w-7 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="mt-3 text-lg font-semibold text-secondary-900">Quote Request Submitted!</h3>
            <p className="mt-2 text-sm text-secondary-600">
              Our sourcing team will review your request and get back to you within 24 hours.
            </p>
            <Link href="/category" className="mt-4 inline-block text-sm text-primary-600 hover:underline">
              Continue browsing categories
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
