import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { getPayload } from 'payload'
import config from '@payload-config'

function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY
  if (!key) return null
  return new Stripe(key, { apiVersion: '2026-01-28.clover' })
}

export async function POST(req: NextRequest) {
  const stripe = getStripe()
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || ''

  if (!stripe || !webhookSecret) {
    return NextResponse.json({ error: 'Stripe not configured' }, { status: 500 })
  }

  const body = await req.text()
  const signature = req.headers.get('stripe-signature')

  if (!signature) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 })
  }

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
  } catch (err) {
    console.error('Webhook signature verification failed:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session

    const orderNumber = session.metadata?.orderNumber
    const orderId = session.metadata?.orderId

    if (orderId) {
      try {
        const payload = await getPayload({ config })

        await payload.update({
          collection: 'orders',
          id: orderId,
          data: {
            status: 'confirmed',
            paymentStatus: 'paid',
            payment: {
              method: 'stripe',
              stripeSessionId: session.id,
              stripePaymentIntentId: (session.payment_intent as string) || '',
            },
          },
        })

        console.log(`Order ${orderNumber} marked as paid via Stripe`)
      } catch (err) {
        console.error(`Failed to update order ${orderNumber}:`, err)
        return NextResponse.json({ error: 'Failed to update order' }, { status: 500 })
      }
    }
  }

  return NextResponse.json({ received: true })
}
