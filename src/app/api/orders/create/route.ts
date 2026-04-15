import { NextRequest, NextResponse } from 'next/server'
import { getPool, createOrder } from '@/lib/db/index'
import Stripe from 'stripe'
import { sendOrderConfirmationEmail } from '@/lib/email'
import { normalizePurchaseMode } from '@/lib/purchase-mode'
import { calculateShipping } from '@/lib/shipping/calculator'
import { createPayPalOrder, getPayPalApprovalUrl } from '@/lib/paypal'

const ALLOWED_CURRENCIES = new Set(['USD', 'HKD', 'EUR', 'GBP', 'CAD', 'CNY'])

function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY
  if (!key || key.includes('placeholder')) return null
  return new Stripe(key, { apiVersion: '2026-02-25.clover' })
}

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

function normalizeCurrency(currency?: string): string {
  const normalized = currency?.toUpperCase() || 'USD'
  return ALLOWED_CURRENCIES.has(normalized) ? normalized : 'USD'
}

function getBasePrice(pricing: unknown): number | null {
  if (!pricing || typeof pricing !== 'object') return null

  const rawPrice = (pricing as { basePrice?: unknown }).basePrice
  if (typeof rawPrice === 'number' && Number.isFinite(rawPrice) && rawPrice > 0) {
    return rawPrice
  }

  if (typeof rawPrice === 'string') {
    const parsed = Number(rawPrice)
    if (Number.isFinite(parsed) && parsed > 0) {
      return parsed
    }
  }

  return null
}

function toMinorUnits(amount: number): number {
  return Math.round(amount * 100)
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
          currency TEXT NOT NULL DEFAULT 'USD',
          shipping_address JSONB,
          billing_address JSONB,
          items JSONB,
          notes TEXT,
          payment_info JSONB DEFAULT '{}'::jsonb,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        )
      `)
      await pool.query(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS currency TEXT NOT NULL DEFAULT 'USD'`)
      await pool.query(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_info JSONB DEFAULT '{}'::jsonb`)
      await pool.query(`ALTER TABLE orders ALTER COLUMN payment_info SET DEFAULT '{}'::jsonb`)
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

    const orderCurrency = body.paymentMethod === 'bank-transfer'
      ? normalizeCurrency(body.currency)
      : 'USD'

    // Recalculate totals server-side using catalog pricing, never client cart values
    const requestedProductIds = [...new Set(body.items.map(item => item.product).filter(Boolean))]
    const requestedSkus = [...new Set(body.items.map(item => item.sku).filter(Boolean))]
    const productResult = await pool.query(
      `SELECT id::text AS id, name, sku, pricing, purchase_mode
       FROM products
       WHERE status = 'published'
         AND (id::text = ANY($1::text[]) OR sku = ANY($2::text[]))`,
      [requestedProductIds, requestedSkus]
    )

    const productById = new Map(productResult.rows.map(row => [row.id as string, row]))
    const productBySku = new Map(productResult.rows.map(row => [row.sku as string, row]))
    const validatedItems: Array<{
      productId: string
      productName: string
      sku: string
      quantity: number
      unitPrice: number
      lineTotal: number
    }> = []

    let subtotal = 0
    for (const item of body.items) {
      if (!Number.isInteger(item.quantity) || item.quantity < 1) {
        return NextResponse.json({ error: `Invalid quantity for item ${item.sku || item.product}` }, { status: 400 })
      }

      const product = productById.get(item.product) || productBySku.get(item.sku)
      if (!product) {
        return NextResponse.json({ error: `Product not found: ${item.sku || item.product}` }, { status: 400 })
      }

      if (normalizePurchaseMode(product.purchase_mode) === 'rfq-only') {
        return NextResponse.json({ error: `Product ${product.sku} is quote-only and cannot be checked out online` }, { status: 400 })
      }

      const unitPrice = getBasePrice(product.pricing)
      if (unitPrice === null) {
        return NextResponse.json({ error: `Product ${product.sku} does not have a valid sell price` }, { status: 400 })
      }

      const lineTotal = Math.round(unitPrice * item.quantity * 100) / 100
      subtotal += lineTotal
      validatedItems.push({
        productId: product.id as string,
        productName: product.name as string,
        sku: product.sku as string,
        quantity: item.quantity,
        unitPrice,
        lineTotal,
      })
    }

    subtotal = Math.round(subtotal * 100) / 100

    // Server-side shipping calculation
    let shippingCost = 0
    let shippingMethodCode = ''
    let shippingMethodName = ''
    let estimatedShipDate = ''
    let estimatedDeliveryDate = ''
    let totalWeight = 0

    if (body.shippingMethodCode) {
      const shippingItems = validatedItems.map(item => ({
        productId: item.productId,
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

    shippingCost = Math.round(shippingCost * 100) / 100
    const total = Math.round((subtotal + shippingCost) * 100) / 100

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
        currency: orderCurrency,
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
        items: validatedItems.map(item => ({
          productId: item.productId,
          productName: item.productName,
          sku: item.sku,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          lineTotal: item.lineTotal,
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
      // Check if table exists
      try {
        const tableCheck = await pool.query(`
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'orders'
          )
        `)
        const tableExists = tableCheck.rows[0]?.exists
        console.error('Orders table exists:', tableExists)
        if (!tableExists) {
          return NextResponse.json({ 
            error: 'Database table "orders" does not exist. Please create it first.',
            tableExists: false
          }, { status: 500 })
        }
      } catch (checkError) {
        console.error('Error checking table existence:', checkError)
      }
      return NextResponse.json({ error: 'Failed to create order in database' }, { status: 500 })
    }

    const paymentInfoUpdate: Record<string, unknown> = {
      method: body.paymentMethod,
    }
    let stripeUrl: string | undefined
    let stripeClientSecret: string | undefined
    let stripePaymentIntentId: string | undefined
    let approvalUrl: string | undefined

    if (body.paymentMethod === 'stripe') {
      const stripe = getStripe()
      if (!stripe) {
        try {
          await pool.query(`DELETE FROM orders WHERE id = $1`, [order.id])
        } catch (cleanupError) {
          console.error('Failed to clean up order after Stripe config error:', cleanupError)
        }
        return NextResponse.json({ error: 'Online payment is not configured' }, { status: 500 })
      }

      try {
        const paymentIntent = await stripe.paymentIntents.create({
          amount: toMinorUnits(total),
          currency: orderCurrency.toLowerCase(),
          automatic_payment_methods: { enabled: true },
          metadata: {
            orderNumber,
            orderId: order.id,
          },
          receipt_email: body.customer.email,
        })

        if (!paymentIntent.client_secret) {
          throw new Error('Stripe did not return a client secret')
        }

        stripeClientSecret = paymentIntent.client_secret
        stripePaymentIntentId = paymentIntent.id
        paymentInfoUpdate.stripePaymentIntentId = paymentIntent.id

        const serverUrl = process.env.NEXT_PUBLIC_SERVER_URL || 'https://machrio.com'

        try {
          const session = await stripe.checkout.sessions.create({
            mode: 'payment',
            customer_email: body.customer.email,
            metadata: {
              orderNumber,
              orderId: order.id,
            },
            line_items: validatedItems.map(item => ({
              price_data: {
                currency: orderCurrency.toLowerCase(),
                product_data: {
                  name: item.productName,
                  description: `SKU: ${item.sku}`,
                },
                unit_amount: toMinorUnits(item.unitPrice),
              },
              quantity: item.quantity,
            })).concat(
              shippingCost > 0
                ? [{
                    price_data: {
                      currency: orderCurrency.toLowerCase(),
                      product_data: {
                        name: 'Shipping',
                        description: shippingMethodName || 'Shipping fee',
                      },
                      unit_amount: toMinorUnits(shippingCost),
                    },
                    quantity: 1,
                  }]
                : []
            ),
            success_url: `${serverUrl}/order/${orderNumber}?payment=success&provider=stripe`,
            cancel_url: `${serverUrl}/order/${orderNumber}?payment=cancelled&provider=stripe`,
          })

          stripeUrl = session.url || undefined
          if (session.id) {
            paymentInfoUpdate.stripeSessionId = session.id
          }
        } catch (sessionError) {
          console.error('Stripe Checkout fallback initialization error:', sessionError)
        }
      } catch (stripeError) {
        try {
          await pool.query(`DELETE FROM orders WHERE id = $1`, [order.id])
        } catch (cleanupError) {
          console.error('Failed to clean up order after Stripe init error:', cleanupError)
        }
        const errorMessage = stripeError instanceof Error ? stripeError.message : 'Failed to initialize Stripe payment'
        return NextResponse.json({ error: errorMessage }, { status: 502 })
      }
    } else if (body.paymentMethod === 'paypal') {
      try {
        const paypalOrder = await createPayPalOrder({
          orderNumber,
          orderId: order.id,
          items: validatedItems.map(item => ({
            name: item.productName,
            sku: item.sku,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
          })),
          subtotal,
          shippingCost,
          total,
          currency: orderCurrency,
          customerEmail: body.customer.email,
        })

        approvalUrl = getPayPalApprovalUrl(paypalOrder) || undefined
        if (!approvalUrl) {
          throw new Error('Failed to get PayPal approval URL')
        }

        paymentInfoUpdate.paypalOrderId = paypalOrder.id
      } catch (paypalError) {
        try {
          await pool.query(`DELETE FROM orders WHERE id = $1`, [order.id])
        } catch (cleanupError) {
          console.error('Failed to clean up order after PayPal init error:', cleanupError)
        }
        const errorMessage = paypalError instanceof Error ? paypalError.message : 'Failed to initialize PayPal payment'
        return NextResponse.json({ error: errorMessage }, { status: 502 })
      }
    }

    await pool.query(
      `UPDATE orders
       SET payment_info = COALESCE(payment_info, '{}'::jsonb) || $1::jsonb
       WHERE id = $2`,
      [JSON.stringify(paymentInfoUpdate), order.id]
    )

    // Send confirmation emails only after payment initialization succeeds
    sendOrderConfirmationEmail({
      orderNumber,
      customerName: body.customer.name,
      customerEmail: body.customer.email,
      company: body.customer.company,
      total,
      currency: orderCurrency,
      paymentMethod: body.paymentMethod,
      itemCount: validatedItems.length,
    }).catch(err => console.error('Email send error:', err))

    return NextResponse.json({
      orderNumber,
      orderId: order.id,
      total,
      currency: orderCurrency,
      stripeUrl,
      stripeClientSecret,
      stripePaymentIntentId,
      approvalUrl,
    })
  } catch (err) {
    console.error('Order creation error:', err)
    const errorMessage = err instanceof Error ? err.message : String(err)
    const errorStack = err instanceof Error ? err.stack : 'No stack'
    console.error('Full error details:', {
      message: errorMessage,
      stack: errorStack,
      cause: err instanceof Error && err.cause ? err.cause : 'No cause',
    })
    return NextResponse.json(
      { 
        error: 'Failed to create order',
        details: errorMessage,
      },
      { status: 500 }
    )
  }
}
