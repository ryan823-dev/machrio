import { NextRequest, NextResponse } from 'next/server'
import { getPool } from '@/lib/db'
import {
  ensureAccountAuthTables,
  getAccountSessionFromRequest,
} from '@/lib/account-session'

interface AccountRfqRow {
  id: string
  customer_name: string
  customer_phone: string | null
  customer_company: string | null
  message: string
  status: string | null
  submitted_at: string | null
  created_at: string | null
}

function toFiniteNumber(value: unknown, fallback = 0): number {
  const numericValue = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(numericValue) ? numericValue : fallback
}

async function getRfqSummariesForAccount(email: string): Promise<AccountRfqRow[]> {
  const pool = getPool()

  try {
    const result = await pool.query<AccountRfqRow>(
      `SELECT id::text AS id,
              COALESCE(customer->>'name', '') AS customer_name,
              NULLIF(customer->>'phone', '') AS customer_phone,
              NULLIF(customer->>'company', '') AS customer_company,
              COALESCE(inquiry->>'message', notes, '') AS message,
              status,
              submitted_at,
              created_at
       FROM rfq_submissions
       WHERE LOWER(COALESCE(customer->>'email', '')) = $1
       ORDER BY submitted_at DESC NULLS LAST, created_at DESC
       LIMIT 50`,
      [email],
    )

    return result.rows
  } catch {
    const legacyResult = await pool.query<AccountRfqRow>(
      `SELECT id::text AS id,
              COALESCE(customer_name, '') AS customer_name,
              customer_phone,
              customer_company,
              COALESCE(message, '') AS message,
              status,
              submitted_at,
              created_at
       FROM rfq_submissions
       WHERE LOWER(customer_email) = $1
       ORDER BY submitted_at DESC NULLS LAST, created_at DESC
       LIMIT 50`,
      [email],
    )

    return legacyResult.rows
  }
}

export async function GET(request: NextRequest) {
  try {
    await ensureAccountAuthTables()

    const session = await getAccountSessionFromRequest(request)
    if (!session) {
      return NextResponse.json({ error: 'Session expired. Please sign in again.' }, { status: 401 })
    }

    const email = session.email
    const pool = getPool()

    const [ordersResult, rfqs] = await Promise.all([
      pool.query(
        `SELECT * FROM orders
         WHERE LOWER(customer_email) = $1
         ORDER BY created_at DESC
         LIMIT 50`,
        [email],
      ),
      getRfqSummariesForAccount(email),
    ])

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
    } else if (rfqs.length > 0) {
      const latestRfq = rfqs[0]
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
      total: toFiniteNumber(order.total),
      currency: order.currency || 'USD',
      itemCount: order.items?.length || 0,
      createdAt: order.created_at,
    }))

    // Format RFQs for response
    const formattedRfqs = rfqs.map((rfq) => ({
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
