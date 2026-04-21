'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { AIMessageContent } from '@/components/shared/AIMessageContent'

interface EmptyStateAIDialogProps {
  categoryName: string
  categorySlug: string
  parentCategories: string[]
}

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

interface UploadedFile {
  name: string
  size: number
  file: File
}

export function EmptyStateAIDialog({ categoryName, parentCategories }: EmptyStateAIDialogProps) {
  const [mode, setMode] = useState<'ai' | 'rfq'>('ai')
  const [message, setMessage] = useState('')
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content: `Hi! I'm your dedicated sourcing assistant for ${categoryName}.\n\nWe work with an extensive network of verified industrial suppliers — even if a product isn't listed here yet, we can source and quote it for you.\n\nTo get started, could you tell me:\n• What specific products or specs do you need?\n• Approximate quantities?\n• Any brand preferences or certifications required?\n\nOr if you have a procurement list, feel free to upload it below.`,
    },
  ])
  const [isLoading, setIsLoading] = useState(false)
  const [rfqSubmitted, setRfqSubmitted] = useState(false)
  const [rfqError, setRfqError] = useState('')
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])
  const chatEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

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
    // First real user message (chatHistory has 1 welcome message from assistant)
    const fullMessage = chatHistory.length <= 1
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
          conversationHistory: chatHistory.filter(m => m.role !== 'assistant' || chatHistory.indexOf(m) !== 0).map(m => ({
            role: m.role,
            content: m.content,
          })),
          source: 'empty-category',
          categoryName,
          categoryPath: parentCategories.join(' > '),
        }),
      })

      if (!response.ok) throw new Error('Failed to get response')

      const data = await response.json()
      const assistantContent = data.response || data.reply || data.message || 'Sorry, I could not process your request.'
      setChatHistory(prev => [...prev, { role: 'assistant', content: assistantContent }])
    } catch {
      setChatHistory(prev => [...prev, {
        role: 'assistant',
        content: `I'm having a temporary connection issue. No worries — you can submit your requirements directly via the RFQ form, and our sourcing team will get back to you within 24 hours with a competitive quote.`,
      }])
    } finally {
      setIsLoading(false)
    }
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return

    const newFiles: UploadedFile[] = []
    for (let i = 0; i < files.length; i++) {
      newFiles.push({ name: files[i].name, size: files[i].size, file: files[i] })
    }
    setUploadedFiles(prev => [...prev, ...newFiles])

    // Auto-send message about uploaded files
    const fileNames = newFiles.map(f => f.name).join(', ')
    const uploadMsg = newFiles.length === 1
      ? `I've uploaded a file: ${fileNames}. Please review and prepare a quote.`
      : `I've uploaded ${newFiles.length} files: ${fileNames}. Please review and prepare a quote.`

    setChatHistory(prev => [...prev, { role: 'user', content: uploadMsg }])
    setChatHistory(prev => [...prev, {
      role: 'assistant',
      content: `Thanks for sharing your documents! I've noted the uploaded files. To move forward with a formal quote, I'd recommend submitting a quick RFQ — our sourcing specialists will review your files and respond with competitive pricing within 24 hours.\n\nWould you like to submit the RFQ now, or do you have additional details to share first?`,
    }])

    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleRemoveFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index))
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const files = e.dataTransfer.files
    if (!files.length) return

    const newFiles: UploadedFile[] = []
    for (let i = 0; i < files.length; i++) {
      newFiles.push({ name: files[i].name, size: files[i].size, file: files[i] })
    }
    setUploadedFiles(prev => [...prev, ...newFiles])

    const fileNames = newFiles.map(f => f.name).join(', ')
    setChatHistory(prev => [...prev, { role: 'user', content: `I've uploaded: ${fileNames}` }])
    setChatHistory(prev => [...prev, {
      role: 'assistant',
      content: `Got it! I've received your files. Ready to submit a quick RFQ so our team can review them and get you a quote?`,
    }])
  }

  // Extract user requirements from chat for RFQ pre-fill
  const getUserRequirements = () => {
    const userMsgs = chatHistory
      .filter(m => m.role === 'user')
      .map(m => m.content)
      .join('\n')
    return userMsgs || categoryName
  }

  const handleRFQSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setRfqError('')
    const form = e.target as HTMLFormElement
    const formData = new FormData(form)

    // Attach uploaded files
    for (const uf of uploadedFiles) {
      formData.append('attachments', uf.file)
    }

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
      attachmentNames: uploadedFiles.map(f => f.name),
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
      setRfqError('Failed to submit. Please try again or email us at sales@machrio.com.')
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  // Count real user messages (excluding the initial welcome)
  const userMessageCount = chatHistory.filter(m => m.role === 'user').length

  return (
    <div className="mx-auto max-w-3xl">
      {/* Hero */}
      <div className="rounded-t-lg border border-b-0 border-secondary-200 bg-gradient-to-b from-primary-50 to-white px-4 pb-4 pt-6 text-center sm:px-8 sm:pt-8">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary-100">
          <svg className="h-7 w-7 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>
        <h2 className="mt-3 text-xl font-bold text-secondary-900">
          Source {categoryName} Through Machrio
        </h2>
        <p className="mx-auto mt-2 max-w-lg text-sm text-secondary-600">
          Backed by a global industrial supply network, we fulfill virtually any procurement need. Tell us exactly what you&apos;re looking for — we&apos;ll deliver a competitive quote fast.
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
            Tell Us What You Need
          </button>
          <button
            onClick={() => setMode('rfq')}
            className={`rounded-md px-4 py-2 text-sm font-medium transition-all ${
              mode === 'rfq'
                ? 'bg-white text-primary-700 shadow-sm'
                : 'text-secondary-600 hover:text-secondary-900'
            }`}
          >
            Submit RFQ
          </button>
        </div>
      </div>

      {/* Content area */}
      <div className="rounded-b-lg border border-secondary-200 bg-white p-6">
        {/* AI Chat mode */}
        {mode === 'ai' && (
          <div>
            {/* Chat history */}
            <div className="mb-4 max-h-80 space-y-3 overflow-y-auto rounded-lg bg-secondary-50 p-4">
              {chatHistory.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-[85%] rounded-lg px-4 py-2.5 text-sm leading-relaxed ${
                      msg.role === 'user'
                        ? 'bg-primary-600 text-white'
                        : 'bg-white text-secondary-800 shadow-sm'
                    }`}
                  >
                    {msg.role === 'assistant' ? (
                      <AIMessageContent content={msg.content} />
                    ) : (
                      <div className="whitespace-pre-wrap">{msg.content}</div>
                    )}
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

            {/* Quick suggestions (show only before user sends first message) */}
            {userMessageCount === 0 && (
              <div className="mb-3 flex flex-wrap justify-center gap-2">
                {[
                  `I need specific ${categoryName.toLowerCase()} — let me describe`,
                  'I have a procurement list to share',
                  `Get me a quote for bulk ${categoryName.toLowerCase()}`,
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
            )}

            {/* Message input */}
            <form onSubmit={handleAISubmit} className="flex gap-2">
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={`Describe what ${categoryName.toLowerCase()} you need...`}
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

            {/* File upload area */}
            <div
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              className="mt-3 rounded-lg border border-dashed border-secondary-300 p-3 text-center transition-colors hover:border-primary-400 hover:bg-primary-50/30"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.xlsx,.xls,.csv,.doc,.docx,.png,.jpg,.jpeg"
                multiple
                onChange={handleFileUpload}
                className="hidden"
                id="rfq-upload"
              />
              <label htmlFor="rfq-upload" className="flex cursor-pointer items-center justify-center gap-2 text-sm text-secondary-500 hover:text-primary-600">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                Drop your spec sheet, BOM, or procurement list here
              </label>

              {uploadedFiles.length > 0 && (
                <div className="mt-2 space-y-1">
                  {uploadedFiles.map((f, i) => (
                    <div key={i} className="flex items-center justify-between rounded bg-white px-3 py-1.5 text-xs">
                      <span className="truncate text-secondary-700">{f.name} ({formatFileSize(f.size)})</span>
                      <button
                        onClick={() => handleRemoveFile(i)}
                        className="ml-2 flex-shrink-0 text-secondary-400 hover:text-red-500"
                        type="button"
                      >
                        <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Floating CTA after 2+ user messages */}
            {userMessageCount >= 2 && (
              <div className="mt-4 rounded-lg border border-accent-200 bg-accent-50 p-4 text-center">
                <p className="mb-2 text-sm font-medium text-accent-800">Ready to get your quote?</p>
                <p className="mb-3 text-xs text-accent-600">
                  Our sourcing specialists will review your requirements and respond with competitive pricing within 24 hours.
                </p>
                <button
                  onClick={() => setMode('rfq')}
                  className="rounded-lg bg-accent-600 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-accent-700"
                >
                  Submit a Quick RFQ
                </button>
              </div>
            )}

            <p className="mt-3 text-center text-xs text-secondary-400">
              Prefer a formal form?{' '}
              <Link href="/rfq" className="text-primary-600 hover:underline">
                Visit our full RFQ page
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
              <label className="mb-1 block text-sm font-medium text-secondary-700">What do you need? *</label>
              <textarea
                name="productDescription"
                required
                rows={3}
                defaultValue={getUserRequirements()}
                className="w-full rounded-lg border border-secondary-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                placeholder="Describe the products, specs, quantities..."
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
              <label className="mb-1 block text-sm font-medium text-secondary-700">Additional Specs / Notes</label>
              <textarea
                name="specs"
                rows={2}
                placeholder="Brand preferences, certifications, special requirements..."
                className="w-full rounded-lg border border-secondary-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              />
            </div>

            {/* Show uploaded files */}
            {uploadedFiles.length > 0 && (
              <div className="rounded-lg border border-secondary-200 bg-secondary-50 p-3">
                <p className="mb-2 text-xs font-medium text-secondary-600">Attached files ({uploadedFiles.length}):</p>
                <div className="space-y-1">
                  {uploadedFiles.map((f, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs text-secondary-700">
                      <svg className="h-3.5 w-3.5 flex-shrink-0 text-secondary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                      </svg>
                      <span className="truncate">{f.name}</span>
                      <span className="text-secondary-400">({formatFileSize(f.size)})</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

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
              Our sourcing specialists are on it. Expect a competitive quote in your inbox within 24 hours.
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
