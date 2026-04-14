import { NextRequest, NextResponse } from 'next/server'
import { getPool, getOrderByNumber } from '@/lib/db'
import { capturePayPalOrder, getPayPalOrder } from '@/lib/paypal'
import { sendOrderConfirmationEmail } from '@/lib/email'

function formatAmount(value: unknown): string {
  const numericValue = typeof value === 'number' ? value : Number(value)
  if (!Number.isFinite(numericValue)) return '0.00'
  return numericValue.toFixed(2)
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { paypalOrderId, orderNumber } = body

    if (!paypalOrderId || !orderNumber) {
      return NextResponse.json(
        { error: 'Missing PayPal order ID or order number' },
        { status: 400 }
      )
    }

    // Find the order
    const order = await getOrderByNumber(orderNumber)

    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      )
    }

    if (order.payment_method !== 'paypal') {
      return NextResponse.json(
        { error: 'Order is not configured for PayPal payment' },
        { status: 400 }
      )
    }

    const paymentInfo = (order.payment_info || {}) as {
      paypalOrderId?: string
      paypal?: {
        paypalOrderId?: string
      }
    }
    const storedPayPalOrderId = paymentInfo.paypal?.paypalOrderId || paymentInfo.paypalOrderId

    if (storedPayPalOrderId && storedPayPalOrderId !== paypalOrderId) {
      return NextResponse.json(
        { error: 'PayPal order ID does not match this order' },
        { status: 400 }
      )
    }

    if (order.payment_status === 'paid') {
      return NextResponse.json({
        success: true,
        status: 'COMPLETED',
        alreadyPaid: true,
      })
    }

    const paypalOrder = await getPayPalOrder(paypalOrderId)
    const purchaseUnit = paypalOrder.purchase_units?.[0]
    const expectedAmount = formatAmount(order.total)
    const expectedCurrency = order.currency || 'USD'

    if (!purchaseUnit) {
      return NextResponse.json(
        { error: 'PayPal order does not contain any purchase units' },
        { status: 400 }
      )
    }

    if (purchaseUnit.reference_id !== order.order_number || purchaseUnit.custom_id !== order.id) {
      return NextResponse.json(
        { error: 'PayPal order is not linked to this Machrio order' },
        { status: 400 }
      )
    }

    if (
      purchaseUnit.amount?.value !== expectedAmount ||
      purchaseUnit.amount?.currency_code !== expectedCurrency
    ) {
      return NextResponse.json(
        { error: 'PayPal order amount does not match the order total' },
        { status: 400 }
      )
    }

    // Capture the PayPal order after verifying it belongs to this local order
    const captureResult = await capturePayPalOrder(paypalOrderId)

    if (captureResult.status !== 'COMPLETED') {
      return NextResponse.json(
        { error: `PayPal capture failed with status: ${captureResult.status}` },
        { status: 400 }
      )
    }

    // Update order status in database
    const pool = getPool()
    await pool.query(
      `UPDATE orders
       SET status = 'processing',
           payment_status = 'paid',
           payment_info = jsonb_set(
             COALESCE(payment_info, '{}'::jsonb) || '{"method":"paypal"}'::jsonb,
             '{paypal}',
             $1::jsonb,
             true
           ),
           updated_at = NOW()
       WHERE order_number = $2`,
      [
        JSON.stringify({
          method: 'paypal',
          paypalOrderId: paypalOrderId,
          paypalCaptureId: captureResult.purchase_units[0]?.payments?.captures?.[0]?.id,
        }),
        orderNumber
      ]
    )

    // Send payment confirmation email
    if (order.customer_email) {
      const itemCount = Array.isArray(order.items) ? order.items.length : 0

      sendOrderConfirmationEmail({
        orderNumber,
        customerName: order.customer_name || 'Customer',
        customerEmail: order.customer_email,
        company: order.customer_company || '',
        total: order.total || 0,
        currency: order.currency || 'USD',
        paymentMethod: 'paypal',
        itemCount,
        paid: true,
      }).catch(err => console.error('Email send error:', err))
    }

    return NextResponse.json({
      success: true,
      status: captureResult.status,
    })
  } catch (error) {
    console.error('PayPal capture error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to capture PayPal order' },
      { status: 500 }
    )
  }
}
