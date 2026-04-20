'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useCart } from '@/contexts/CartContext'
// 完全静态生成，构建时生成 HTML
export const dynamic = 'force-static'

const COUNTRIES = [
  { code: 'US', name: 'United States', flag: '\u{1F1FA}\u{1F1F8}' },
  { code: 'CA', name: 'Canada', flag: '\u{1F1E8}\u{1F1E6}' },
  { code: 'GB', name: 'United Kingdom', flag: '\u{1F1EC}\u{1F1E7}' },
  { code: 'DE', name: 'Germany', flag: '\u{1F1E9}\u{1F1EA}' },
  { code: 'AU', name: 'Australia', flag: '\u{1F1E6}\u{1F1FA}' },
  { code: 'NZ', name: 'New Zealand', flag: '\u{1F1F3}\u{1F1FF}' },
  { code: 'SG', name: 'Singapore', flag: '\u{1F1F8}\u{1F1EC}' },
  { code: 'HK', name: 'Hong Kong', flag: '\u{1F1ED}\u{1F1F0}' },
  { code: 'AE', name: 'UAE', flag: '\u{1F1E6}\u{1F1EA}' },
  { code: 'MX', name: 'Mexico', flag: '\u{1F1F2}\u{1F1FD}' },
  { code: 'PH', name: 'Philippines', flag: '\u{1F1F5}\u{1F1ED}' },
  { code: 'ID', name: 'Indonesia', flag: '\u{1F1EE}\u{1F1E9}' },
  { code: 'IL', name: 'Israel', flag: '\u{1F1EE}\u{1F1F1}' },
  { code: 'DK', name: 'Denmark', flag: '\u{1F1E9}\u{1F1F0}' },
]

export default function CartPage() {
  const [cancelledOrderNumber, setCancelledOrderNumber] = useState<string | null>(null)
  const [showCancelledBanner, setShowCancelledBanner] = useState(false)
  const {
    items, selectedItems, itemCount, subtotal, total,
    shippingCountry, shippingMethodCode, shippingQuotes, shippingLoading, estimatedShipDate,
    removeItem, updateQuantity, clearCart,
    toggleItem, selectAll, deselectAll,
    setShippingCountry, setShippingMethod, hasLiveShippingQuote,
  } = useCart()

  const allSelected = items.length > 0 && items.every(i => selectedItems.has(i.productId))
  const noneSelected = selectedItems.size === 0
  const selectedQuote = shippingQuotes.find(q => q.code === shippingMethodCode)
  const canProceedToCheckout = !noneSelected && hasLiveShippingQuote
  const shippingDisplay = noneSelected
    ? '—'
    : selectedQuote
      ? (selectedQuote.isFreeShipping ? 'FREE' : `$${selectedQuote.cost.toFixed(2)}`)
      : shippingLoading
        ? 'Updating...'
        : 'Quote required'
  const totalDisplay = noneSelected
    ? '$0.00'
    : hasLiveShippingQuote
      ? `$${total.toFixed(2)}`
      : shippingLoading
        ? 'Updating...'
        : 'Awaiting quote'

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const isStripeCancelled =
      params.get('provider') === 'stripe' && params.get('payment') === 'cancelled'

    setShowCancelledBanner(isStripeCancelled)
    setCancelledOrderNumber(isStripeCancelled ? params.get('order') : null)
  }, [])

  if (items.length === 0) {
    return (
      <div className="container-main py-16 text-center">
        <svg className="mx-auto h-16 w-16 text-secondary-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" />
        </svg>
        <h1 className="mt-4 text-2xl font-bold text-secondary-900">Your cart is empty</h1>
        <p className="mt-2 text-secondary-500">Browse our products and add items to your cart.</p>
        <Link href="/category" className="btn-primary mt-6 inline-block">
          Continue Shopping
        </Link>
      </div>
    )
  }

  return (
    <div className="container-main py-8">
      {showCancelledBanner && (
        <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 p-4">
          <div className="flex items-center gap-2">
            <svg className="h-5 w-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <span className="font-semibold text-amber-800">Payment was cancelled</span>
          </div>
          <p className="mt-1 text-sm text-amber-700">
            {cancelledOrderNumber
              ? `Order ${cancelledOrderNumber} was left unpaid. Your items are still in the cart, so you can adjust products or quantities before checking out again.`
              : 'Your items are still in the cart, so you can adjust products or quantities before checking out again.'}
          </p>
        </div>
      )}

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-secondary-900">Shopping Cart ({items.length} items)</h1>
        <button onClick={clearCart} className="text-sm text-secondary-500 hover:text-red-600 transition-colors">
          Clear Cart
        </button>
      </div>

      <div className="mt-6 grid gap-8 lg:grid-cols-3">
        {/* Cart items */}
        <div className="lg:col-span-2 space-y-4">
          {/* Select all toggle */}
          <div className="flex items-center gap-3 text-sm text-secondary-600">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={allSelected}
                onChange={() => allSelected ? deselectAll() : selectAll()}
                className="h-4 w-4 rounded border-secondary-300 text-primary-600"
              />
              Select All
            </label>
            <span className="text-secondary-300">|</span>
            <span>{selectedItems.size} of {items.length} selected</span>
          </div>

          {items.map((item) => {
            const isSelected = selectedItems.has(item.productId)
            return (
              <div
                key={item.productId}
                className={`flex gap-4 rounded-lg border p-4 transition-colors ${
                  isSelected
                    ? 'border-primary-200 bg-white'
                    : 'border-secondary-200 bg-secondary-50 opacity-60'
                }`}
              >
                {/* Checkbox */}
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleItem(item.productId)}
                    className="h-4 w-4 rounded border-secondary-300 text-primary-600"
                  />
                </div>

                {/* Image */}
                <Link
                  href={`/product/${item.categorySlug}/${item.slug}`}
                  className="flex-shrink-0"
                >
                  {item.image ? (
                    <img
                      src={item.image}
                      alt={item.name}
                      className="h-28 w-28 rounded object-contain border border-secondary-100" loading="lazy" decoding="async"
                    />
                  ) : (
                    <div className="flex h-28 w-28 items-center justify-center rounded border border-secondary-100 bg-secondary-50 text-secondary-300">
                      <svg className="h-10 w-10" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                </Link>

                {/* Details */}
                <div className="flex flex-1 flex-col">
                  <div className="flex justify-between">
                    <div>
                      <Link
                        href={`/product/${item.categorySlug}/${item.slug}`}
                        className="text-sm font-semibold text-secondary-900 hover:text-primary-700"
                      >
                        {item.name}
                      </Link>
                      <p className="mt-0.5 text-xs text-secondary-500">SKU: {item.sku}</p>
                    </div>
                    <button
                      onClick={() => removeItem(item.productId)}
                      className="text-secondary-400 hover:text-red-500 transition-colors"
                      title="Remove item"
                    >
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>

                  <div className="mt-auto flex items-center justify-between pt-2">
                    {/* Quantity controls */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                        disabled={item.quantity <= 1}
                        className="flex h-7 w-7 items-center justify-center rounded border border-secondary-300 text-sm disabled:opacity-40 hover:bg-secondary-50"
                      >
                        -
                      </button>
                      <input
                        type="number"
                        value={item.quantity}
                        min={1}
                        onChange={(e) => {
                          const val = parseInt(e.target.value, 10)
                          if (!isNaN(val) && val >= 1) updateQuantity(item.productId, val)
                        }}
                        className="w-14 rounded border border-secondary-300 py-1 text-center text-sm"
                      />
                      <button
                        onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                        className="flex h-7 w-7 items-center justify-center rounded border border-secondary-300 text-sm hover:bg-secondary-50"
                      >
                        +
                      </button>
                    </div>

                    {/* Line total */}
                    <span className="text-sm font-semibold text-secondary-900">
                      ${(item.price * item.quantity).toFixed(2)}
                      {item.priceUnit && (
                        <span className="text-xs font-normal text-secondary-500"> ({item.priceUnit})</span>
                      )}
                    </span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Order summary */}
        <div className="lg:col-span-1">
          <div className="rounded-lg border border-secondary-200 bg-white p-6 sticky top-24 space-y-5">
            <h2 className="text-lg font-bold text-secondary-900">Order Summary</h2>

            {/* Shipping country selector */}
            <div>
              <label className="block text-xs font-medium text-secondary-600">Ship to</label>
              <select
                value={shippingCountry}
                onChange={(e) => setShippingCountry(e.target.value)}
                className="input-field mt-1 w-full text-sm"
              >
                {COUNTRIES.map(c => (
                  <option key={c.code} value={c.code}>{c.flag} {c.name}</option>
                ))}
                <option value="OTHER">Other</option>
              </select>
            </div>

            {/* Shipping method selector */}
            {shippingLoading ? (
              <div className="flex items-center gap-2 text-xs text-secondary-500">
                <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Calculating shipping...
              </div>
            ) : shippingQuotes.length > 0 ? (
              <div>
                <label className="block text-xs font-medium text-secondary-600">Shipping method</label>
                <div className="mt-1.5 space-y-2">
                  {shippingQuotes.map((q) => (
                    <label
                      key={q.code}
                      className={`flex items-start gap-2.5 rounded-lg border p-3 cursor-pointer text-sm transition-colors ${
                        shippingMethodCode === q.code
                          ? 'border-primary-400 bg-primary-50'
                          : 'border-secondary-200 hover:bg-secondary-50'
                      }`}
                    >
                      <input
                        type="radio"
                        name="shippingMethod"
                        checked={shippingMethodCode === q.code}
                        onChange={() => setShippingMethod(q.code)}
                        className="mt-0.5"
                      />
                      <div className="flex-1">
                        <div className="flex justify-between">
                          <span className="font-medium text-secondary-800">{q.name}</span>
                          <span className={`font-semibold ${q.isFreeShipping ? 'text-green-600' : 'text-secondary-900'}`}>
                            {q.isFreeShipping ? 'FREE' : `$${q.cost.toFixed(2)}`}
                          </span>
                        </div>
                        <p className="mt-0.5 text-xs text-secondary-500">
                          Est. delivery: {q.estimatedDeliveryDate}
                        </p>
                        {q.gapToFreeShipping && q.gapToFreeShipping > 0 && (
                          <p className="mt-1 text-xs text-amber-600">
                            Add ${q.gapToFreeShipping.toFixed(2)} more to unlock free shipping on this method
                          </p>
                        )}
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            ) : !noneSelected ? (
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-700">
                <p className="font-medium">We do not have a live shipping rate for this destination yet.</p>
                <p className="mt-1">
                  Select another shipping country, request an RFQ, or contact <a href="mailto:sales@machrio.com" className="underline">sales@machrio.com</a> for manual freight confirmation.
                </p>
              </div>
            ) : null}

            {/* Ship date */}
            {estimatedShipDate && !noneSelected && (
              <p className="text-xs text-secondary-500">
                Ships on: <span className="font-medium text-secondary-700">{estimatedShipDate}</span>
              </p>
            )}

            {/* Totals */}
            <div className="space-y-2 text-sm border-t border-secondary-200 pt-4">
              <div className="flex justify-between text-secondary-600">
                <span>Subtotal ({itemCount} items)</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-secondary-600">
                <span>Shipping</span>
                <span>{shippingDisplay}</span>
              </div>
              <div className="border-t border-secondary-200 pt-2 flex justify-between font-bold text-secondary-900">
                <span>Total</span>
                <span>{totalDisplay}</span>
              </div>
            </div>

            <Link
              href={canProceedToCheckout ? '/checkout' : '#'}
              className={`btn-primary w-full text-center block ${
                canProceedToCheckout ? '' : 'opacity-50 pointer-events-none'
              }`}
            >
              {canProceedToCheckout ? 'Proceed to Checkout' : 'Shipping Quote Required'}
            </Link>
            <Link href="/category" className="block text-center text-sm text-secondary-500 hover:text-primary-700">
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
