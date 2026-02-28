'use client'

import { useState } from 'react'

interface AddToQuoteButtonProps {
  sku: string
  productName: string
  quantity: number
  className?: string
}

export function AddToQuoteButton({ sku, productName, quantity, className = '' }: AddToQuoteButtonProps) {
  const [added, setAdded] = useState(false)

  function handleAddToQuote() {
    // Store in localStorage for the quote request page
    const existingQuote = localStorage.getItem('machrio_quote_items')
    const quoteItems = existingQuote ? JSON.parse(existingQuote) : []
    
    // Check if already exists
    const existingIndex = quoteItems.findIndex((item: { sku: string }) => item.sku === sku)
    if (existingIndex >= 0) {
      quoteItems[existingIndex].quantity = quantity
    } else {
      quoteItems.push({ sku, productName, quantity })
    }
    
    localStorage.setItem('machrio_quote_items', JSON.stringify(quoteItems))
    
    setAdded(true)
    setTimeout(() => setAdded(false), 1500)
  }

  return (
    <button
      onClick={handleAddToQuote}
      className={`flex items-center justify-center gap-2 rounded-lg border-2 border-amber-500 bg-amber-50 px-4 py-2.5 text-sm font-semibold text-amber-700 transition-colors hover:bg-amber-100 ${
        added ? 'border-green-500 bg-green-50 text-green-700' : ''
      } ${className}`}
    >
      {added ? (
        <>
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          Added to Quote
        </>
      ) : (
        <>
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Add to Quote
        </>
      )}
    </button>
  )
}
