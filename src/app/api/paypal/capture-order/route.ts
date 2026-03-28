import { NextRequest, NextResponse } from 'next/server'
import { getPool, getOrderByNumber } from '@/lib/db'
import { capturePayPalOrder } from '@/lib/paypal'
import { sendOrderConfirmationEmail } from '@/lib/email'

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

    // Capture the PayPal order
    const captureResult = await capturePayPalOrder(paypalOrderId)

    if (captureResult.status !== 'COMPLETED') {
      return NextResponse.json(
        { error: `PayPal capture failed with status: ${captureResult.status}` },
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

    // Update order status in database
    const pool = getPool()
    await pool.query(
      `UPDATE orders
       SET status = 'processing',
           payment_status = 'paid',
           payment_info = jsonb_set(
             COALESCE(payment_info, '{}'),
             '{paypal}',
             $1
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
      sendOrderConfirmationEmail({
        orderNumber,
        customerName: order.customer_name || 'Customer',
        customerEmail: order.customer_email,
        company: order.customer_company || '',
        total: order.total || 0,
        currency: 'USD',
        paymentMethod: 'paypal',
        itemCount: (order.items as any[])?.length || 0,
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