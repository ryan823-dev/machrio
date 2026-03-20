import { NextRequest, NextResponse } from 'next/server'
import { createPayPalOrder, getPayPalApprovalUrl } from '@/lib/paypal'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    const {
      orderNumber,
      orderId,
      items,
      subtotal,
      shippingCost,
      total,
      currency,
      customerEmail,
    } = body

    if (!orderNumber || !orderId || !items || !total) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Create PayPal order
    const paypalOrder = await createPayPalOrder({
      orderNumber,
      orderId,
      items,
      subtotal,
      shippingCost,
      total,
      currency: currency || 'USD',
      customerEmail,
    })

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