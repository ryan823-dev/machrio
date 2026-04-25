'use client'

import { useState, useEffect } from 'react'
import type { Stripe } from '@stripe/stripe-js'
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js'
import { getStripePromise } from '@/lib/stripe-client'

interface CheckoutFormProps {
  returnPath: string
  onSuccess: (paymentIntentId: string) => void
  onError: (message: string) => void
  onCancel: () => void
}

// 支付表单组件
function CheckoutForm({ returnPath, onSuccess, onError, onCancel }: CheckoutFormProps) {
  const stripe = useStripe()
  const elements = useElements()
  const [isProcessing, setIsProcessing] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!stripe || !elements) return

    setIsProcessing(true)
    setErrorMessage(null)

    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: window.location.origin + returnPath,
      },
      redirect: 'if_required',
    })

    if (error) {
      setErrorMessage(error.message || 'Payment failed')
      onError?.(error.message || 'Payment failed')
    } else if (paymentIntent && paymentIntent.status === 'succeeded') {
      onSuccess?.(paymentIntent.id)
    }

    setIsProcessing(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement
        options={{
          layout: 'tabs',
        }}
      />

      {errorMessage && (
        <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">
          {errorMessage}
        </div>
      )}

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={!stripe || isProcessing}
          className="btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isProcessing ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Processing...
            </span>
          ) : (
            'Pay Now'
          )}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={isProcessing}
          className="btn-secondary disabled:opacity-50"
        >
          Cancel
        </button>
      </div>
    </form>
  )
}

interface StripePaymentProps {
  orderPath: string
  amount: number
  currency: string
  clientSecret: string
  onSuccess: (paymentIntentId: string) => void
  onError: (message: string) => void
  onCancel: () => void
}

// 主组件
export default function StripePayment({
  orderPath,
  amount,
  currency,
  clientSecret,
  onSuccess,
  onError,
  onCancel,
}: StripePaymentProps) {
  const [stripePromise, setStripePromise] = useState<Promise<Stripe | null> | null>(null)
  const [loading, setLoading] = useState(true)
  const [initError, setInitError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function init() {
      try {
        const nextStripePromise = getStripePromise()
        if (cancelled) return

        setStripePromise(nextStripePromise)
        setInitError(null)
      } catch (err) {
        console.error('Stripe initialization error:', err)
        if (cancelled) return

        setInitError('Failed to initialize payment. Please try again.')
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    init()

    return () => {
      cancelled = true
    }
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <svg className="h-8 w-8 animate-spin text-primary-600" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        <span className="ml-2 text-secondary-600">Loading payment form...</span>
      </div>
    )
  }

  if (initError) {
    return (
      <div className="rounded-md bg-red-50 p-4 text-sm text-red-700">
        <p className="font-medium">Payment initialization failed</p>
        <p className="mt-1">{initError}</p>
        <button
          onClick={onCancel}
          className="mt-3 text-red-600 underline hover:no-underline"
        >
          Go back and try another payment method
        </button>
      </div>
    )
  }

  if (!clientSecret || !stripePromise) {
    return (
      <div className="rounded-md bg-yellow-50 p-4 text-sm text-yellow-700">
        Payment is not available. Please try another payment method.
        <button
          onClick={onCancel}
          className="mt-3 text-yellow-600 underline hover:no-underline"
        >
          Go back
        </button>
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-secondary-200 bg-white p-6">
      <h3 className="text-lg font-bold text-secondary-900 mb-4">
        Complete Your Payment
      </h3>
      <p className="text-sm text-secondary-600 mb-4">
        Total: <span className="font-semibold">${amount.toFixed(2)} {currency.toUpperCase()}</span>
      </p>
      <Elements
        stripe={stripePromise}
        options={{
          clientSecret,
          locale: 'en',
          appearance: {
            theme: 'stripe',
            variables: {
              colorPrimary: '#1e40af',
            },
          },
        }}
      >
        <CheckoutForm
          returnPath={orderPath}
          onSuccess={onSuccess}
          onError={onError}
          onCancel={onCancel}
        />
      </Elements>
    </div>
  )
}
