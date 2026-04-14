/**
 * PayPal API integration utilities
 */

// PayPal API base URL (use sandbox for testing, live for production)
const PAYPAL_API_BASE = process.env.NODE_ENV === 'production'
  ? 'https://api-m.paypal.com'
  : 'https://api-m.sandbox.paypal.com'

interface PayPalAccessTokenResponse {
  access_token: string
  token_type: string
  expires_in: number
}

interface PayPalOrderResponse {
  id: string
  status: string
  purchase_units: Array<{
    reference_id?: string
    custom_id?: string
    amount?: {
      currency_code: string
      value: string
    }
  }>
  links: Array<{
    href: string
    rel: string
    method: string
  }>
}

/**
 * Get PayPal access token using client credentials
 */
export async function getPayPalAccessToken(): Promise<string> {
  const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET

  if (!clientId || !clientSecret) {
    throw new Error('PayPal credentials not configured')
  }

  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64')

  const response = await fetch(`${PAYPAL_API_BASE}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Failed to get PayPal access token: ${error}`)
  }

  const data: PayPalAccessTokenResponse = await response.json()
  return data.access_token
}

interface CreatePayPalOrderParams {
  orderNumber: string
  orderId: string
  items: Array<{
    name: string
    sku: string
    quantity: number
    unitPrice: number
  }>
  subtotal: number
  shippingCost: number
  total: number
  currency?: string
  customerEmail: string
}

/**
 * Create a PayPal order
 */
export async function createPayPalOrder(params: CreatePayPalOrderParams): Promise<PayPalOrderResponse> {
  const accessToken = await getPayPalAccessToken()
  const serverUrl = process.env.NEXT_PUBLIC_SERVER_URL || 'https://machrio.com'

  const orderData = {
    intent: 'CAPTURE',
    purchase_units: [
      {
        reference_id: params.orderNumber,
        description: `Order ${params.orderNumber}`,
        custom_id: params.orderId,
        items: params.items.map(item => ({
          name: item.name.substring(0, 127), // PayPal max 127 chars
          sku: item.sku,
          quantity: item.quantity.toString(),
          unit_amount: {
            currency_code: (params.currency || 'USD'),
            value: item.unitPrice.toFixed(2),
          },
        })),
        amount: {
          currency_code: (params.currency || 'USD'),
          value: params.total.toFixed(2),
          breakdown: {
            item_total: {
              currency_code: (params.currency || 'USD'),
              value: params.subtotal.toFixed(2),
            },
            shipping: {
              currency_code: (params.currency || 'USD'),
              value: params.shippingCost.toFixed(2),
            },
          },
        },
      },
    ],
    payer: {
      email_address: params.customerEmail,
    },
    application_context: {
      brand_name: 'Machrio',
      landing_page: 'BILLING',
      user_action: 'PAY_NOW',
      return_url: `${serverUrl}/order/${params.orderNumber}?payment=success&provider=paypal`,
      cancel_url: `${serverUrl}/order/${params.orderNumber}?payment=cancelled`,
    },
  }

  const response = await fetch(`${PAYPAL_API_BASE}/v2/checkout/orders`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(orderData),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Failed to create PayPal order: ${error}`)
  }

  return response.json()
}

interface CapturePayPalOrderResponse {
  id: string
  status: string
  purchase_units: Array<{
    reference_id?: string
    custom_id?: string
    payments: {
      captures: Array<{
        id: string
        status: string
        amount: {
          currency_code: string
          value: string
        }
      }>
    }
  }>
}

/**
 * Capture a PayPal order (complete the payment)
 */
export async function capturePayPalOrder(orderId: string): Promise<CapturePayPalOrderResponse> {
  const accessToken = await getPayPalAccessToken()

  const response = await fetch(`${PAYPAL_API_BASE}/v2/checkout/orders/${orderId}/capture`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Failed to capture PayPal order: ${error}`)
  }

  return response.json()
}

/**
 * Get PayPal order details
 */
export async function getPayPalOrder(orderId: string): Promise<PayPalOrderResponse> {
  const accessToken = await getPayPalAccessToken()

  const response = await fetch(`${PAYPAL_API_BASE}/v2/checkout/orders/${orderId}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Failed to get PayPal order: ${error}`)
  }

  return response.json()
}

/**
 * Get the approval URL from PayPal order response
 */
export function getPayPalApprovalUrl(order: PayPalOrderResponse): string | null {
  const link = order.links.find(l => l.rel === 'approve')
  return link?.href || null
}
