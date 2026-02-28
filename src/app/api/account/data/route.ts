import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.slice(7)
    if (!token || token.length !== 64) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const payload = await getPayload({ config })

    // Validate session
    const sessions = await payload.find({
      collection: 'account-sessions' as any as any,
      where: {
        token: { equals: token },
        expiresAt: { greater_than: new Date().toISOString() },
      },
      limit: 1,
    })

    if (sessions.docs.length === 0) {
      return NextResponse.json({ error: 'Session expired. Please sign in again.' }, { status: 401 })
    }

    const email = (sessions.docs[0] as any).email

    // Fetch orders
    const orders = await payload.find({
      collection: 'orders',
      where: { 'customer.email': { equals: email } },
      sort: '-createdAt',
      limit: 50,
    })

    // Fetch RFQs
    const rfqs = await payload.find({
      collection: 'rfq-submissions',
      where: { 'customer.email': { equals: email } },
      sort: '-createdAt',
      limit: 50,
    })

    // Build profile from most recent order or RFQ
    let profile = { name: '', company: '', phone: '', email }
    if (orders.docs.length > 0) {
      const latestOrder = orders.docs[0] as any
      profile = {
        name: latestOrder.customer?.name || '',
        company: latestOrder.customer?.company || '',
        phone: latestOrder.customer?.phone || '',
        email,
      }
    } else if (rfqs.docs.length > 0) {
      const latestRfq = rfqs.docs[0] as any
      profile = {
        name: latestRfq.customer?.name || '',
        company: latestRfq.customer?.company || '',
        phone: latestRfq.customer?.phone || '',
        email,
      }
    }

    // Format orders for response
    const formattedOrders = orders.docs.map((order: any) => ({
      id: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      paymentStatus: order.paymentStatus,
      total: order.total,
      currency: order.currency || 'USD',
      itemCount: order.items?.length || 0,
      createdAt: order.createdAt,
    }))

    // Format RFQs for response
    const formattedRfqs = rfqs.docs.map((rfq: any) => ({
      id: rfq.id,
      status: rfq.status || 'new',
      message: rfq.inquiry?.message
        ? rfq.inquiry.message.length > 120
          ? rfq.inquiry.message.slice(0, 120) + '...'
          : rfq.inquiry.message
        : '',
      submittedAt: rfq.submittedAt || rfq.createdAt,
    }))

    return NextResponse.json({
      success: true,
      profile,
      orders: formattedOrders,
      rfqs: formattedRfqs,
    })
  } catch (err) {
    console.error('Account data error:', err)
    return NextResponse.json({ error: 'Failed to fetch account data' }, { status: 500 })
  }
}
