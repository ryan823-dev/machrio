import { NextRequest, NextResponse } from 'next/server'
import { getOrderByNumber } from '@/lib/db'
import { authorizeOrderAccess } from '@/lib/order-access'
import { recordOrderEvent, type OrderEventType } from '@/lib/order-events'

const CLIENT_REPORTED_EVENT_TYPES = new Set<OrderEventType>(['payment.failed'])

function sanitizeEventData(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return {}
  }

  return value as Record<string, unknown>
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ orderNumber: string }> },
) {
  try {
    const { orderNumber } = await params
    const order = await getOrderByNumber(orderNumber)

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    const body = await req.json().catch(() => ({}))
    const eventType = String(body?.type || '') as OrderEventType

    if (!CLIENT_REPORTED_EVENT_TYPES.has(eventType)) {
      return NextResponse.json({ error: 'Unsupported event type' }, { status: 400 })
    }

    const accessResult = await authorizeOrderAccess({
      order,
      request: req,
      accessToken: typeof body?.accessToken === 'string' ? body.accessToken : undefined,
      allowedPurposes: ['order-access', 'payment-retry'],
    })

    if (!accessResult) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    if (eventType === 'payment.failed' && order.payment_status === 'paid') {
      return NextResponse.json({ success: true, ignored: true })
    }

    await recordOrderEvent({
      orderNumber: order.order_number,
      orderId: order.id,
      type: eventType,
      data: sanitizeEventData(body?.data),
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to record order event:', error)
    return NextResponse.json({ error: 'Failed to record order event' }, { status: 500 })
  }
}
