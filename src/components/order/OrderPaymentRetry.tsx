'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import StripePayment from '@/components/StripePayment'
import { appendQueryParamsToPath } from '@/lib/order-access-links'

interface OrderPaymentRetryProps {
  orderId: string
  orderNumber: string
  orderPath: string
  accessToken?: string
  currentPaymentMethod: 'stripe' | 'paypal'
  availablePaymentMethods: Array<'stripe' | 'paypal' | 'bank-transfer'>
  amount: number
  currency: string
}

interface StripeRetryPayment {
  clientSecret: string
  paymentIntentId: string
}

export function OrderPaymentRetry({
  orderId,
  orderNumber,
  orderPath,
  accessToken,
  currentPaymentMethod,
  availablePaymentMethods,
  amount,
  currency,
}: OrderPaymentRetryProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [stripeRetryPayment, setStripeRetryPayment] = useState<StripeRetryPayment | null>(null)
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'stripe' | 'paypal' | 'bank-transfer'>(currentPaymentMethod)
  const [activePaymentMethod, setActivePaymentMethod] = useState<'stripe' | 'paypal'>(currentPaymentMethod)

  async function reportPaymentFailure(message: string) {
    try {
      await fetch(`/api/orders/${encodeURIComponent(orderNumber)}/events`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'payment.failed',
          accessToken,
          data: {
            paymentMethod: selectedPaymentMethod,
            message,
            reason: 'client-error',
          },
        }),
      })
    } catch (reportError) {
      console.error('Failed to report payment retry error:', reportError)
    }
  }

  async function ensurePaymentMethod(nextPaymentMethod: 'stripe' | 'paypal' | 'bank-transfer') {
    if (nextPaymentMethod === activePaymentMethod) {
      return
    }

    const res = await fetch('/api/orders/change-payment-method', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        orderId,
        orderNumber,
        accessToken,
        paymentMethod: nextPaymentMethod,
      }),
    })

    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      throw new Error(data.error || 'Failed to change payment method')
    }

    if (nextPaymentMethod !== 'bank-transfer') {
      setActivePaymentMethod(nextPaymentMethod)
    }
  }

  async function handleRetryPayment() {
    setLoading(true)
    setError('')

    try {
      if (selectedPaymentMethod === 'bank-transfer') {
        await ensurePaymentMethod('bank-transfer')
        router.push(orderPath)
        router.refresh()
        return
      }

      await ensurePaymentMethod(selectedPaymentMethod)

      if (selectedPaymentMethod === 'stripe') {
        const res = await fetch('/api/payment/stripe/create-payment-intent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            orderId,
            orderNumber,
            accessToken,
          }),
        })

        const data = await res.json().catch(() => ({}))
        if (!res.ok) {
          throw new Error(data.error || 'Failed to restart Stripe payment')
        }

        if (!data.clientSecret || !data.paymentIntentId) {
          throw new Error('Stripe payment could not be initialized')
        }

        setStripeRetryPayment({
          clientSecret: data.clientSecret,
          paymentIntentId: data.paymentIntentId,
        })
        return
      }

      const res = await fetch('/api/paypal/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId,
          orderNumber,
          accessToken,
        }),
      })

      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error(data.error || 'Failed to restart PayPal payment')
      }

      if (!data.approvalUrl) {
        throw new Error('PayPal approval URL is missing')
      }

      window.location.href = data.approvalUrl
    } catch (retryError) {
      setError(retryError instanceof Error ? retryError.message : 'Failed to restart payment')
    } finally {
      setLoading(false)
    }
  }

  function handleStripeSuccess() {
    router.push(appendQueryParamsToPath(orderPath, {
      payment: 'success',
      provider: 'stripe',
    }))
  }

  function handleStripeError(message: string) {
    setError(message)
    void reportPaymentFailure(message)
  }

  function handleStripeCancel() {
    setStripeRetryPayment(null)
    setError('')
  }

  function getPaymentMethodLabel(value: 'stripe' | 'paypal' | 'bank-transfer') {
    if (value === 'stripe') return 'Stripe'
    if (value === 'paypal') return 'PayPal'
    return 'Bank Transfer'
  }

  const isSwitchingMethod = selectedPaymentMethod !== activePaymentMethod
  const buttonLabel = selectedPaymentMethod === 'bank-transfer'
    ? 'Switch to Bank Transfer'
    : isSwitchingMethod
      ? `Switch to ${getPaymentMethodLabel(selectedPaymentMethod)}`
      : selectedPaymentMethod === 'stripe'
        ? 'Pay Now Again'
        : 'Retry Payment'

  return (
    <div className="space-y-3">
      <p className="text-xs text-secondary-500">
        Retry payment on the same order, or switch this unpaid order to another payment method.
      </p>

      {!stripeRetryPayment && (
        <div className="space-y-2">
          {availablePaymentMethods.map((method) => (
            <label
              key={method}
              className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors ${
                selectedPaymentMethod === method
                  ? 'border-primary-500 bg-primary-50'
                  : 'border-secondary-200 hover:bg-secondary-50'
              }`}
            >
              <input
                type="radio"
                name={`order-payment-method-${orderId}`}
                checked={selectedPaymentMethod === method}
                onChange={() => {
                  setSelectedPaymentMethod(method)
                  setStripeRetryPayment(null)
                  setError('')
                }}
                className="mt-0.5"
              />
              <div>
                <p className="text-sm font-medium text-secondary-900">{getPaymentMethodLabel(method)}</p>
                <p className="text-xs text-secondary-500">
                  {method === 'stripe'
                    ? 'Pay online by card with Stripe.'
                    : method === 'paypal'
                      ? 'Complete checkout with PayPal.'
                      : 'Switch this order to bank transfer and use the invoice details.'}
                </p>
              </div>
            </label>
          ))}
        </div>
      )}

      {!stripeRetryPayment && (
        <button
          type="button"
          onClick={handleRetryPayment}
          disabled={loading}
          className="btn-primary w-full disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? 'Preparing Payment...' : buttonLabel}
        </button>
      )}

      {error && (
        <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {selectedPaymentMethod === 'stripe' && stripeRetryPayment && (
        <StripePayment
          orderPath={appendQueryParamsToPath(orderPath, {
            provider: 'stripe',
          })}
          amount={amount}
          currency={currency}
          clientSecret={stripeRetryPayment.clientSecret}
          onSuccess={handleStripeSuccess}
          onError={handleStripeError}
          onCancel={handleStripeCancel}
        />
      )}
    </div>
  )
}
