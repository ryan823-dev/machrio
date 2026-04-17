import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { getOrderById, getPool } from '@/lib/db'
import { authorizeOrderAccess } from '@/lib/order-access'
import { recordOrderEvent } from '@/lib/order-events'

export const dynamic = 'force-dynamic'

function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY
  if (!key || key.includes('placeholder')) return null
  return new Stripe(key, { apiVersion: '2026-02-25.clover' })
}

function toMinorUnits(amount: unknown): number {
  const numericAmount = typeof amount === 'number' ? amount : Number(amount)
  if (!Number.isFinite(numericAmount) || numericAmount <= 0) return 0
  return Math.round(numericAmount * 100)
}

function getStoredPaymentMethod(order: Awaited<ReturnType<typeof getOrderById>>): string | null {
  if (!order) return null

  const paymentInfo = (order.payment_info || {}) as {
    method?: string
    stripe?: unknown
    paypal?: unknown
  }

  return order.payment_method
    || paymentInfo.method
    || (paymentInfo.stripe ? 'stripe' : paymentInfo.paypal ? 'paypal' : null)
}

/**
 * 创建 Stripe PaymentIntent 用于嵌入式支付
 * 与现有的 Checkout Session 方式并存，不影响原有功能
 */
export async function POST(request: NextRequest) {
  const stripe = getStripe()

  if (!stripe) {
    return NextResponse.json(
      { error: 'Stripe not configured' },
      { status: 503 }
    )
  }

  try {
    const body = await request.json()
    const { orderId, orderNumber, accessToken } = body

    if (!orderId || typeof orderId !== 'string') {
      return NextResponse.json(
        { error: 'orderId is required' },
        { status: 400 }
      )
    }

    const order = await getOrderById(orderId)
    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      )
    }

    if (orderNumber && order.order_number !== orderNumber) {
      return NextResponse.json(
        { error: 'Order number does not match order id' },
        { status: 400 }
      )
    }

    const hasAccess = await authorizeOrderAccess({
      order,
      request,
      accessToken: typeof accessToken === 'string' ? accessToken : undefined,
      allowedPurposes: ['order-access', 'payment-retry'],
    })

    if (!hasAccess) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      )
    }

    if (getStoredPaymentMethod(order) !== 'stripe') {
      return NextResponse.json(
        { error: 'Order is not configured for Stripe payment' },
        { status: 400 }
      )
    }

    if (order.payment_status === 'paid') {
      return NextResponse.json(
        { error: 'Order is already paid' },
        { status: 409 }
      )
    }

    const amount = toMinorUnits(order.total)
    if (amount <= 0) {
      return NextResponse.json(
        { error: 'Order total is invalid' },
        { status: 400 }
      )
    }

    const currency = (order.currency || 'USD').toLowerCase()

    // 创建 PaymentIntent
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency,
      automatic_payment_methods: { enabled: true },
      metadata: {
        orderId,
        orderNumber: order.order_number,
      },
      receipt_email: order.customer_email || undefined,
    })

    const pool = getPool()
    await pool.query(
      `UPDATE orders
       SET payment_info = jsonb_set(
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
          paymentType: 'retry',
        }),
        orderId,
      ],
    )

    try {
      await recordOrderEvent({
        orderNumber: order.order_number,
        orderId,
        type: 'payment.pending',
        data: {
          paymentMethod: 'stripe',
          source: 'retry',
        },
      })
    } catch (orderEventError) {
      console.error('Failed to record Stripe retry event:', orderEventError)
    }

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
    })
  } catch (err) {
    console.error('PaymentIntent creation error:', err)
    const errorMessage = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json(
      { error: 'Failed to create payment intent', details: errorMessage },
      { status: 500 }
    )
  }
}
