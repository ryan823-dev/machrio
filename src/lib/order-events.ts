import { getPool } from '@/lib/db'

export type OrderEventType =
  | 'order.created'
  | 'payment.pending'
  | 'payment.paid'
  | 'payment.failed'
  | 'receipt.uploaded'
  | 'payment.confirmed_manually'
  | 'shipment.created'

export interface OrderEventRow {
  id: string
  order_number: string
  order_id: string | null
  event_type: OrderEventType
  event_data: Record<string, unknown>
  created_at: string
}

const ORDER_EVENT_TITLES: Record<OrderEventType, string> = {
  'order.created': 'Order created',
  'payment.pending': 'Payment pending',
  'payment.paid': 'Payment paid',
  'payment.failed': 'Payment failed',
  'receipt.uploaded': 'Receipt uploaded',
  'payment.confirmed_manually': 'Payment confirmed manually',
  'shipment.created': 'Shipment created',
}

let orderEventsTableReady = false

function normalizeOrderNumber(orderNumber: string): string {
  return orderNumber.trim()
}

function normalizeEventData(
  eventData: Record<string, unknown> | null | undefined,
): Record<string, unknown> {
  if (!eventData || typeof eventData !== 'object' || Array.isArray(eventData)) {
    return {}
  }

  return eventData
}

function normalizeCreatedAt(value?: string | Date | null): string {
  if (!value) return new Date().toISOString()

  const date = value instanceof Date ? value : new Date(value)
  return Number.isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString()
}

function mapOrderEventRow(row: Record<string, unknown>): OrderEventRow {
  return {
    id: String(row.id || ''),
    order_number: String(row.order_number || ''),
    order_id: row.order_id ? String(row.order_id) : null,
    event_type: String(row.event_type || 'order.created') as OrderEventType,
    event_data: normalizeEventData(row.event_data as Record<string, unknown> | undefined),
    created_at: new Date(String(row.created_at || new Date().toISOString())).toISOString(),
  }
}

function getPaymentMethodLabel(value: unknown): string {
  const method = String(value || '').toLowerCase()

  if (method === 'stripe') return 'Stripe'
  if (method === 'paypal') return 'PayPal'
  if (method === 'bank-transfer') return 'Bank transfer'
  return method ? method : 'payment'
}

export async function ensureOrderEventsTable() {
  if (orderEventsTableReady) return

  const pool = getPool()
  await pool.query(`
    CREATE TABLE IF NOT EXISTS order_events (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      order_number TEXT NOT NULL,
      order_id TEXT,
      event_type TEXT NOT NULL,
      event_data JSONB NOT NULL DEFAULT '{}'::jsonb,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `)
  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_order_events_order_number_created_at
    ON order_events(order_number, created_at ASC)
  `)
  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_order_events_order_number_type
    ON order_events(order_number, event_type)
  `)

  orderEventsTableReady = true
}

export async function recordOrderEvent(input: {
  orderNumber: string
  orderId?: string | null
  type: OrderEventType
  data?: Record<string, unknown>
  createdAt?: string | Date | null
  oncePerOrder?: boolean
}): Promise<OrderEventRow | null> {
  const orderNumber = normalizeOrderNumber(input.orderNumber)
  if (!orderNumber) return null

  await ensureOrderEventsTable()

  const pool = getPool()
  if (input.oncePerOrder) {
    const existing = await pool.query(
      `SELECT id
       FROM order_events
       WHERE order_number = $1
         AND event_type = $2
       LIMIT 1`,
      [orderNumber, input.type],
    )

    if (existing.rows[0]?.id) {
      return null
    }
  }

  const result = await pool.query(
    `INSERT INTO order_events (
      order_number,
      order_id,
      event_type,
      event_data,
      created_at
    )
    VALUES ($1, $2, $3, $4::jsonb, $5)
    RETURNING id::text AS id,
              order_number,
              order_id,
              event_type,
              event_data,
              created_at`,
    [
      orderNumber,
      input.orderId || null,
      input.type,
      JSON.stringify(normalizeEventData(input.data)),
      normalizeCreatedAt(input.createdAt),
    ],
  )

  return result.rows[0] ? mapOrderEventRow(result.rows[0]) : null
}

export async function listOrderEvents(orderNumber: string): Promise<OrderEventRow[]> {
  const normalizedOrderNumber = normalizeOrderNumber(orderNumber)
  if (!normalizedOrderNumber) return []

  await ensureOrderEventsTable()

  const pool = getPool()
  const result = await pool.query(
    `SELECT id::text AS id,
            order_number,
            order_id,
            event_type,
            event_data,
            created_at
     FROM order_events
     WHERE order_number = $1
     ORDER BY created_at ASC, id ASC`,
    [normalizedOrderNumber],
  )

  return result.rows.map((row) => mapOrderEventRow(row))
}

export function getOrderEventTitle(eventType: OrderEventType | string): string {
  return ORDER_EVENT_TITLES[eventType as OrderEventType] || String(eventType || 'Order update')
}

export function getOrderEventDescription(event: Pick<OrderEventRow, 'event_type' | 'event_data'>): string {
  const eventData = normalizeEventData(event.event_data)

  switch (event.event_type) {
    case 'order.created':
      return eventData.paymentMethod
        ? `Initial payment method: ${getPaymentMethodLabel(eventData.paymentMethod)}.`
        : 'Order was created successfully.'
    case 'payment.pending':
      return eventData.paymentMethod
        ? `Waiting for ${getPaymentMethodLabel(eventData.paymentMethod).toLowerCase()} confirmation.`
        : 'Payment is awaiting confirmation.'
    case 'payment.paid':
      return eventData.paymentMethod
        ? `${getPaymentMethodLabel(eventData.paymentMethod)} payment was confirmed.`
        : 'Payment was confirmed.'
    case 'payment.failed':
      if (typeof eventData.message === 'string' && eventData.message.trim()) {
        return eventData.message
      }
      return eventData.paymentMethod
        ? `${getPaymentMethodLabel(eventData.paymentMethod)} payment was not completed.`
        : 'Payment was not completed.'
    case 'receipt.uploaded':
      return typeof eventData.filename === 'string' && eventData.filename
        ? `Receipt file uploaded: ${eventData.filename}.`
        : 'Customer uploaded a payment receipt.'
    case 'payment.confirmed_manually':
      return typeof eventData.note === 'string' && eventData.note.trim()
        ? eventData.note
        : 'Finance or sales manually confirmed the payment.'
    case 'shipment.created':
      if (typeof eventData.trackingNumber === 'string' && eventData.trackingNumber) {
        return `Tracking number: ${eventData.trackingNumber}.`
      }
      if (typeof eventData.shippingMethod === 'string' && eventData.shippingMethod) {
        return `Shipment created via ${eventData.shippingMethod}.`
      }
      return 'Shipment details were added to the order.'
    default:
      return 'Order timeline updated.'
  }
}
