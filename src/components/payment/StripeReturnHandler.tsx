'use client'

import { useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useCart } from '@/contexts/CartContext'
import { appendQueryParamsToPath } from '@/lib/order-access-links'

interface StripeReturnHandlerProps {
  orderPath: string
}

export function StripeReturnHandler({ orderPath }: StripeReturnHandlerProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { clearCart } = useCart()

  useEffect(() => {
    const provider = searchParams.get('provider')
    const payment = searchParams.get('payment')
    const redirectStatus = searchParams.get('redirect_status')

    if (provider !== 'stripe') {
      return
    }

    if (payment === 'success') {
      clearCart()
      return
    }

    if (!redirectStatus) {
      return
    }

    if (redirectStatus === 'succeeded') {
      clearCart()
      router.replace(appendQueryParamsToPath(orderPath, {
        payment: 'success',
        provider: 'stripe',
      }))
      return
    }

    if (redirectStatus === 'processing') {
      router.replace(appendQueryParamsToPath(orderPath, {
        payment: 'processing',
        provider: 'stripe',
      }))
      return
    }

    router.replace(appendQueryParamsToPath(orderPath, {
      payment: 'cancelled',
      provider: 'stripe',
    }))
  }, [clearCart, orderPath, router, searchParams])

  return null
}
