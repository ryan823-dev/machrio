'use client'

import { loadStripe, type Stripe } from '@stripe/stripe-js'

let publishableKeyPromise: Promise<string | null> | null = null
let stripePromise: Promise<Stripe | null> | null = null

const isValidKey = (key: string | null | undefined): boolean =>
  Boolean(key && key.startsWith('pk_'))

async function fetchStripePublishableKey(): Promise<string | null> {
  try {
    const res = await fetch('/api/stripe-config')
    if (!res.ok) return null
    const data = await res.json()
    return data.publishableKey || null
  } catch (err) {
    console.error('Failed to fetch publishable key:', err)
    return null
  }
}

export function resetStripeClientCache() {
  publishableKeyPromise = null
  stripePromise = null
}

export async function getStripePublishableKey(): Promise<string | null> {
  const runtimeKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || null
  if (isValidKey(runtimeKey)) {
    return runtimeKey
  }

  if (!publishableKeyPromise) {
    publishableKeyPromise = fetchStripePublishableKey()
  }

  return publishableKeyPromise
}

export async function getStripePromise(): Promise<Stripe | null> {
  const key = await getStripePublishableKey()
  if (!isValidKey(key)) {
    throw new Error('Stripe is not properly configured')
  }

  if (!stripePromise) {
    stripePromise = loadStripe(key!, {
      locale: 'en',
    })
  }

  return stripePromise
}

export function preloadStripe() {
  return getStripePromise().catch((err) => {
    console.error('Stripe preload failed:', err)
    resetStripeClientCache()
    return null
  })
}
