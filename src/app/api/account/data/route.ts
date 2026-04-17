import { NextRequest, NextResponse } from 'next/server'
import { getPool, getRfqSubmissionsByEmail } from '@/lib/db'
import {
  ensureAccountAuthTables,
  getAccountSessionFromRequest,
} from '@/lib/account-session'
import { syncCustomerLinksByEmail } from '@/lib/customer-service'

function isUuid(value: string | null | undefined): value is string {
  return Boolean(
    value
    && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value),
  )
}

function toFiniteNumber(value: unknown, fallback = 0): number {
  const numericValue = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(numericValue) ? numericValue : fallback
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
    const customer = await syncCustomerLinksByEmail(email, {
      markAccountLinked: true,
    }).catch((customerLinkError) => {
      console.error('Failed to sync customer links while loading account data:', customerLinkError)
      return null
    })

    const [ordersResult, rfqs] = await Promise.all([
      customer?.id && isUuid(customer.id)
        ? pool.query(
            `SELECT * FROM orders
             WHERE customer_ref_id = $1::uuid
                OR LOWER(customer_email) = $2
             ORDER BY created_at DESC
             LIMIT 50`,
            [customer.id, email],
          )
        : pool.query(
            `SELECT * FROM orders
             WHERE LOWER(customer_email) = $1
             ORDER BY created_at DESC
             LIMIT 50`,
            [email],
          ),
      getRfqSubmissionsByEmail(email, 50),
    ])

    // Build profile from customer master record, with order/RFQ fallback for sparse fields
    let profile = {
      name: customer?.name || '',
      company: customer?.company || '',
      phone: customer?.phone || '',
      email,
    }
    if (ordersResult.rows.length > 0 && (!profile.name || !profile.company || !profile.phone)) {
      const latestOrder = ordersResult.rows[0]
      profile = {
        name: profile.name || latestOrder.customer_name || '',
        company: profile.company || latestOrder.customer_company || '',
        phone: profile.phone || latestOrder.customer_phone || '',
        email,
      }
    } else if (rfqs.length > 0 && (!profile.name || !profile.company || !profile.phone)) {
      const latestRfq = rfqs[0]
      profile = {
        name: profile.name || latestRfq.customer_name || '',
        company: profile.company || latestRfq.customer_company || '',
        phone: profile.phone || latestRfq.customer_phone || '',
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
