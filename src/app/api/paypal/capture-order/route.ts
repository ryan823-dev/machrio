import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
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

    // Update the order in Payload
    const payload = await getPayload({ config })

    // Find the order by orderNumber
    const orders = await payload.find({
      collection: 'orders',
      where: {
        orderNumber: { equals: orderNumber },
      },
      limit: 1,
    })

    if (orders.docs.length === 0) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      )
    }

    const order = orders.docs[0]

    // Update order status
    await payload.update({
      collection: 'orders',
      id: order.id,
      data: {
        status: 'processing',
        paymentStatus: 'paid',
        payment: {
          method: 'paypal',
          paypalOrderId: paypalOrderId,
          paypalCaptureId: captureResult.purchase_units[0]?.payments?.captures?.[0]?.id,
        },
      },
    })

    // Send payment confirmation email
    if (order.customer?.email) {
      sendOrderConfirmationEmail({
        orderNumber,
        customerName: order.customer.name || 'Customer',
        customerEmail: order.customer.email,
        company: order.customer.company || '',
        total: order.total || 0,
        currency: order.currency || 'USD',
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