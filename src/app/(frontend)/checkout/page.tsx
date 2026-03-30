'use client'

import { useState } from 'react'
import Link from 'next/link'
// 完全静态生成，构建时生成 HTML
export const dynamic = 'force-static'
import { useRouter } from 'next/navigation'
import { useCart } from '@/contexts/CartContext'
import StripePayment from '@/components/StripePayment'

interface CheckoutForm {
  name: string
  email: string
  phone: string
  company: string
  address: string
  city: string
  state: string
  postalCode: string
  country: string
  paymentMethod: 'stripe' | 'paypal' | 'bank-transfer'
  preferredCurrency: string
  notes: string
}

const initialForm: CheckoutForm = {
  name: '',
  email: '',
  phone: '',
  company: '',
  address: '',
  city: '',
  state: '',
  postalCode: '',
  country: 'US',
  paymentMethod: 'stripe',
  preferredCurrency: 'USD',
  notes: '',
}

const COUNTRY_CURRENCY_MAP: { code: string; name: string; flag: string; currency: string; currencyName: string }[] = [
  { code: 'US', name: 'United States', flag: '\u{1F1FA}\u{1F1F8}', currency: 'USD', currencyName: 'US Dollar' },
  { code: 'HK', name: 'Hong Kong', flag: '\u{1F1ED}\u{1F1F0}', currency: 'HKD', currencyName: 'HK Dollar' },
  { code: 'DE', name: 'Germany', flag: '\u{1F1E9}\u{1F1EA}', currency: 'EUR', currencyName: 'Euro' },
  { code: 'GB', name: 'United Kingdom', flag: '\u{1F1EC}\u{1F1E7}', currency: 'GBP', currencyName: 'British Pound' },
  { code: 'CA', name: 'Canada', flag: '\u{1F1E8}\u{1F1E6}', currency: 'CAD', currencyName: 'Canadian Dollar' },
  { code: 'AU', name: 'Australia', flag: '\u{1F1E6}\u{1F1FA}', currency: 'AUD', currencyName: 'Australian Dollar' },
  { code: 'NZ', name: 'New Zealand', flag: '\u{1F1F3}\u{1F1FF}', currency: 'NZD', currencyName: 'NZ Dollar' },
  { code: 'SG', name: 'Singapore', flag: '\u{1F1F8}\u{1F1EC}', currency: 'SGD', currencyName: 'Singapore Dollar' },
  { code: 'AE', name: 'UAE', flag: '\u{1F1E6}\u{1F1EA}', currency: 'AED', currencyName: 'UAE Dirham' },
  { code: 'MX', name: 'Mexico', flag: '\u{1F1F2}\u{1F1FD}', currency: 'MXN', currencyName: 'Mexican Peso' },
  { code: 'PH', name: 'Philippines', flag: '\u{1F1F5}\u{1F1ED}', currency: 'PHP', currencyName: 'Philippine Peso' },
  { code: 'ID', name: 'Indonesia', flag: '\u{1F1EE}\u{1F1E9}', currency: 'IDR', currencyName: 'Indonesian Rupiah' },
  { code: 'IL', name: 'Israel', flag: '\u{1F1EE}\u{1F1F1}', currency: 'ILS', currencyName: 'Israeli Shekel' },
  { code: 'DK', name: 'Denmark', flag: '\u{1F1E9}\u{1F1F0}', currency: 'DKK', currencyName: 'Danish Krone' },
  { code: 'CN', name: 'China', flag: '\u{1F1E8}\u{1F1F3}', currency: 'CNY', currencyName: 'Chinese Yuan' },
]

// 嵌入式支付订单信息
interface PendingOrder {
  orderId: string
  orderNumber: string
  amount: number
  currency: string
  customerEmail: string
  stripeUrl?: string // 回退跳转 URL
}

export default function CheckoutPage() {
  const router = useRouter()
  const {
    items, selectedItems, itemCount, subtotal, shippingCost, total,
    shippingMethodCode, shippingQuotes, shippingLoading, estimatedShipDate,
    clearCart, setShippingCountry, setShippingMethod,
  } = useCart()
  const [form, setForm] = useState<CheckoutForm>(initialForm)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  // 嵌入式支付状态
  const [showStripePayment, setShowStripePayment] = useState(false)
  const [pendingOrder, setPendingOrder] = useState<PendingOrder | null>(null)

  // Only show selected items
  const selectedCartItems = items.filter(i => selectedItems.has(i.productId))
  const selectedQuote = shippingQuotes.find(q => q.code === shippingMethodCode)

  function updateField(field: keyof CheckoutForm, value: string) {
    setForm(prev => {
      const updated = { ...prev, [field]: value }
      // Auto-set currency when country changes (if bank transfer selected)
      if (field === 'country') {
        const match = COUNTRY_CURRENCY_MAP.find(c => c.code === value)
        if (match) updated.preferredCurrency = match.currency
        // Sync shipping country for live re-quote
        setShippingCountry(value)
      }
      return updated
    })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSubmitting(true)

    try {
      const res = await fetch('/api/orders/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer: {
            name: form.name,
            email: form.email,
            phone: form.phone,
            company: form.company,
          },
          shipping: {
            address: form.address,
            city: form.city,
            state: form.state,
            postalCode: form.postalCode,
            country: form.country,
          },
          items: selectedCartItems.map(item => ({
            product: item.productId,
            productName: item.name,
            sku: item.sku,
            quantity: item.quantity,
            unitPrice: item.price,
            lineTotal: item.price * item.quantity,
          })),
          subtotal,
          shippingCost,
          total,
          currency: form.paymentMethod === 'bank-transfer' ? form.preferredCurrency : 'USD',
          paymentMethod: form.paymentMethod,
          shippingMethodCode: shippingMethodCode || undefined,
          customerNotes: form.notes,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to create order')
      }

      // Order created successfully - clear cart
      clearCart()

      if (form.paymentMethod === 'stripe') {
        // 嵌入式支付：显示 StripePayment 组件
        setPendingOrder({
          orderId: data.orderId,
          orderNumber: data.orderNumber,
          amount: total,
          currency: 'USD',
          customerEmail: form.email,
          stripeUrl: data.stripeUrl, // 保留跳转 URL 作为回退
        })
        setShowStripePayment(true)
        setSubmitting(false)
      } else if (form.paymentMethod === 'paypal') {
        // Create PayPal order and redirect
        const paypalRes = await fetch('/api/paypal/create-order', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            orderNumber: data.orderNumber,
            orderId: data.orderId,
            items: selectedCartItems.map(item => ({
              name: item.name,
              sku: item.sku,
              quantity: item.quantity,
              unitPrice: item.price,
            })),
            subtotal,
            shippingCost,
            total,
            currency: 'USD',
            customerEmail: form.email,
          }),
        })

        const paypalData = await paypalRes.json()

        if (!paypalRes.ok) {
          throw new Error(paypalData.error || 'Failed to create PayPal order')
        }

        // Redirect to PayPal for payment
        window.location.href = paypalData.approvalUrl
      } else {
        // Bank transfer - go to order confirmation with invoice
        router.push(`/order/${data.orderNumber}`)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setSubmitting(false)
    }
  }

  // 嵌入式支付成功回调
  function handleStripeSuccess(paymentIntentId: string) {
    setShowStripePayment(false)
    router.push(`/order/${pendingOrder?.orderNumber}?payment=success`)
  }

  // 嵌入式支付失败回调
  function handleStripeError(message: string) {
    setError(`Payment failed: ${message}. You can try again or use another payment method.`)
  }

  // 取消嵌入式支付，回退到跳转式支付
  function handleStripeCancel() {
    if (pendingOrder?.stripeUrl) {
      // 回退到 Stripe Checkout 跳转方式
      window.location.href = pendingOrder.stripeUrl
    } else {
      setShowStripePayment(false)
      setError('Payment cancelled. Please try again.')
    }
  }

  if (itemCount === 0) {
    return (
      <div className="container-main py-16 text-center">
        <h1 className="text-2xl font-bold text-secondary-900">No items to checkout</h1>
        <p className="mt-2 text-secondary-500">Your cart is empty.</p>
        <Link href="/category" className="btn-primary mt-6 inline-block">
          Browse Products
        </Link>
      </div>
    )
  }

  return (
    <div className="container-main py-8">
      {/* 嵌入式支付模式：显示 StripePayment 组件 */}
      {showStripePayment && pendingOrder ? (
        <div className="max-w-2xl mx-auto">
          <h1 className="text-2xl font-bold text-secondary-900 mb-6">Complete Your Payment</h1>
          <p className="text-secondary-600 mb-4">
            Order <span className="font-semibold">{pendingOrder.orderNumber}</span> has been created.
            Please complete your payment below.
          </p>
          <StripePayment
            orderId={pendingOrder.orderId}
            orderNumber={pendingOrder.orderNumber}
            amount={pendingOrder.amount}
            currency={pendingOrder.currency}
            customerEmail={pendingOrder.customerEmail}
            onSuccess={handleStripeSuccess}
            onError={handleStripeError}
            onCancel={handleStripeCancel}
          />
          {error && (
            <div className="mt-4 rounded-md bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
          )}
        </div>
      ) : (
        <>
          <h1 className="text-2xl font-bold text-secondary-900">Checkout</h1>

          <form onSubmit={handleSubmit} className="mt-6 grid gap-8 lg:grid-cols-3">
        {/* Left: Form fields */}
        <div className="lg:col-span-2 space-y-6">
          {/* Customer Information */}
          <section className="rounded-lg border border-secondary-200 bg-white p-6">
            <h2 className="text-lg font-bold text-secondary-900">Customer Information</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-secondary-700">Full Name *</label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={e => updateField('name', e.target.value)}
                  className="input-field mt-1 w-full"
                  placeholder="John Smith"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-secondary-700">Company *</label>
                <input
                  type="text"
                  required
                  value={form.company}
                  onChange={e => updateField('company', e.target.value)}
                  className="input-field mt-1 w-full"
                  placeholder="Acme Corp"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-secondary-700">Email *</label>
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={e => updateField('email', e.target.value)}
                  className="input-field mt-1 w-full"
                  placeholder="john@acme.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-secondary-700">Phone</label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={e => updateField('phone', e.target.value)}
                  className="input-field mt-1 w-full"
                  placeholder="+1 (555) 000-0000"
                />
              </div>
            </div>
          </section>

          {/* Shipping Address */}
          <section className="rounded-lg border border-secondary-200 bg-white p-6">
            <h2 className="text-lg font-bold text-secondary-900">Shipping Address</h2>
            <div className="mt-4 grid gap-4">
              <div>
                <label className="block text-sm font-medium text-secondary-700">Street Address *</label>
                <textarea
                  required
                  rows={2}
                  value={form.address}
                  onChange={e => updateField('address', e.target.value)}
                  className="input-field mt-1 w-full"
                  placeholder="123 Industrial Blvd, Suite 100"
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-secondary-700">City *</label>
                  <input
                    type="text"
                    required
                    value={form.city}
                    onChange={e => updateField('city', e.target.value)}
                    className="input-field mt-1 w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary-700">State / Province *</label>
                  <input
                    type="text"
                    required
                    value={form.state}
                    onChange={e => updateField('state', e.target.value)}
                    className="input-field mt-1 w-full"
                  />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-secondary-700">Postal Code *</label>
                  <input
                    type="text"
                    required
                    value={form.postalCode}
                    onChange={e => updateField('postalCode', e.target.value)}
                    className="input-field mt-1 w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary-700">Country *</label>
                  <select
                    required
                    value={form.country}
                    onChange={e => updateField('country', e.target.value)}
                    className="input-field mt-1 w-full"
                  >
                    {COUNTRY_CURRENCY_MAP.map(c => (
                      <option key={c.code} value={c.code}>{c.flag} {c.name}</option>
                    ))}
                    <option value="OTHER">Other</option>
                  </select>
                </div>
              </div>
            </div>
          </section>

          {/* Payment Method */}
          <section className="rounded-lg border border-secondary-200 bg-white p-6">
            <h2 className="text-lg font-bold text-secondary-900">Payment Method</h2>
            <div className="mt-4 space-y-3">
              <label className={`flex cursor-pointer items-start gap-3 rounded-lg border p-4 transition-colors ${form.paymentMethod === 'stripe' ? 'border-primary-500 bg-primary-50' : 'border-secondary-200 hover:bg-secondary-50'}`}>
                <input
                  type="radio"
                  name="paymentMethod"
                  value="stripe"
                  checked={form.paymentMethod === 'stripe'}
                  onChange={() => updateField('paymentMethod', 'stripe')}
                  className="mt-0.5"
                />
                <div>
                  <span className="text-sm font-semibold text-secondary-900">Pay Online (Credit Card)</span>
                  <p className="mt-0.5 text-xs text-secondary-500">
                    Secure payment via Stripe. Visa, Mastercard, Amex accepted.
                  </p>
                </div>
              </label>
              <label className={`flex cursor-pointer items-start gap-3 rounded-lg border p-4 transition-colors ${form.paymentMethod === 'paypal' ? 'border-primary-500 bg-primary-50' : 'border-secondary-200 hover:bg-secondary-50'}`}>
                <input
                  type="radio"
                  name="paymentMethod"
                  value="paypal"
                  checked={form.paymentMethod === 'paypal'}
                  onChange={() => updateField('paymentMethod', 'paypal')}
                  className="mt-0.5"
                />
                <div>
                  <span className="text-sm font-semibold text-secondary-900">PayPal</span>
                  <p className="mt-0.5 text-xs text-secondary-500">
                    Pay securely with your PayPal account or debit/credit card.
                  </p>
                </div>
              </label>
              <label className={`flex cursor-pointer items-start gap-3 rounded-lg border p-4 transition-colors ${form.paymentMethod === 'bank-transfer' ? 'border-primary-500 bg-primary-50' : 'border-secondary-200 hover:bg-secondary-50'}`}>
                <input
                  type="radio"
                  name="paymentMethod"
                  value="bank-transfer"
                  checked={form.paymentMethod === 'bank-transfer'}
                  onChange={() => updateField('paymentMethod', 'bank-transfer')}
                  className="mt-0.5"
                />
                <div>
                  <span className="text-sm font-semibold text-secondary-900">Bank Transfer / Wire</span>
                  <p className="mt-0.5 text-xs text-secondary-500">
                    A Proforma Invoice with bank details will be generated after order placement.
                  </p>
                </div>
              </label>

              {/* Currency selector for bank transfer */}
              {form.paymentMethod === 'bank-transfer' && (
                <div className="ml-7 mt-1 rounded-lg border border-primary-200 bg-primary-50/50 p-4">
                  <label className="block text-sm font-medium text-secondary-700">
                    Preferred Payment Currency
                  </label>
                  <p className="text-xs text-secondary-500 mt-0.5">
                    We&apos;ll show you our local bank account for this currency on your invoice.
                  </p>
                  <select
                    value={form.preferredCurrency}
                    onChange={e => updateField('preferredCurrency', e.target.value)}
                    className="input-field mt-2 w-full"
                  >
                    {COUNTRY_CURRENCY_MAP.map(c => (
                      <option key={c.currency + c.code} value={c.currency}>
                        {c.flag} {c.currency} - {c.currencyName}
                      </option>
                    ))}
                    <option value="USD">Other (USD default)</option>
                  </select>
                  {(() => {
                    const match = COUNTRY_CURRENCY_MAP.find(c => c.currency === form.preferredCurrency)
                    return match ? (
                      <p className="mt-2 text-xs text-primary-700">
                        {match.flag} Your invoice will include our <strong>{match.name}</strong> bank account for <strong>{match.currency}</strong> payment.
                      </p>
                    ) : null
                  })()}
                </div>
              )}
            </div>
          </section>

          {/* Order Notes */}
          <section className="rounded-lg border border-secondary-200 bg-white p-6">
            <h2 className="text-lg font-bold text-secondary-900">Order Notes (Optional)</h2>
            <textarea
              rows={3}
              value={form.notes}
              onChange={e => updateField('notes', e.target.value)}
              className="input-field mt-3 w-full"
              placeholder="Special instructions, delivery requirements, etc."
            />
          </section>
        </div>

        {/* Right: Order summary */}
        <div className="lg:col-span-1">
          <div className="rounded-lg border border-secondary-200 bg-white p-6 sticky top-24">
            <h2 className="text-lg font-bold text-secondary-900">Order Summary</h2>

            {/* Items */}
            <div className="mt-4 max-h-64 space-y-3 overflow-y-auto">
              {selectedCartItems.map(item => (
                <div key={item.productId} className="flex justify-between text-sm">
                  <div className="flex-1 pr-2">
                    <p className="text-secondary-800 font-medium truncate">{item.name}</p>
                    <p className="text-xs text-secondary-500">Qty: {item.quantity}</p>
                  </div>
                  <span className="text-secondary-700 whitespace-nowrap">${(item.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
            </div>

            {/* Shipping method display */}
            {shippingLoading ? (
              <div className="mt-4 flex items-center gap-2 text-xs text-secondary-500">
                <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Updating shipping...
              </div>
            ) : shippingQuotes.length > 0 ? (
              <div className="mt-4 border-t border-secondary-200 pt-3">
                <label className="block text-xs font-medium text-secondary-600 mb-1.5">Shipping Method</label>
                <div className="space-y-1.5">
                  {shippingQuotes.map((q) => (
                    <label
                      key={q.code}
                      className={`flex items-center gap-2 rounded border p-2 cursor-pointer text-xs transition-colors ${
                        shippingMethodCode === q.code
                          ? 'border-primary-400 bg-primary-50'
                          : 'border-secondary-200 hover:bg-secondary-50'
                      }`}
                    >
                      <input
                        type="radio"
                        name="checkoutShipping"
                        checked={shippingMethodCode === q.code}
                        onChange={() => setShippingMethod(q.code)}
                      />
                      <span className="flex-1 font-medium text-secondary-800">{q.name}</span>
                      <span className={`font-semibold ${q.isFreeShipping ? 'text-green-600' : 'text-secondary-900'}`}>
                        {q.isFreeShipping ? 'FREE' : `$${q.cost.toFixed(2)}`}
                      </span>
                    </label>
                  ))}
                </div>
                {selectedQuote && (
                  <p className="mt-2 text-xs text-secondary-500">
                    Ships {estimatedShipDate} &bull; Arrives by {selectedQuote.estimatedDeliveryDate}
                  </p>
                )}
              </div>
            ) : null}

            {/* Totals */}
            <div className="mt-4 border-t border-secondary-200 pt-4 space-y-2 text-sm">
              <div className="flex justify-between text-secondary-600">
                <span>Subtotal</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-secondary-600">
                <span>Shipping</span>
                <span>{shippingCost === 0 ? 'FREE' : `$${shippingCost.toFixed(2)}`}</span>
              </div>
              <div className="border-t border-secondary-200 pt-2 flex justify-between font-bold text-secondary-900 text-base">
                <span>Total</span>
                <span>${total.toFixed(2)}</span>
              </div>
            </div>

            {error && (
              <div className="mt-4 rounded-md bg-red-50 p-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="btn-primary mt-6 w-full disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? 'Placing Order...' : 'Place Order'}
            </button>

            <Link href="/cart" className="mt-3 block text-center text-sm text-secondary-500 hover:text-primary-700">
              Back to Cart
            </Link>
          </div>
        </div>
      </form>
        </>
      )}
    </div>
  )
}
