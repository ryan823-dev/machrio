'use client'

import { useEffect, useRef } from 'react'
import { useSearchParams } from 'next/navigation'

interface OrderPaymentFailureReporterProps {
  orderNumber: string
  accessToken?: string
}

export function OrderPaymentFailureReporter({
  orderNumber,
  accessToken,
}: OrderPaymentFailureReporterProps) {
  const searchParams = useSearchParams()
  const reportedKeyRef = useRef<string | null>(null)

  useEffect(() => {
    const payment = searchParams.get('payment')
    const provider = searchParams.get('provider')

    if (payment !== 'cancelled' || (provider !== 'stripe' && provider !== 'paypal')) {
      return
    }

    const reportKey = `${payment}:${provider}:${orderNumber}`
    if (reportedKeyRef.current === reportKey) {
      return
    }

    reportedKeyRef.current = reportKey

    void fetch(`/api/orders/${encodeURIComponent(orderNumber)}/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'payment.failed',
        accessToken,
        data: {
          paymentMethod: provider,
          message: `${provider === 'stripe' ? 'Stripe' : 'PayPal'} payment was not completed.`,
          reason: 'cancelled',
        },
      }),
    }).catch((error) => {
      console.error('Failed to report cancelled payment event:', error)
    })
  }, [accessToken, orderNumber, searchParams])

  return null
}
