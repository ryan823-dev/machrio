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
  paymentMethod: 'stripe' | 'paypal'
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
  paymentMethod,
  amount,
  currency,
}: OrderPaymentRetryProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [stripeRetryPayment, setStripeRetryPayment] = useState<StripeRetryPayment | null>(null)

  async function reportPaymentFailure(message: string) {
    try {
      await fetch(`/api/orders/${encodeURIComponent(orderNumber)}/events`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'payment.failed',
          accessToken,
          data: {
            paymentMethod,
            message,
            reason: 'client-error',
          },
        }),
      })
    } catch (reportError) {
      console.error('Failed to report payment retry error:', reportError)
    }
  }

  async function handleRetryPayment() {
    setLoading(true)
    setError('')

    try {
      if (paymentMethod === 'stripe') {
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

  const buttonLabel = paymentMethod === 'stripe' ? 'Pay Now Again' : 'Retry Payment'

  return (
    <div className="space-y-3">
      <p className="text-xs text-secondary-500">
        Retry payment on the same order without creating a new checkout.
      </p>

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

      {paymentMethod === 'stripe' && stripeRetryPayment && (
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
