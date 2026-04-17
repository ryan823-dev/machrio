import { NextRequest, NextResponse } from 'next/server'
import { getPool, createOrder } from '@/lib/db/index'
import Stripe from 'stripe'
import { sendOrderConfirmationEmail } from '@/lib/email'
import { getAccountSessionFromRequest } from '@/lib/account-session'
import {
  type BillingInfoInput,
  type ShippingAddressInput,
  syncCustomerLinksByEmail,
  syncCheckoutCustomerData,
} from '@/lib/customer-service'
import { normalizePurchaseMode } from '@/lib/purchase-mode'
import { recordOrderEvent } from '@/lib/order-events'
import { parsePricing } from '@/lib/pricing'
import { calculateShipping } from '@/lib/shipping/calculator'
import { createPayPalOrder, getPayPalApprovalUrl, isPayPalConfigured } from '@/lib/paypal'
import {
  attachPartnerAttributionToOrder,
  ensurePartnerProgramTables,
} from '@/lib/partner-program'
import {
  issueOrderAccessLinks,
  revokeOrderAccessTokensForOrder,
} from '@/lib/order-access'
import { appendQueryParamsToPath, toAbsoluteUrl } from '@/lib/order-access-links'

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
  billing?: {
    companyLegalName?: string
    taxId?: string
    billingAddress?: string
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

interface ValidatedOrderItem {
  productId: string
  productName: string
  sku: string
  quantity: number
  unitPrice: number
  lineTotal: number
}

function normalizeCurrency(currency?: string): string {
  const normalized = currency?.toUpperCase() || 'USD'
  return ALLOWED_CURRENCIES.has(normalized) ? normalized : 'USD'
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

function normalizeText(value?: string | null): string {
  return value?.trim() || ''
}

function sanitizeBillingInfo(
  billing?: OrderRequest['billing'],
): BillingInfoInput {
  return {
    companyLegalName: normalizeText(billing?.companyLegalName),
    taxId: normalizeText(billing?.taxId),
    billingAddress: normalizeText(billing?.billingAddress),
  }
}

function buildStoredBillingAddress(billingInfo: BillingInfoInput): Record<string, string> {
  const storedBillingInfo = Object.entries(billingInfo).filter(([, value]) => Boolean(value))
  return Object.fromEntries(storedBillingInfo) as Record<string, string>
}

function getBasePrice(pricing: unknown): number | null {
  const parsedPricing = parsePricing(pricing)
  if (typeof parsedPricing?.basePrice === 'number' && parsedPricing.basePrice > 0) {
    return parsedPricing.basePrice
  }

  const firstTierPrice = parsedPricing?.tieredPricing?.[0]?.unitPrice
  return typeof firstTierPrice === 'number' && firstTierPrice > 0 ? firstTierPrice : null
}

function toMinorUnits(amount: number): number {
  return Math.round(amount * 100)
}

function schedulePostOrderTasks(input: {
  headers: Headers
  orderId: string
  orderNumber: string
  orderCreatedAt?: string | Date | null
  normalizedCustomerEmail: string
  customerName: string
  customerCompany: string
  customerPhone?: string
  paymentMethod: OrderRequest['paymentMethod']
  total: number
  currency: string
  validatedItems: ValidatedOrderItem[]
  shippingAddress: ShippingAddressInput
  billingInfo: BillingInfoInput
  isAuthenticatedCustomer: boolean
  subtotal: number
  orderAccessToken?: string
}) {
  const requestHeaders = new Headers(input.headers)

  queueMicrotask(() => {
    void (async () => {
      try {
        await recordOrderEvent({
          orderNumber: input.orderNumber,
          orderId: input.orderId,
          type: 'order.created',
          data: {
            paymentMethod: input.paymentMethod,
            total: input.total,
            currency: input.currency,
          },
          createdAt: input.orderCreatedAt,
          oncePerOrder: true,
        })

        await recordOrderEvent({
          orderNumber: input.orderNumber,
          orderId: input.orderId,
          type: 'payment.pending',
          data: {
            paymentMethod: input.paymentMethod,
            source: 'initial-checkout',
          },
          createdAt: input.orderCreatedAt,
        })
      } catch (orderEventError) {
        console.error('Failed to record order creation timeline events:', orderEventError)
      }

      try {
        await syncCheckoutCustomerData({
          email: input.normalizedCustomerEmail,
          name: input.customerName,
          company: input.customerCompany,
          phone: input.customerPhone,
          source: 'direct',
          shippingAddress: input.shippingAddress,
          billingInfo: input.billingInfo,
        })
      } catch (checkoutCustomerSyncError) {
        console.error('Failed to sync checkout customer data after order creation:', checkoutCustomerSyncError)
      }

      try {
        await syncCustomerLinksByEmail(input.normalizedCustomerEmail, {
          markAccountLinked: input.isAuthenticatedCustomer,
        })
      } catch (customerLinkError) {
        console.error('Failed to sync customer links after order creation:', customerLinkError)
      }

      try {
        await attachPartnerAttributionToOrder({
          headers: requestHeaders,
          orderId: input.orderId,
          orderNumber: input.orderNumber,
          subtotal: input.subtotal,
          currency: input.currency,
          orderStatus: 'pending',
          paymentStatus: 'unpaid',
        })
      } catch (partnerAttributionError) {
        console.error('Failed to attach partner attribution after order creation:', partnerAttributionError)
      }

      sendOrderConfirmationEmail({
        orderNumber: input.orderNumber,
        customerName: input.customerName,
        customerEmail: input.normalizedCustomerEmail,
        company: input.customerCompany,
        total: input.total,
        currency: input.currency,
        paymentMethod: input.paymentMethod,
        itemCount: input.validatedItems.length,
        orderAccessToken: input.orderAccessToken,
      }).catch((emailError) => console.error('Email send error:', emailError))
    })().catch((postOrderTaskError) => {
      console.error('Unexpected post-order task failure:', postOrderTaskError)
    })
  })
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
      await ensurePartnerProgramTables()
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

    const normalizedCustomerEmail = normalizeEmail(body.customer.email)
    const shippingAddress: ShippingAddressInput = {
      address: normalizeText(body.shipping.address),
      city: normalizeText(body.shipping.city),
      state: normalizeText(body.shipping.state),
      postalCode: normalizeText(body.shipping.postalCode),
      country: normalizeText(body.shipping.country) || 'US',
      label: 'Checkout Shipping',
    }
    const billingInfo = sanitizeBillingInfo(body.billing)
    const session = await getAccountSessionFromRequest(req).catch((sessionError) => {
      console.error('Failed to read checkout account session:', sessionError)
      return null
    })
    const isAuthenticatedCustomer = Boolean(
      session && normalizeEmail(session.email) === normalizedCustomerEmail,
    )

    if (body.paymentMethod === 'paypal' && !isPayPalConfigured()) {
      return NextResponse.json(
        { error: 'PayPal is not configured for this environment' },
        { status: 503 },
      )
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
    const validatedItems: ValidatedOrderItem[] = []

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

    if (!body.shippingMethodCode) {
      return NextResponse.json(
        { error: 'A live shipping method must be selected before placing the order' },
        { status: 400 },
      )
    }

    const shippingItems = validatedItems.map(item => ({
      productId: item.productId,
      quantity: item.quantity,
    }))
    const country = shippingAddress.country || 'US'
    const calcResult = await calculateShipping(shippingItems, country, subtotal)

    if (!calcResult.success || calcResult.methods.length === 0) {
      return NextResponse.json(
        { error: calcResult.error || 'No live shipping rates are configured for the selected destination' },
        { status: 409 },
      )
    }

    const selectedMethod = calcResult.methods.find(m => m.code === body.shippingMethodCode)
    if (!selectedMethod) {
      return NextResponse.json(
        { error: 'The selected shipping method is no longer available. Please refresh checkout and try again.' },
        { status: 409 },
      )
    }

    shippingCost = selectedMethod.cost
    shippingMethodCode = selectedMethod.code
    shippingMethodName = selectedMethod.name
    estimatedShipDate = calcResult.estimatedShipDate
    estimatedDeliveryDate = selectedMethod.estimatedDeliveryDate
    totalWeight = calcResult.totalWeight

    shippingCost = Math.round(shippingCost * 100) / 100
    const total = Math.round((subtotal + shippingCost) * 100) / 100

    // Generate order number
    const orderNumber = `MCH-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`

    // Create order in database
    let order
    try {
      order = await createOrder({
        orderNumber,
        customerEmail: normalizedCustomerEmail,
        customerName: body.customer.name,
        customerPhone: body.customer.phone,
        customerCompany: body.customer.company,
        ownershipStatus: isAuthenticatedCustomer ? 'linked' : 'guest',
        guestEmail: isAuthenticatedCustomer ? undefined : normalizedCustomerEmail,
        claimedAt: isAuthenticatedCustomer ? new Date().toISOString() : undefined,
        placedByType: isAuthenticatedCustomer ? 'account' : 'guest',
        status: 'pending',
        paymentStatus: 'unpaid',
        paymentMethod: body.paymentMethod,
        subtotal,
        shippingCost,
        tax: 0,
        total,
        currency: orderCurrency,
        shippingAddress: {
          ...shippingAddress,
          shippingMethodCode,
          shippingMethodName,
          estimatedShipDate,
          estimatedDeliveryDate,
          totalWeight,
        },
        billingAddress: buildStoredBillingAddress(billingInfo),
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
    const serverUrl = process.env.NEXT_PUBLIC_SERVER_URL || 'https://machrio.com'
    const orderAccess = await issueOrderAccessLinks({
      orderNumber,
      email: normalizedCustomerEmail,
      baseUrl: serverUrl,
    })
    let stripeUrl: string | undefined
    let stripeClientSecret: string | undefined
    let stripePaymentIntentId: string | undefined
    let approvalUrl: string | undefined

    if (body.paymentMethod === 'stripe') {
      const stripe = getStripe()
      if (!stripe) {
        try {
          await pool.query(`DELETE FROM orders WHERE id = $1`, [order.id])
          await revokeOrderAccessTokensForOrder(orderNumber)
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
          receipt_email: normalizedCustomerEmail,
        })

        if (!paymentIntent.client_secret) {
          throw new Error('Stripe did not return a client secret')
        }

        stripeClientSecret = paymentIntent.client_secret
        stripePaymentIntentId = paymentIntent.id
        paymentInfoUpdate.stripePaymentIntentId = paymentIntent.id

        try {
          const session = await stripe.checkout.sessions.create({
            mode: 'payment',
            customer_email: normalizedCustomerEmail,
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
            success_url: toAbsoluteUrl(
              appendQueryParamsToPath(orderAccess.orderPath, {
                payment: 'success',
                provider: 'stripe',
              }),
              serverUrl,
            ),
            cancel_url: toAbsoluteUrl(
              appendQueryParamsToPath(orderAccess.orderPath, {
                payment: 'cancelled',
                provider: 'stripe',
              }),
              serverUrl,
            ),
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
          await revokeOrderAccessTokensForOrder(orderNumber)
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
          customerEmail: normalizedCustomerEmail,
          returnUrl: toAbsoluteUrl(
            appendQueryParamsToPath(orderAccess.orderPath, {
              payment: 'success',
              provider: 'paypal',
            }),
            serverUrl,
          ),
          cancelUrl: toAbsoluteUrl(
            appendQueryParamsToPath(orderAccess.orderPath, {
              payment: 'cancelled',
              provider: 'paypal',
            }),
            serverUrl,
          ),
        })

        approvalUrl = getPayPalApprovalUrl(paypalOrder) || undefined
        if (!approvalUrl) {
          throw new Error('Failed to get PayPal approval URL')
        }

        paymentInfoUpdate.paypalOrderId = paypalOrder.id
      } catch (paypalError) {
        try {
          await pool.query(`DELETE FROM orders WHERE id = $1`, [order.id])
          await revokeOrderAccessTokensForOrder(orderNumber)
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

    schedulePostOrderTasks({
      headers: req.headers,
      orderId: order.id,
      orderNumber,
      orderCreatedAt: order.created_at,
      normalizedCustomerEmail,
      customerName: body.customer.name,
      customerCompany: body.customer.company,
      customerPhone: body.customer.phone,
      paymentMethod: body.paymentMethod,
      total,
      currency: orderCurrency,
      validatedItems,
      shippingAddress,
      billingInfo,
      isAuthenticatedCustomer,
      subtotal,
      orderAccessToken: orderAccess.accessToken,
    })

    return NextResponse.json({
      orderNumber,
      orderId: order.id,
      total,
      currency: orderCurrency,
      orderPath: orderAccess.orderPath,
      invoicePath: orderAccess.invoicePath,
      orderAccessToken: orderAccess.accessToken,
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
