import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import { sendEmail } from '@/lib/email'
import { recordOrderEvent } from '@/lib/order-events'
import { syncPartnerCommissionForOrderId } from '@/lib/partner-program'
import { issueOrderAccessLinks } from '@/lib/order-access'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await req.json()
    const { notes, notifyCustomer } = body || {}

    const payload = await getPayload({ config })
    const authResult = await payload.auth({ headers: req.headers })
    const user = authResult.user as { role?: string } | null

    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    if (user.role !== 'admin' && user.role !== 'sales') {
      return NextResponse.json(
        { error: 'Admin or sales access required' },
        { status: 403 }
      )
    }

    // Update order payment status
    const order = await payload.update({
      collection: 'orders',
      id,
      data: {
        paymentStatus: 'paid',
        status: 'confirmed',
      },
    })

    await syncPartnerCommissionForOrderId(id)

    const orderNumber = order.orderNumber as string
    const customer = order.customer as Record<string, unknown>
    const customerEmail = customer.email as string
    const customerName = customer.name as string
    const total = order.total as number
    const currency = order.currency as string

    await recordOrderEvent({
      orderNumber,
      orderId: String(order.id),
      type: 'payment.paid',
      data: {
        paymentMethod: 'bank-transfer',
        source: 'manual-confirmation',
      },
      oncePerOrder: true,
    }).catch((orderEventError) => {
      console.error(`Failed to record payment.paid event for order ${orderNumber}:`, orderEventError)
    })

    await recordOrderEvent({
      orderNumber,
      orderId: String(order.id),
      type: 'payment.confirmed_manually',
      data: {
        note: typeof notes === 'string' ? notes : '',
      },
      oncePerOrder: true,
    }).catch((orderEventError) => {
      console.error(`Failed to record payment.confirmed_manually event for order ${orderNumber}:`, orderEventError)
    })

    // Send payment confirmation email to customer if requested
    if (notifyCustomer) {
      const serverUrl = process.env.NEXT_PUBLIC_SERVER_URL || 'https://machrio.com'
      const { orderUrl } = await issueOrderAccessLinks({
        orderNumber,
        email: customerEmail,
        baseUrl: serverUrl,
      })

      await sendEmail({
        to: customerEmail,
        subject: `Payment Confirmed - Order ${orderNumber}`,
        html: `
          <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#1e293b">
            <div style="background:#1a3c6e;padding:20px 24px;border-radius:8px 8px 0 0">
              <h1 style="margin:0;color:#fff;font-size:20px">Mach<span style="color:#f59e0b">rio</span></h1>
            </div>
            <div style="padding:24px;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 8px 8px">
              <div style="background:#dcfce7;border:1px solid #86efac;border-radius:6px;padding:16px;margin:0 0 16px">
                <h2 style="margin:0 0 8px;color:#166534;font-size:18px">Payment Received!</h2>
                <p style="margin:0;color:#166534">Thank you for your payment. Your order is now confirmed and will be processed shortly.</p>
              </div>
              
              <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:6px;padding:16px;margin:0 0 16px">
                <p style="margin:0 0 8px"><strong>Order Number:</strong> ${orderNumber}</p>
                <p style="margin:0 0 8px"><strong>Customer:</strong> ${customerName}</p>
                <p style="margin:0 0 8px"><strong>Amount Paid:</strong> $${total.toFixed(2)} ${currency}</p>
                <p style="margin:0 0 8px"><strong>Payment Method:</strong> Bank Transfer</p>
                ${notes ? `<p style="margin:0 0 8px"><strong>Note:</strong> ${notes}</p>` : ''}
              </div>
              
              <a href="${orderUrl}" style="display:inline-block;background:#1a3c6e;color:#fff;padding:10px 24px;border-radius:6px;text-decoration:none;font-weight:600;font-size:14px">View Order Status</a>
              
              <p style="margin:24px 0 0;color:#94a3b8;font-size:12px">
                We will begin processing your order and will notify you once it ships.
              </p>
            </div>
          </div>
        `,
      })
    }

    return NextResponse.json({
      success: true,
      message: 'Payment confirmed successfully',
      order,
    })
  } catch (err) {
    console.error('Failed to confirm payment:', err)
    return NextResponse.json(
      { error: 'Failed to confirm payment' },
      { status: 500 }
    )
  }
}
