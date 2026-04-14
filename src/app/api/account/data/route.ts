import { NextResponse } from 'next/server'
import { getPool } from '@/lib/db'

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

    const pool = getPool()

    // Validate session
    const sessionResult = await pool.query(
      `SELECT email FROM account_sessions
       WHERE token = $1 AND expires_at > NOW()`,
      [token]
    )

    if (sessionResult.rows.length === 0) {
      return NextResponse.json({ error: 'Session expired. Please sign in again.' }, { status: 401 })
    }

    const email = sessionResult.rows[0].email

    // Fetch orders
    const ordersResult = await pool.query(
      `SELECT * FROM orders WHERE customer_email = $1 ORDER BY created_at DESC LIMIT 50`,
      [email]
    )

    // Fetch RFQs
    const rfqsResult = await pool.query(
      `SELECT * FROM rfq_submissions WHERE customer_email = $1 ORDER BY submitted_at DESC NULLS LAST, created_at DESC LIMIT 50`,
      [email]
    )

    // Build profile from most recent order or RFQ
    let profile = { name: '', company: '', phone: '', email }
    if (ordersResult.rows.length > 0) {
      const latestOrder = ordersResult.rows[0]
      profile = {
        name: latestOrder.customer_name || '',
        company: latestOrder.customer_company || '',
        phone: latestOrder.customer_phone || '',
        email,
      }
    } else if (rfqsResult.rows.length > 0) {
      const latestRfq = rfqsResult.rows[0]
      profile = {
        name: latestRfq.customer_name || '',
        company: latestRfq.customer_company || '',
        phone: latestRfq.customer_phone || '',
        email,
      }
    }

    // Format orders for response
    const formattedOrders = ordersResult.rows.map((order) => ({
      id: order.id,
      orderNumber: order.order_number,
      status: order.status,
      paymentStatus: order.payment_status,
      total: order.total,
      currency: order.currency || 'USD',
      itemCount: order.items?.length || 0,
      createdAt: order.created_at,
    }))

    // Format RFQs for response
    const formattedRfqs = rfqsResult.rows.map((rfq) => ({
      id: rfq.id,
      status: rfq.status || 'new',
      message: rfq.message
        ? rfq.message.length > 120
          ? rfq.message.slice(0, 120) + '...'
          : rfq.message
        : '',
      submittedAt: rfq.submitted_at || rfq.created_at,
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
