import { NextRequest, NextResponse } from 'next/server'
import { getOrderById, getPool } from '@/lib/db'
import { authorizeOrderAccess } from '@/lib/order-access'
import { recordOrderEvent } from '@/lib/order-events'
import { isPayPalConfigured } from '@/lib/paypal'

const ALLOWED_PAYMENT_METHODS = new Set(['stripe', 'paypal', 'bank-transfer'])

function isStripeConfigured(): boolean {
  const key = process.env.STRIPE_SECRET_KEY
  return Boolean(key && !key.includes('placeholder'))
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))
    const orderId = typeof body.orderId === 'string' ? body.orderId : ''
    const orderNumber = typeof body.orderNumber === 'string' ? body.orderNumber : ''
    const nextPaymentMethod = typeof body.paymentMethod === 'string' ? body.paymentMethod : ''
    const accessToken = typeof body.accessToken === 'string' ? body.accessToken : undefined

    if (!orderId || !orderNumber || !ALLOWED_PAYMENT_METHODS.has(nextPaymentMethod)) {
      return NextResponse.json({ error: 'Missing or invalid payment method request' }, { status: 400 })
    }

    const order = await getOrderById(orderId)
    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    if (order.order_number !== orderNumber) {
      return NextResponse.json({ error: 'Order number does not match order id' }, { status: 400 })
    }

    const accessResult = await authorizeOrderAccess({
      order,
      request,
      accessToken,
      allowedPurposes: ['order-access', 'payment-retry'],
    })

    if (!accessResult) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    if (order.payment_status === 'paid') {
      return NextResponse.json({ error: 'Order is already paid' }, { status: 409 })
    }

    if (nextPaymentMethod === 'stripe' && !isStripeConfigured()) {
      return NextResponse.json({ error: 'Stripe is not configured for this environment' }, { status: 503 })
    }

    if (nextPaymentMethod === 'paypal' && !isPayPalConfigured()) {
      return NextResponse.json({ error: 'PayPal is not configured for this environment' }, { status: 503 })
    }

    const currentPaymentMethod = order.payment_method || ''
    if (currentPaymentMethod === nextPaymentMethod) {
      return NextResponse.json({
        success: true,
        paymentMethod: nextPaymentMethod,
        changed: false,
      })
    }

    const pool = getPool()
    await pool.query(
      `UPDATE orders
       SET payment_method = $1,
           payment_info = jsonb_set(
             COALESCE(payment_info, '{}'::jsonb),
             '{method}',
             to_jsonb($1::text),
             true
           ),
           updated_at = NOW()
       WHERE id::text = $2`,
      [nextPaymentMethod, orderId],
    )

    await recordOrderEvent({
      orderNumber: order.order_number,
      orderId,
      type: 'payment.pending',
      data: {
        paymentMethod: nextPaymentMethod,
        previousPaymentMethod: currentPaymentMethod,
        source: 'method-switch',
      },
    }).catch((orderEventError) => {
      console.error(`Failed to record payment method switch for order ${order.order_number}:`, orderEventError)
    })

    return NextResponse.json({
      success: true,
      paymentMethod: nextPaymentMethod,
      changed: true,
    })
  } catch (error) {
    console.error('Failed to change order payment method:', error)
    return NextResponse.json({ error: 'Failed to change payment method' }, { status: 500 })
  }
}
