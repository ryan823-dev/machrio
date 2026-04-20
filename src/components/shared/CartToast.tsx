'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { useCart } from '@/contexts/CartContext'

export function CartToast() {
  const { cartNotice, dismissCartNotice } = useCart()

  useEffect(() => {
    if (!cartNotice) return

    const timeout = window.setTimeout(() => {
      dismissCartNotice()
    }, 3000)

    return () => window.clearTimeout(timeout)
  }, [cartNotice, dismissCartNotice])

  if (!cartNotice) return null

  return (
    <div className="pointer-events-none fixed inset-x-4 bottom-24 z-[70] sm:inset-x-auto sm:bottom-6 sm:left-6 sm:w-full sm:max-w-sm">
      <div
        role="status"
        aria-live="polite"
        className="pointer-events-auto rounded-2xl border border-green-200 bg-white shadow-xl ring-1 ring-black/5"
      >
        <div className="flex items-start gap-3 p-4">
          <div className="mt-0.5 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-green-100 text-green-700">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>

          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-secondary-900">{cartNotice.title}</p>
            <p className="mt-1 text-sm text-secondary-600">{cartNotice.message}</p>

            <div className="mt-3 flex items-center gap-3">
              <Link
                href="/cart"
                onClick={dismissCartNotice}
                className="text-sm font-medium text-primary-700 hover:text-primary-800"
              >
                View cart
              </Link>
              <button
                type="button"
                onClick={dismissCartNotice}
                className="text-sm text-secondary-500 hover:text-secondary-700"
                aria-label="Dismiss cart notification"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
