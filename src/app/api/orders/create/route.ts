import { NextRequest, NextResponse } from 'next/server'
import { getPool, createOrder } from '@/lib/db/index'
import Stripe from 'stripe'
import { sendOrderConfirmationEmail } from '@/lib/email'
import { calculateShipping } from '@/lib/shipping/calculator'

const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2026-02-25.clover' })
  : null

interface OrderItem {
  product: string
  productName: string
  sku: string
  quantity: number
  unitPrice: number
  lineTotal: number
}

interface OrderRequest {
  customer: {
    name: string
    email: string
    phone?: string
    company: string
  }
  shipping: {
    address: string
    city: string
    state: string
    postalCode: string
    country: string
  }
  items: OrderItem[]
  subtotal: number
  shippingCost: number
  total: number
  currency: string
  paymentMethod: 'stripe' | 'paypal' | 'bank-transfer'
  shippingMethodCode?: string
  customerNotes?: string
}

export async function POST(req: NextRequest) {
  const pool = getPool()
  
  try {
    // First, ensure orders table exists
    try {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS orders (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          order_number TEXT UNIQUE NOT NULL,
          customer_email TEXT NOT NULL,
          customer_name TEXT NOT NULL,
          customer_phone TEXT,
          customer_company TEXT,
          status TEXT NOT NULL DEFAULT 'pending',
          payment_status TEXT NOT NULL DEFAULT 'unpaid',
          payment_method TEXT,
          subtotal NUMERIC NOT NULL DEFAULT 0,
          shipping_cost NUMERIC NOT NULL DEFAULT 0,
          tax NUMERIC NOT NULL DEFAULT 0,
          total NUMERIC NOT NULL DEFAULT 0,
          shipping_address JSONB,
          billing_address JSONB,
          items JSONB,
          notes TEXT,
          payment_info JSONB,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        )
      `)
      await pool.query(`CREATE INDEX IF NOT EXISTS idx_orders_order_number ON orders(order_number)`)
      await pool.query(`CREATE INDEX IF NOT EXISTS idx_orders_customer_email ON orders(customer_email)`)
      await pool.query(`CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status)`)
      await pool.query(`CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at)`)
    } catch (tableError) {
      console.error('Error creating orders table:', tableError)
      // Continue anyway - table might already exist
    }
    const body: OrderRequest = await req.json()

    // Basic validation
    if (!body.customer?.name || !body.customer?.email || !body.customer?.company) {
      return NextResponse.json({ error: 'Customer name, email, and company are required' }, { status: 400 })
    }
    if (!body.items || body.items.length === 0) {
      return NextResponse.json({ error: 'At least one item is required' }, { status: 400 })
    }
    if (!body.shipping?.address || !body.shipping?.city || !body.shipping?.postalCode) {
      return NextResponse.json({ error: 'Shipping address is required' }, { status: 400 })
    }

    // Recalculate totals server-side for integrity
    let subtotal = 0
    for (const item of body.items) {
      subtotal += item.unitPrice * item.quantity
    }

    // Server-side shipping calculation
    let shippingCost = 0
    let shippingMethodCode = ''
    let shippingMethodName = ''
    let estimatedShipDate = ''
    let estimatedDeliveryDate = ''
    let totalWeight = 0

    if (body.shippingMethodCode) {
      const shippingItems = body.items.map(item => ({
        productId: item.product,
        quantity: item.quantity,
      }))
      const country = body.shipping.country || 'US'
      const calcResult = await calculateShipping(shippingItems, country, subtotal)

      if (calcResult.success && calcResult.methods.length > 0) {
        const selectedMethod = calcResult.methods.find(m => m.code === body.shippingMethodCode)
          || calcResult.methods[0]

        shippingCost = selectedMethod.cost
        shippingMethodCode = selectedMethod.code
        shippingMethodName = selectedMethod.name
        estimatedShipDate = calcResult.estimatedShipDate
        estimatedDeliveryDate = selectedMethod.estimatedDeliveryDate
        totalWeight = calcResult.totalWeight
      } else {
        shippingCost = subtotal >= 200 ? 0 : 25
      }
    } else {
      shippingCost = subtotal >= 200 ? 0 : 25
    }

    const total = subtotal + shippingCost

    // Generate order number
    const orderNumber = `MCH-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`

    // Create order in database
    let order
    try {
      order = await createOrder({
        orderNumber,
        customerEmail: body.customer.email,
        customerName: body.customer.name,
        customerPhone: body.customer.phone,
        customerCompany: body.customer.company,
        status: 'pending',
        paymentStatus: 'unpaid',
        paymentMethod: body.paymentMethod,
        subtotal,
        shippingCost,
        tax: 0,
        total,
        shippingAddress: {
          address: body.shipping.address,
          city: body.shipping.city,
          state: body.shipping.state,
          postalCode: body.shipping.postalCode,
          country: body.shipping.country || 'US',
          shippingMethodCode,
          shippingMethodName,
          estimatedShipDate,
          estimatedDeliveryDate,
          totalWeight,
        },
        billingAddress: {},
        items: body.items.map(item => ({
          productId: item.product,
          productName: item.productName,
          sku: item.sku,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          lineTotal: item.unitPrice * item.quantity,
        })),
        notes: body.customerNotes,
      })
    } catch (dbError) {
      console.error('Database error creating order:', dbError)
      const errorMessage = dbError instanceof Error ? dbError.message : 'Unknown database error'
      return NextResponse.json({ error: `Database error: ${errorMessage}` }, { status: 500 })
    }

    if (!order) {
      console.error('Failed to create order - createOrder returned null')
      return NextResponse.json({ error: 'Failed to create order in database' }, { status: 500 })
    }

    // Send confirmation emails (fire-and-forget)
    sendOrderConfirmationEmail({
      orderNumber,
      customerName: body.customer.name,
      customerEmail: body.customer.email,
      company: body.customer.company,
      total,
      currency: body.currency || 'USD',
      paymentMethod: body.paymentMethod,
      itemCount: body.items.length,
    }).catch(err => console.error('Email send error:', err))

    // If Stripe payment, create Checkout Session
    if (body.paymentMethod === 'stripe') {
      if (!stripe) {
        return NextResponse.json({ error: 'Online payment is not configured' }, { status: 500 })
      }

      const serverUrl = process.env.NEXT_PUBLIC_SERVER_URL || 'https://machrio.com'

      const session = await stripe.checkout.sessions.create({
        mode: 'payment',
        customer_email: body.customer.email,
        metadata: {
          orderNumber,
          orderId: order.id,
        },
        line_items: body.items.map(item => ({
          price_data: {
            currency: (body.currency || 'USD').toLowerCase(),
            product_data: {
              name: item.productName,
              description: `SKU: ${item.sku}`,
            },
            unit_amount: Math.round(item.unitPrice * 100),
          },
          quantity: item.quantity,
        })).concat(
          shippingCost > 0
            ? [{
                price_data: {
                  currency: (body.currency || 'USD').toLowerCase(),
                  product_data: {
                    name: 'Shipping',
                    description: shippingMethodName || 'Shipping fee',
                  },
                  unit_amount: Math.round(shippingCost * 100),
                },
                quantity: 1,
              }]
            : []
        ),
        success_url: `${serverUrl}/order/${orderNumber}?payment=success`,
        cancel_url: `${serverUrl}/order/${orderNumber}?payment=cancelled`,
      })

      // Update order with Stripe session ID
      const pool = getPool()
      await pool.query(
        `UPDATE orders SET payment_info = jsonb_set(coalesce(payment_info, '{}'), '{stripeSessionId}', $1) WHERE id = $2`,
        [JSON.stringify(session.id), order.id]
      )

      return NextResponse.json({
        orderNumber,
        orderId: order.id,
        stripeUrl: session.url,
      })
    }

    return NextResponse.json({
      orderNumber,
      orderId: order.id,
    })
  } catch (err) {
    console.error('Order creation error:', err)
    return NextResponse.json(
      { error: 'Failed to create order' },
      { status: 500 }
    )
  }
}