import { notFound } from 'next/navigation'
import { getOrderByNumber, getBankAccounts } from '@/lib/db'
import { getBankTransferReference } from '@/lib/bank-transfer'
import { authorizeOrderAccess } from '@/lib/order-access'
import { buildOrderPath } from '@/lib/order-access-links'
import { OrderAccessRequired } from '@/components/order/OrderAccessRequired'
import { PrintButton } from '@/components/shared/PrintButton'

export const dynamic = 'force-dynamic'

interface InvoicePageProps {
  params: Promise<{ orderNumber: string }>
  searchParams: Promise<{ access?: string | string[] }>
}

function toDisplayAmount(value: unknown): number {
  const numericValue = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(numericValue) ? numericValue : 0
}

export default async function InvoicePage({ params, searchParams }: InvoicePageProps) {
  const { orderNumber } = await params
  const { access } = await searchParams
  const [order, bankAccounts] = await Promise.all([
    getOrderByNumber(orderNumber),
    getBankAccounts(),
  ])
  if (!order) notFound()

  const accessToken = Array.isArray(access) ? access[0] : access
  const accessResult = await authorizeOrderAccess({
    order,
    accessToken,
  })

  if (!accessResult) {
    return <OrderAccessRequired orderNumber={canonicalOrderNumber} />
  }

  const canonicalOrderNumber = order.order_number
  const orderPath = buildOrderPath(canonicalOrderNumber, accessResult.via === 'token' ? accessToken : undefined)

  const customer = {
    name: order.customer_name,
    email: order.customer_email,
    phone: order.customer_phone || '',
    company: order.customer_company,
  }
  const shipping = order.shipping_address as Record<string, unknown> || {}
  const items = (order.items as Record<string, unknown>[]) || []
  const subtotalAmount = toDisplayAmount(order.subtotal)
  const shippingAmount = toDisplayAmount(order.shipping_cost)
  const totalAmount = toDisplayAmount(order.total)
  const createdAt = new Date(order.created_at)
  const dueDate = new Date(createdAt.getTime() + 14 * 24 * 60 * 60 * 1000) // 14 days
  const paymentReference = getBankTransferReference(canonicalOrderNumber)

  // Match bank accounts by currency, or show all if none match
  const currency = order.currency || 'USD'
  const matchedAccounts = bankAccounts.filter(a => a.currency === currency)
  const displayAccounts = matchedAccounts.length > 0 ? matchedAccounts : bankAccounts

  return (
    <div className="min-h-screen bg-white">
      {/* Print button bar */}
      <div className="container-main py-4 print:hidden flex justify-between items-center">
        <a href={orderPath} className="text-sm text-primary-700 hover:underline">
          &larr; Back to Order
        </a>
        <PrintButton />
      </div>

      {/* Invoice */}
      <div className="container-main max-w-3xl pb-12 print:max-w-none print:px-0">
        {/* Header */}
        <div className="flex justify-between items-start border-b border-secondary-300 pb-6">
          <div>
            <h1 className="text-3xl font-bold text-primary-800">
              Machrio
            </h1>
            <p className="mt-1 text-xs text-secondary-500">Industrial MRO Supplies</p>
          </div>
          <div className="text-right">
            <h2 className="text-xl font-bold text-secondary-800">PROFORMA INVOICE</h2>
            <p className="mt-1 text-sm text-secondary-600">Invoice: {canonicalOrderNumber}</p>
            <p className="text-sm text-secondary-600">Date: {createdAt.toLocaleDateString('en-US')}</p>
            <p className="text-sm text-secondary-600">Due: {dueDate.toLocaleDateString('en-US')}</p>
          </div>
        </div>

        {/* Bill to / Ship to */}
        <div className="mt-6 grid grid-cols-2 gap-8">
          <div>
            <h3 className="text-xs font-bold uppercase text-secondary-500 tracking-wider">Bill To</h3>
            <div className="mt-2 text-sm text-secondary-700">
              <p className="font-semibold">{customer.company}</p>
              <p>{customer.name}</p>
              <p>{customer.email}</p>
              {customer.phone && <p>{customer.phone}</p>}
            </div>
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase text-secondary-500 tracking-wider">Ship To</h3>
            <div className="mt-2 text-sm text-secondary-700">
              <p>{shipping.address as string}</p>
              <p>{shipping.city as string}, {shipping.state as string} {shipping.postalCode as string}</p>
              <p>{shipping.country as string}</p>
            </div>
          </div>
        </div>

        {/* Items table */}
        <div className="mt-8">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b-2 border-secondary-300">
                <th className="py-2 text-left font-semibold text-secondary-700">Item</th>
                <th className="py-2 text-left font-semibold text-secondary-700">SKU</th>
                <th className="py-2 text-right font-semibold text-secondary-700">Qty</th>
                <th className="py-2 text-right font-semibold text-secondary-700">Unit Price</th>
                <th className="py-2 text-right font-semibold text-secondary-700">Amount</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, i) => (
                <tr key={i} className="border-b border-secondary-100">
                  <td className="py-2.5 text-secondary-800">{item.productName as string}</td>
                  <td className="py-2.5 text-secondary-600">{item.sku as string}</td>
                  <td className="py-2.5 text-right text-secondary-800">{item.quantity as number}</td>
                  <td className="py-2.5 text-right text-secondary-800">${toDisplayAmount(item.unitPrice).toFixed(2)}</td>
                  <td className="py-2.5 text-right font-medium text-secondary-900">${toDisplayAmount(item.lineTotal).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className="mt-4 flex justify-end">
          <div className="w-64 space-y-1 text-sm">
            <div className="flex justify-between text-secondary-600">
              <span>Subtotal</span>
              <span>${subtotalAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-secondary-600">
              <span>Shipping</span>
              <span>{shippingAmount === 0 ? 'FREE' : `$${shippingAmount.toFixed(2)}`}</span>
            </div>
            <div className="flex justify-between border-t-2 border-secondary-300 pt-2 font-bold text-secondary-900 text-base">
              <span>Total Due</span>
              <span>${totalAmount.toFixed(2)} {currency}</span>
            </div>
          </div>
        </div>

        {/* Bank details */}
        {displayAccounts.length > 0 && (
          <div className="mt-10 border-t border-secondary-200 pt-6">
            <h3 className="text-sm font-bold text-secondary-800">Bank Transfer Details</h3>
            <p className="mt-1 text-xs text-secondary-500">
              Please transfer the total amount to the following account and use the payment reference below in your remittance note.
            </p>
            <div className="mt-3 rounded-lg border border-primary-200 bg-primary-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-primary-700">Payment Reference</p>
              <p className="mt-1 font-mono text-sm font-semibold text-secondary-900">{paymentReference}</p>
              <p className="mt-2 text-xs text-primary-700">
                After sending the transfer, return to your order page and submit the amount, transfer date, and sender name. Payment proof is optional.
              </p>
            </div>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {displayAccounts.map((account) => (
                <div key={account.id} className="rounded-lg border border-secondary-200 bg-secondary-50 p-4 text-xs">
                  <p className="font-bold text-secondary-800">
                    {account.flag ? `${account.flag} ` : ''}{account.account_name}
                  </p>
                  <div className="mt-2 space-y-1 text-secondary-600">
                    <p><span className="font-medium text-secondary-700">Bank:</span> {account.bank_name}</p>
                    <p><span className="font-medium text-secondary-700">Beneficiary:</span> {account.beneficiary_name}</p>
                    <p><span className="font-medium text-secondary-700">Account:</span> {account.account_number}</p>
                    {account.local_bank_code && account.local_bank_code_label ? (
                      <p><span className="font-medium text-secondary-700">{account.local_bank_code_label}:</span> {account.local_bank_code}</p>
                    ) : null}
                    {account.swift_code ? <p><span className="font-medium text-secondary-700">SWIFT/BIC:</span> {account.swift_code}</p> : null}
                    {account.bank_address ? <p><span className="font-medium text-secondary-700">Bank Address:</span> {account.bank_address}</p> : null}
                    {account.additional_info ? <p className="mt-1 italic text-secondary-500">{account.additional_info}</p> : null}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-10 border-t border-secondary-200 pt-6 text-xs text-secondary-500">
          <p>This is a proforma invoice issued by Machrio. Payment is due within 14 days of the invoice date.</p>
          <p className="mt-1">For questions, please contact support@machrio.com</p>
        </div>
      </div>
    </div>
  )
}
