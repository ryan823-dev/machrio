import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getOrderByNumber } from '@/lib/db'
import { PayPalCaptureHandler } from '@/components/payment/PayPalCaptureHandler'
import { PaymentReceiptUpload } from '@/components/order/PaymentReceiptUpload'

export const dynamic = 'force-dynamic'

interface OrderPageProps {
  params: Promise<{ orderNumber: string }>
  searchParams: Promise<{ payment?: string }>
}

export default async function OrderConfirmationPage({ params, searchParams }: OrderPageProps) {
  const { orderNumber } = await params
  const { payment } = await searchParams
  const order = await getOrderByNumber(orderNumber)
  if (!order) notFound()

  const customer = {
    name: order.customer_name,
    email: order.customer_email,
    phone: order.customer_phone || '',
    company: order.customer_company,
  }
  const shipping = order.shipping_address as Record<string, unknown> || {}
  const paymentInfo = (order as any).payment_info || {}
  const items = (order.items as Record<string, unknown>[]) || []
  const isBankTransfer = paymentInfo.method === 'bank-transfer'
  const isPaid = order.payment_status === 'paid'
  const paymentSuccess = payment === 'success'

  return (
    <div className="container-main py-8">
      {/* PayPal Capture Handler */}
      <PayPalCaptureHandler orderNumber={orderNumber} />
      
      {/* Status banner */}
      {paymentSuccess && paymentInfo.method !== 'paypal' && (
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

      {payment === 'cancelled' && (
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

      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-secondary-900">Order Confirmation</h1>
          <p className="mt-1 text-secondary-500">
            Order <span className="font-mono font-semibold text-secondary-800">{orderNumber}</span>
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
            isPaid ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'
          }`}>
            {isPaid ? 'Paid' : 'Unpaid'}
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
                  <span className="font-semibold text-secondary-800">${(item.lineTotal as number).toFixed(2)}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 border-t border-secondary-200 pt-4 space-y-1 text-sm">
              <div className="flex justify-between text-secondary-600">
                <span>Subtotal</span>
                <span>${order.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-secondary-600">
                <span>Shipping</span>
                <span>{order.shipping_cost === 0 ? 'FREE' : `$${order.shipping_cost.toFixed(2)}`}</span>
              </div>
              <div className="flex justify-between font-bold text-secondary-900 pt-1 border-t border-secondary-100">
                <span>Total</span>
                <span>${order.total.toFixed(2)} USD</span>
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
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          {/* Payment info */}
          <section className="rounded-lg border border-secondary-200 bg-white p-6">
            <h2 className="text-lg font-bold text-secondary-900">Payment</h2>
            <p className="mt-2 text-sm text-secondary-600">
              Method: <span className="font-medium">{isBankTransfer ? 'Bank Transfer' : 'Stripe (Online)'}</span>
            </p>
            <p className="mt-1 text-sm text-secondary-600">
              Status: <span className={`font-medium ${isPaid ? 'text-green-700' : 'text-amber-700'}`}>
                {isPaid ? 'Paid' : 'Awaiting Payment'}
              </span>
            </p>
          </section>

          {/* Actions */}
          <section className="rounded-lg border border-secondary-200 bg-white p-6 space-y-3">
            {isBankTransfer && !isPaid && (
              <>
                <Link
                  href={`/order/${orderNumber}/invoice`}
                  className="btn-accent w-full text-center block"
                >
                  View Proforma Invoice
                </Link>
                
                {/* Payment Receipt Upload */}
                <div className="pt-3 border-t border-secondary-200">
                  <PaymentReceiptUpload orderNumber={orderNumber} />
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