import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { getOrderById, getPool } from '@/lib/db'
import { syncPartnerCommissionForOrderId } from '@/lib/partner-program'

function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY
  if (!key) return null
  return new Stripe(key, { apiVersion: '2026-02-25.clover' })
}

function toMinorUnits(amount: unknown): number {
  const numericAmount = typeof amount === 'number' ? amount : Number(amount)
  if (!Number.isFinite(numericAmount) || numericAmount <= 0) return 0
  return Math.round(numericAmount * 100)
}

function normalizeCurrency(currency?: string | null): string {
  return (currency || 'USD').toLowerCase()
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

  // 处理 Checkout Session 完成事件（原有逻辑，嵌入式支付前已存在）
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session

    const orderNumber = session.metadata?.orderNumber
    const orderId = session.metadata?.orderId

    if (orderId) {
      try {
        const order = await getOrderById(orderId)
        if (!order) {
          console.error(`Stripe webhook order not found for session ${session.id}:`, orderId)
          return NextResponse.json({ error: 'Order not found' }, { status: 400 })
        }

        if (orderNumber && order.order_number !== orderNumber) {
          console.error(`Stripe checkout session order mismatch: session=${session.id} metadata=${orderNumber} db=${order.order_number}`)
          return NextResponse.json({ error: 'Order metadata mismatch' }, { status: 400 })
        }

        const expectedAmount = toMinorUnits(order.total)
        const actualAmount = session.amount_total ?? 0
        const expectedCurrency = normalizeCurrency(order.currency)
        const actualCurrency = normalizeCurrency(session.currency)

        if (expectedAmount !== actualAmount || expectedCurrency !== actualCurrency) {
          console.error(`Stripe checkout session amount mismatch for order ${order.order_number}: expected ${expectedAmount} ${expectedCurrency}, got ${actualAmount} ${actualCurrency}`)
          return NextResponse.json({ error: 'Payment amount mismatch' }, { status: 400 })
        }

        const pool = getPool()

        // Update order status
        await pool.query(
          `UPDATE orders
           SET status = 'confirmed',
               payment_status = 'paid',
               payment_info = jsonb_set(
                 COALESCE(payment_info, '{}'::jsonb) || '{"method":"stripe"}'::jsonb,
                 '{stripe}',
                 $1::jsonb,
                 true
               ),
               updated_at = NOW()
           WHERE id::text = $2`,
          [
            JSON.stringify({
              method: 'stripe',
              stripeSessionId: session.id,
              stripePaymentIntentId: (session.payment_intent as string) || '',
            }),
            orderId
          ]
        )

        await syncPartnerCommissionForOrderId(orderId)

        console.log(`Order ${orderNumber} marked as paid via Stripe Checkout Session`)
      } catch (err) {
        console.error(`Failed to update order ${orderNumber}:`, err)
        return NextResponse.json({ error: 'Failed to update order' }, { status: 500 })
      }
    }
  }

  // 处理 PaymentIntent 成功事件（新增，支持嵌入式支付）
  if (event.type === 'payment_intent.succeeded') {
    const paymentIntent = event.data.object as Stripe.PaymentIntent

    const orderNumber = paymentIntent.metadata?.orderNumber
    const orderId = paymentIntent.metadata?.orderId

    if (orderId) {
      try {
        const order = await getOrderById(orderId)
        if (!order) {
          console.error(`Stripe PaymentIntent order not found for ${paymentIntent.id}:`, orderId)
          return NextResponse.json({ error: 'Order not found' }, { status: 400 })
        }

        if (orderNumber && order.order_number !== orderNumber) {
          console.error(`Stripe PaymentIntent order mismatch: intent=${paymentIntent.id} metadata=${orderNumber} db=${order.order_number}`)
          return NextResponse.json({ error: 'Order metadata mismatch' }, { status: 400 })
        }

        const expectedAmount = toMinorUnits(order.total)
        const actualAmount = paymentIntent.amount_received || paymentIntent.amount
        const expectedCurrency = normalizeCurrency(order.currency)
        const actualCurrency = normalizeCurrency(paymentIntent.currency)

        if (expectedAmount !== actualAmount || expectedCurrency !== actualCurrency) {
          console.error(`Stripe PaymentIntent amount mismatch for order ${order.order_number}: expected ${expectedAmount} ${expectedCurrency}, got ${actualAmount} ${actualCurrency}`)
          return NextResponse.json({ error: 'Payment amount mismatch' }, { status: 400 })
        }

        const pool = getPool()

        // Update order status
        await pool.query(
          `UPDATE orders
           SET status = 'confirmed',
               payment_status = 'paid',
               payment_info = jsonb_set(
                 COALESCE(payment_info, '{}'::jsonb) || '{"method":"stripe"}'::jsonb,
                 '{stripe}',
                 $1::jsonb,
                 true
               ),
               updated_at = NOW()
           WHERE id::text = $2`,
          [
            JSON.stringify({
              method: 'stripe',
              stripePaymentIntentId: paymentIntent.id,
              paymentType: 'embedded',
            }),
            orderId
          ]
        )

        await syncPartnerCommissionForOrderId(orderId)

        console.log(`Order ${orderNumber} marked as paid via Stripe PaymentIntent (embedded)`)
      } catch (err) {
        console.error(`Failed to update order ${orderNumber}:`, err)
        return NextResponse.json({ error: 'Failed to update order' }, { status: 500 })
      }
    }
  }

  return NextResponse.json({ received: true })
}
