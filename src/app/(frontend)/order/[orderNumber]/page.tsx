import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { getOrderByNumber } from '@/lib/db'
import { getOrderEventDescription, getOrderEventTitle, listOrderEvents } from '@/lib/order-events'
import { authorizeOrderAccess, createOrderAccessToken } from '@/lib/order-access'
import { appendQueryParamsToPath, buildInvoicePath, buildOrderPath } from '@/lib/order-access-links'
import { getBankTransferReference, getBankTransferSubmission } from '@/lib/bank-transfer'
import { isPayPalConfigured } from '@/lib/paypal'
import { OrderPaymentFailureReporter } from '@/components/order/OrderPaymentFailureReporter'
import { PayPalCaptureHandler } from '@/components/payment/PayPalCaptureHandler'
import { StripeReturnHandler } from '@/components/payment/StripeReturnHandler'
import { OrderAccessRequired } from '@/components/order/OrderAccessRequired'
import { OrderPaymentRetry } from '@/components/order/OrderPaymentRetry'
import { PaymentReceiptUpload } from '@/components/order/PaymentReceiptUpload'

export const dynamic = 'force-dynamic'

function isStripeConfigured() {
  const key = process.env.STRIPE_SECRET_KEY
  return Boolean(key && !key.includes('placeholder'))
}

interface OrderPageProps {
  params: Promise<{ orderNumber: string }>
  searchParams: Promise<{
    payment?: string | string[]
    access?: string | string[]
    provider?: string | string[]
    token?: string | string[]
    PayerID?: string | string[]
  }>
}

function toDisplayAmount(value: unknown): number {
  const numericValue = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(numericValue) ? numericValue : 0
}

function getQueryValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value
}

function getStoredPayPalOrderId(order: NonNullable<Awaited<ReturnType<typeof getOrderByNumber>>>) {
  const paymentInfo = (order.payment_info || {}) as {
    paypalOrderId?: string
    paypal?: {
      paypalOrderId?: string
    }
  }

  return paymentInfo.paypal?.paypalOrderId || paymentInfo.paypalOrderId
}

export default async function OrderConfirmationPage({ params, searchParams }: OrderPageProps) {
  const { orderNumber } = await params
  const { payment, access, provider, token, PayerID } = await searchParams
  const order = await getOrderByNumber(orderNumber)
  if (!order) notFound()
  const canonicalOrderNumber = order.order_number

  let accessToken = getQueryValue(access)
  const paymentState = getQueryValue(payment)
  const paymentProvider = getQueryValue(provider)
  const paypalReturnToken = getQueryValue(token)
  const payerId = getQueryValue(PayerID)

  const accessResult = await authorizeOrderAccess({
    order,
    accessToken,
  })

  if (!accessResult && paymentProvider === 'paypal' && paypalReturnToken) {
    const storedPayPalOrderId = getStoredPayPalOrderId(order)

    if (storedPayPalOrderId === paypalReturnToken && order.customer_email) {
      accessToken = (await createOrderAccessToken({
        orderNumber: canonicalOrderNumber,
        email: order.customer_email,
      })).token

      redirect(buildOrderPath(canonicalOrderNumber, accessToken, {
        payment: paymentState,
        provider: paymentProvider,
        token: paypalReturnToken,
        PayerID: payerId,
      }))
    }
  }

  if (!accessResult) {
    return <OrderAccessRequired orderNumber={canonicalOrderNumber} />
  }

  const orderPath = buildOrderPath(canonicalOrderNumber, accessResult.via === 'token' ? accessToken : undefined)
  const invoicePath = buildInvoicePath(canonicalOrderNumber, accessResult.via === 'token' ? accessToken : undefined)
  const stripeCancelCartPath = appendQueryParamsToPath('/cart', {
    payment: 'cancelled',
    provider: 'stripe',
    order: canonicalOrderNumber,
  })
  const orderEvents = await listOrderEvents(canonicalOrderNumber)

  const customer = {
    name: order.customer_name,
    email: order.customer_email,
    phone: order.customer_phone || '',
    company: order.customer_company,
  }
  const shipping = order.shipping_address as Record<string, unknown> || {}
  const paymentInfo = (order.payment_info || {}) as {
    method?: string
    paypal?: unknown
    stripe?: unknown
    bankTransferSubmission?: unknown
  }
  const items = (order.items as Record<string, unknown>[]) || []
  const subtotalAmount = toDisplayAmount(order.subtotal)
  const shippingAmount = toDisplayAmount(order.shipping_cost)
  const totalAmount = toDisplayAmount(order.total)
  const paymentMethod = order.payment_method
    || paymentInfo.method
    || (paymentInfo.paypal ? 'paypal' : paymentInfo.stripe ? 'stripe' : 'bank-transfer')
  const currency = order.currency || 'USD'
  const stripeAvailable = isStripeConfigured()
  const paypalAvailable = isPayPalConfigured()
  const isBankTransfer = paymentMethod === 'bank-transfer'
  const isPaid = order.payment_status === 'paid'
  const bankTransferSubmission = isBankTransfer
    ? getBankTransferSubmission(paymentInfo, canonicalOrderNumber)
    : null
  const awaitingBankTransferVerification = Boolean(
    isBankTransfer
    && !isPaid
    && bankTransferSubmission?.status === 'submitted',
  )
  const retryPaymentMethod = paymentMethod === 'stripe' || paymentMethod === 'paypal'
    ? paymentMethod
    : null
  const availablePaymentMethods = [
    stripeAvailable ? 'stripe' : null,
    paypalAvailable ? 'paypal' : null,
    'bank-transfer',
  ].filter(Boolean) as Array<'stripe' | 'paypal' | 'bank-transfer'>
  const canManageUnpaidPayment = !isPaid
    && Boolean(retryPaymentMethod)
    && availablePaymentMethods.length > 0
  const paymentSuccess = paymentState === 'success'
  const paymentMethodLabel = paymentMethod === 'paypal'
    ? 'PayPal'
    : isBankTransfer
      ? 'Bank Transfer'
      : 'Stripe (Online)'
  const bankTransferReference = getBankTransferReference(canonicalOrderNumber)
  const paymentStatusLabel = isPaid
    ? 'Paid'
    : awaitingBankTransferVerification
      ? 'Awaiting Verification'
      : 'Awaiting Payment'

  return (
    <div className="container-main py-8">
      {/* PayPal Capture Handler */}
      <PayPalCaptureHandler orderNumber={canonicalOrderNumber} accessToken={accessResult.via === 'token' ? accessToken : undefined} />
      <OrderPaymentFailureReporter orderNumber={canonicalOrderNumber} accessToken={accessResult.via === 'token' ? accessToken : undefined} />
      <StripeReturnHandler orderPath={orderPath} cancelPath={stripeCancelCartPath} />
      
      {/* Status banner */}
      {paymentSuccess && paymentMethod !== 'paypal' && (
        <div className="mb-6 rounded-lg bg-green-50 border border-green-200 p-4">
          <div className="flex items-center gap-2">
            <svg className="h-5 w-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span className="font-semibold text-green-800">Payment successful!</span>
          </div>
          <p className="mt-1 text-sm text-green-700">Your payment has been processed. We will begin processing your order shortly.</p>
        </div>
      )}

      {paymentState === 'cancelled' && (
        <div className="mb-6 rounded-lg bg-amber-50 border border-amber-200 p-4">
          <div className="flex items-center gap-2">
            <svg className="h-5 w-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <span className="font-semibold text-amber-800">Payment was not completed</span>
          </div>
          <p className="mt-1 text-sm text-amber-700">Your order has been created but payment was not completed. You can still pay later or contact us.</p>
        </div>
      )}

      {paymentState === 'processing' && (
        <div className="mb-6 rounded-lg bg-blue-50 border border-blue-200 p-4">
          <div className="flex items-center gap-2">
            <svg className="h-5 w-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <span className="font-semibold text-blue-800">Payment is processing</span>
          </div>
          <p className="mt-1 text-sm text-blue-700">We&apos;re waiting for Stripe to finish confirming your payment. This page will reflect the final status shortly.</p>
        </div>
      )}

      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-secondary-900">Order Confirmation</h1>
          <p className="mt-1 text-secondary-500">
            Order <span className="font-mono font-semibold text-secondary-800">{canonicalOrderNumber}</span>
          </p>
        </div>
        <div className="flex gap-2">
          <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${
            order.status === 'confirmed' || order.status === 'processing' ? 'bg-blue-100 text-blue-800' :
            order.status === 'shipped' || order.status === 'delivered' ? 'bg-green-100 text-green-800' :
            order.status === 'cancelled' ? 'bg-red-100 text-red-800' :
            'bg-secondary-100 text-secondary-800'
          }`}>
            {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
          </span>
          <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${
            isPaid
              ? 'bg-green-100 text-green-800'
              : awaitingBankTransferVerification
                ? 'bg-blue-100 text-blue-800'
                : 'bg-amber-100 text-amber-800'
          }`}>
            {paymentStatusLabel}
          </span>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        {/* Order details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Items */}
          <section className="rounded-lg border border-secondary-200 bg-white p-6">
            <h2 className="text-lg font-bold text-secondary-900">Order Items</h2>
            <div className="mt-4 divide-y divide-secondary-100">
              {items.map((item, i) => (
                <div key={i} className="flex justify-between py-3 text-sm">
                  <div>
                    <p className="font-medium text-secondary-800">{item.productName as string}</p>
                    <p className="text-xs text-secondary-500">SKU: {item.sku as string} | Qty: {item.quantity as number}</p>
                  </div>
                  <span className="font-semibold text-secondary-800">${toDisplayAmount(item.lineTotal).toFixed(2)}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 border-t border-secondary-200 pt-4 space-y-1 text-sm">
              <div className="flex justify-between text-secondary-600">
                <span>Subtotal</span>
                <span>${subtotalAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-secondary-600">
                <span>Shipping</span>
                <span>{shippingAmount === 0 ? 'FREE' : `$${shippingAmount.toFixed(2)}`}</span>
              </div>
              <div className="flex justify-between font-bold text-secondary-900 pt-1 border-t border-secondary-100">
                <span>Total</span>
                <span>${totalAmount.toFixed(2)} {currency}</span>
              </div>
            </div>
          </section>

          {/* Shipping */}
          <section className="rounded-lg border border-secondary-200 bg-white p-6">
            <h2 className="text-lg font-bold text-secondary-900">Shipping Address</h2>
            <div className="mt-3 text-sm text-secondary-600">
              <p>{customer.name}</p>
              <p>{customer.company}</p>
              <p>{shipping.address as string}</p>
              <p>{shipping.city as string}, {shipping.state as string} {shipping.postalCode as string}</p>
              <p>{shipping.country as string}</p>
            </div>
          </section>

          <section className="rounded-lg border border-secondary-200 bg-white p-6">
            <h2 className="text-lg font-bold text-secondary-900">Order Timeline</h2>
            {orderEvents.length === 0 ? (
              <p className="mt-3 text-sm text-secondary-500">
                Timeline updates will appear here as payment and fulfillment events happen.
              </p>
            ) : (
              <div className="mt-4 space-y-4">
                {orderEvents.map((event, index) => (
                  <div key={event.id} className="relative pl-6">
                    <span className="absolute left-0 top-1.5 h-2.5 w-2.5 rounded-full bg-primary-600" />
                    {index < orderEvents.length - 1 && (
                      <span className="absolute left-[4px] top-4 h-[calc(100%+0.75rem)] w-px bg-secondary-200" />
                    )}
                    <div className="flex flex-col gap-1">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="text-sm font-semibold text-secondary-900">
                          {getOrderEventTitle(event.event_type)}
                        </p>
                        <p className="text-xs text-secondary-500">
                          {new Date(event.created_at).toLocaleString('en-US', {
                            dateStyle: 'medium',
                            timeStyle: 'short',
                          })}
                        </p>
                      </div>
                      <p className="text-sm text-secondary-600">
                        {getOrderEventDescription(event)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          {/* Payment info */}
          <section className="rounded-lg border border-secondary-200 bg-white p-6">
            <h2 className="text-lg font-bold text-secondary-900">Payment</h2>
            <p className="mt-2 text-sm text-secondary-600">
              Method: <span className="font-medium">{paymentMethodLabel}</span>
            </p>
            <p className="mt-1 text-sm text-secondary-600">
              Status: <span className={`font-medium ${
                isPaid
                  ? 'text-green-700'
                  : awaitingBankTransferVerification
                    ? 'text-blue-700'
                    : 'text-amber-700'
              }`}>
                {paymentStatusLabel}
              </span>
            </p>
            {isBankTransfer && (
              <div className="mt-4 rounded-lg border border-secondary-200 bg-secondary-50 p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-secondary-500">
                  Payment Reference
                </p>
                <p className="mt-1 font-mono text-sm font-semibold text-secondary-900">
                  {bankTransferReference}
                </p>
                <p className="mt-2 text-xs text-secondary-500">
                  Include this reference in your transfer note so we can match your payment faster.
                </p>
              </div>
            )}
            {awaitingBankTransferVerification && bankTransferSubmission && (
              <div className="mt-4 rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-800">
                <p className="font-semibold">Payment details received</p>
                <p className="mt-1">
                  We&apos;re verifying the transfer from {bankTransferSubmission.senderName || 'your bank'}.
                  {bankTransferSubmission.amountPaid !== null && bankTransferSubmission.amountPaid !== undefined
                    ? ` Reported amount: ${bankTransferSubmission.amountPaid.toFixed(2)} ${currency}.`
                    : ''}
                </p>
              </div>
            )}
          </section>

          {/* Actions */}
          <section className="rounded-lg border border-secondary-200 bg-white p-6 space-y-3">
            {canManageUnpaidPayment && (
              <OrderPaymentRetry
                orderId={order.id}
                orderNumber={canonicalOrderNumber}
                orderPath={orderPath}
                accessToken={accessResult.via === 'token' ? accessToken : undefined}
                currentPaymentMethod={retryPaymentMethod!}
                availablePaymentMethods={availablePaymentMethods}
                amount={totalAmount}
                currency={currency}
              />
            )}

            {isBankTransfer && !isPaid && (
              <>
                <Link
                  href={invoicePath}
                  className="btn-accent w-full text-center block"
                >
                  View Proforma Invoice
                </Link>
                
                {/* Payment Receipt Upload */}
                <div className="pt-3 border-t border-secondary-200">
                  <PaymentReceiptUpload
                    orderNumber={canonicalOrderNumber}
                    accessToken={accessResult.via === 'token' ? accessToken : undefined}
                    currency={currency}
                    existingSubmission={bankTransferSubmission}
                  />
                </div>
              </>
            )}

            {!isBankTransfer && (
              <Link href="/category" className="btn-secondary w-full text-center block">
                Continue Shopping
              </Link>
            )}
          </section>

          {/* Contact */}
          <section className="rounded-lg border border-secondary-200 bg-white p-6">
            <h2 className="text-sm font-bold text-secondary-900">Need Help?</h2>
            <p className="mt-2 text-xs text-secondary-500">
              Contact us at{' '}
              <a href="mailto:sales@machrio.com" className="text-primary-700 hover:underline">
                sales@machrio.com
              </a>{' '}
              with your order number.
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}
