import { NextRequest, NextResponse } from 'next/server'
import { createPayPalOrder, getPayPalApprovalUrl } from '@/lib/paypal'
import { getOrderById, getPool } from '@/lib/db'
import { authorizeOrderAccess } from '@/lib/order-access'
import { appendQueryParamsToPath, buildOrderPath, toAbsoluteUrl } from '@/lib/order-access-links'
import { recordOrderEvent } from '@/lib/order-events'

function toNumber(value: unknown): number {
  const numericValue = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(numericValue) ? numericValue : 0
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
    || (paymentInfo.paypal ? 'paypal' : paymentInfo.stripe ? 'stripe' : null)
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    const { orderNumber, orderId, accessToken } = body

    if (!orderNumber || !orderId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
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

    if (order.order_number !== orderNumber) {
      return NextResponse.json(
        { error: 'Order number does not match order id' },
        { status: 400 }
      )
    }

    const hasAccess = await authorizeOrderAccess({
      order,
      request: req,
      accessToken: typeof accessToken === 'string' ? accessToken : undefined,
      allowedPurposes: ['order-access', 'payment-retry'],
    })

    if (!hasAccess) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      )
    }

    if (getStoredPaymentMethod(order) !== 'paypal') {
      return NextResponse.json(
        { error: 'Order is not configured for PayPal payment' },
        { status: 400 }
      )
    }

    if (order.payment_status === 'paid') {
      return NextResponse.json(
        { error: 'Order is already paid' },
        { status: 409 }
      )
    }

    const items = Array.isArray(order.items) ? order.items : []
    if (items.length === 0) {
      return NextResponse.json(
        { error: 'Order does not contain any payable items' },
        { status: 400 }
      )
    }

    const serverUrl = process.env.NEXT_PUBLIC_SERVER_URL || 'https://machrio.com'
    const orderPath = buildOrderPath(
      order.order_number,
      hasAccess.via === 'token' ? accessToken : undefined,
    )

    // Create PayPal order
    const paypalOrder = await createPayPalOrder({
      orderNumber,
      orderId,
      items: items.map((item) => ({
        name: String(item.productName || item.name || 'Product'),
        sku: String(item.sku || ''),
        quantity: Number(item.quantity || 0),
        unitPrice: toNumber(item.unitPrice),
      })),
      subtotal: toNumber(order.subtotal),
      shippingCost: toNumber(order.shipping_cost),
      total: toNumber(order.total),
      currency: order.currency || 'USD',
      customerEmail: order.customer_email,
      returnUrl: toAbsoluteUrl(
        appendQueryParamsToPath(orderPath, {
          payment: 'success',
          provider: 'paypal',
        }),
        serverUrl,
      ),
      cancelUrl: toAbsoluteUrl(
        appendQueryParamsToPath(orderPath, {
          payment: 'cancelled',
          provider: 'paypal',
        }),
        serverUrl,
      ),
    })

    const pool = getPool()
    await pool.query(
      `UPDATE orders
       SET payment_info = jsonb_set(
             COALESCE(payment_info, '{}'::jsonb) || '{"method":"paypal"}'::jsonb,
             '{paypal}',
             $1::jsonb,
             true
           ),
           updated_at = NOW()
       WHERE id::text = $2`,
      [
        JSON.stringify({
          method: 'paypal',
          paypalOrderId: paypalOrder.id,
          paymentType: 'retry',
        }),
        orderId,
      ]
    )

    try {
      await recordOrderEvent({
        orderNumber: order.order_number,
        orderId,
        type: 'payment.pending',
        data: {
          paymentMethod: 'paypal',
          source: 'retry',
        },
      })
    } catch (orderEventError) {
      console.error('Failed to record PayPal retry event:', orderEventError)
    }

    // Get the approval URL
    const approvalUrl = getPayPalApprovalUrl(paypalOrder)

    if (!approvalUrl) {
      return NextResponse.json(
        { error: 'Failed to get PayPal approval URL' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      paypalOrderId: paypalOrder.id,
      approvalUrl,
    })
  } catch (error) {
    console.error('PayPal order creation error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create PayPal order' },
      { status: 500 }
    )
  }
}
