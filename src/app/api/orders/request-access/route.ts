import { NextResponse } from 'next/server'
import { getOrderByNumber, getPool } from '@/lib/db'
import { sendOrderAccessLinkEmail } from '@/lib/email'
import { ensureOrderAccessTables, issueOrderAccessLinks } from '@/lib/order-access'

const ACCESS_LINK_WINDOW_MS = 15 * 60 * 1000
const ACCESS_LINK_REQUEST_LIMIT = 3

function normalizeEmail(value: unknown): string {
  return typeof value === 'string' ? value.trim().toLowerCase() : ''
}

function normalizeOrderNumber(value: unknown): string {
  return typeof value === 'string' ? value.trim().toUpperCase() : ''
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}))
    const orderNumber = normalizeOrderNumber(body.orderNumber)
    const email = normalizeEmail(body.email)

    if (!orderNumber || !email || !isValidEmail(email)) {
      return NextResponse.json(
        { error: 'Order number and a valid purchasing email are required.' },
        { status: 400 },
      )
    }

    await ensureOrderAccessTables()

    const pool = getPool()
    const recentWindowStart = new Date(Date.now() - ACCESS_LINK_WINDOW_MS).toISOString()
    const recentResult = await pool.query(
      `SELECT COUNT(*)::int AS count
       FROM order_access_tokens
       WHERE order_number = $1
         AND email = $2
         AND created_at > $3`,
      [orderNumber, email, recentWindowStart],
    )

    const recentCount = recentResult.rows[0]?.count || 0
    if (recentCount >= ACCESS_LINK_REQUEST_LIMIT) {
      return NextResponse.json(
        {
          error: 'Too many access link requests. Please wait a few minutes before trying again.',
          retryAfterSeconds: Math.ceil(ACCESS_LINK_WINDOW_MS / 1000),
        },
        { status: 429 },
      )
    }

    const order = await getOrderByNumber(orderNumber)
    if (!order || order.customer_email.trim().toLowerCase() !== email) {
      return NextResponse.json({
        success: true,
        message: 'If the order number and email match, we have sent a secure access link.',
      })
    }

    const serverUrl = process.env.NEXT_PUBLIC_SERVER_URL || 'https://machrio.com'
    const { orderUrl } = await issueOrderAccessLinks({
      orderNumber: order.order_number,
      email,
      baseUrl: serverUrl,
    })

    const emailResult = await sendOrderAccessLinkEmail({
      email,
      orderNumber: order.order_number,
      orderUrl,
    })

    if (!emailResult.success) {
      const isEmailUnavailable = emailResult.error === 'Resend not configured'
      return NextResponse.json(
        {
          error: isEmailUnavailable
            ? 'Email service is not configured. Please contact support.'
            : 'Failed to send the secure access link. Please try again later.',
        },
        { status: isEmailUnavailable ? 503 : 502 },
      )
    }

    return NextResponse.json({
      success: true,
      message: 'We have emailed a secure access link to the purchasing email address.',
    })
  } catch (error) {
    console.error('Order access request error:', error)
    return NextResponse.json(
      { error: 'Failed to send order access link' },
      { status: 500 },
    )
  }
}
