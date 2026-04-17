'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'

interface PayPalCaptureHandlerProps {
  orderNumber: string
  accessToken?: string
}

export function PayPalCaptureHandler({ orderNumber, accessToken }: PayPalCaptureHandlerProps) {
  const searchParams = useSearchParams()
  const [capturing, setCapturing] = useState(false)
  const [captured, setCaptured] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const payment = searchParams.get('payment')
    const provider = searchParams.get('provider')
    const token = searchParams.get('token') // PayPal order ID

    // Only handle PayPal success callbacks
    if (payment !== 'success' || provider !== 'paypal' || !token) {
      return
    }

    // Already captured or currently capturing
    if (captured || capturing) {
      return
    }

    async function reportPaymentFailure(message: string) {
      try {
        await fetch(`/api/orders/${encodeURIComponent(orderNumber)}/events`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'payment.failed',
            accessToken,
            data: {
              paymentMethod: 'paypal',
              message,
              reason: 'capture-failed',
            },
          }),
        })
      } catch (reportError) {
        console.error('Failed to report PayPal payment failure:', reportError)
      }
    }

    async function capturePayment() {
      setCapturing(true)
      setError('')

      try {
        const res = await fetch('/api/paypal/capture-order', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            paypalOrderId: token,
            orderNumber,
            accessToken,
          }),
        })

        const data = await res.json()

        if (!res.ok) {
          throw new Error(data.error || 'Failed to capture payment')
        }

        setCaptured(true)
      } catch (err) {
        console.error('PayPal capture error:', err)
        const message = err instanceof Error ? err.message : 'Failed to capture payment'
        setError(message)
        void reportPaymentFailure(message)
      } finally {
        setCapturing(false)
      }
    }

    capturePayment()
  }, [searchParams, orderNumber, accessToken, captured, capturing])

  // Don't render anything if not PayPal
  const payment = searchParams.get('payment')
  const provider = searchParams.get('provider')
  if (payment !== 'success' || provider !== 'paypal') {
    return null
  }

  if (capturing) {
    return (
      <div className="mb-6 rounded-lg bg-blue-50 border border-blue-200 p-4">
        <div className="flex items-center gap-2">
          <svg className="h-5 w-5 animate-spin text-blue-600" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <span className="font-semibold text-blue-800">Processing PayPal payment...</span>
        </div>
        <p className="mt-1 text-sm text-blue-700">Please wait while we confirm your payment.</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="mb-6 rounded-lg bg-red-50 border border-red-200 p-4">
        <div className="flex items-center gap-2">
          <svg className="h-5 w-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
          <span className="font-semibold text-red-800">Payment processing error</span>
        </div>
        <p className="mt-1 text-sm text-red-700">{error}</p>
        <p className="mt-1 text-sm text-red-600">Please contact support with your order number.</p>
      </div>
    )
  }

  if (captured) {
    return (
      <div className="mb-6 rounded-lg bg-green-50 border border-green-200 p-4">
        <div className="flex items-center gap-2">
          <svg className="h-5 w-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <span className="font-semibold text-green-800">PayPal payment confirmed!</span>
        </div>
        <p className="mt-1 text-sm text-green-700">Your payment has been processed. We will begin processing your order shortly.</p>
      </div>
    )
  }

  return null
}
