'use client'

import { useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useCart } from '@/contexts/CartContext'

interface StripeReturnHandlerProps {
  orderNumber: string
}

export function StripeReturnHandler({ orderNumber }: StripeReturnHandlerProps) {
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
      router.replace(`/order/${orderNumber}?payment=success&provider=stripe`)
      return
    }

    if (redirectStatus === 'processing') {
      router.replace(`/order/${orderNumber}?payment=processing&provider=stripe`)
      return
    }

    router.replace(`/order/${orderNumber}?payment=cancelled&provider=stripe`)
  }, [clearCart, orderNumber, router, searchParams])

  return null
}
