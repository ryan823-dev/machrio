import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'

export const dynamic = 'force-dynamic'

function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY
  if (!key || key.includes('placeholder')) return null
  return new Stripe(key, { apiVersion: '2026-02-25.clover' })
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
    const { orderId, orderNumber, amount, currency = 'usd', customerEmail } = body

    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: 'Valid amount is required' },
        { status: 400 }
      )
    }

    // 创建 PaymentIntent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // 转换为分
      currency: currency.toLowerCase(),
      automatic_payment_methods: { enabled: true },
      metadata: {
        orderId: orderId || '',
        orderNumber: orderNumber || '',
      },
      receipt_email: customerEmail || undefined,
    })

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