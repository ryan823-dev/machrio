import { notFound } from 'next/navigation'
import { getOrderByNumber, getBankAccounts } from '@/lib/db'
import { PrintButton } from '@/components/shared/PrintButton'

export const dynamic = 'force-dynamic'

interface InvoicePageProps {
  params: Promise<{ orderNumber: string }>
}

export default async function InvoicePage({ params }: InvoicePageProps) {
  const { orderNumber } = await params
  const [order, bankAccounts] = await Promise.all([
    getOrderByNumber(orderNumber),
    getBankAccounts(),
  ])
  if (!order) notFound()

  const customer = {
    name: order.customer_name,
    email: order.customer_email,
    phone: order.customer_phone || '',
    company: order.customer_company,
  }
  const shipping = order.shipping_address as Record<string, unknown> || {}
  const items = (order.items as Record<string, unknown>[]) || []
  const createdAt = new Date(order.created_at)
  const dueDate = new Date(createdAt.getTime() + 14 * 24 * 60 * 60 * 1000) // 14 days

  // Match bank accounts by currency, or show all if none match
  const currency = order.currency || 'USD'
  const matchedAccounts = bankAccounts.filter(a => a.currency === currency)
  const displayAccounts = matchedAccounts.length > 0 ? matchedAccounts : bankAccounts

  return (
    <div className="min-h-screen bg-white">
      {/* Print button bar */}
      <div className="container-main py-4 print:hidden flex justify-between items-center">
        <a href={`/order/${orderNumber}`} className="text-sm text-primary-700 hover:underline">
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
            <p className="mt-1 text-sm text-secondary-600">Invoice: {orderNumber}</p>
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
                  <td className="py-2.5 text-right text-secondary-800">${(item.unitPrice as number).toFixed(2)}</td>
                  <td className="py-2.5 text-right font-medium text-secondary-900">${(item.lineTotal as number).toFixed(2)}</td>
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
              <span>${order.subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-secondary-600">
              <span>Shipping</span>
              <span>{order.shipping_cost === 0 ? 'FREE' : `$${order.shipping_cost.toFixed(2)}`}</span>
            </div>
            <div className="flex justify-between border-t-2 border-secondary-300 pt-2 font-bold text-secondary-900 text-base">
              <span>Total Due</span>
              <span>${order.total.toFixed(2)} {currency}</span>
            </div>
          </div>
        </div>

        {/* Bank details */}
        {displayAccounts.length > 0 && (
          <div className="mt-10 border-t border-secondary-200 pt-6">
            <h3 className="text-sm font-bold text-secondary-800">Bank Transfer Details</h3>
            <p className="mt-1 text-xs text-secondary-500">
              Please transfer the total amount to the following account and include the invoice number ({orderNumber}) as payment reference.
            </p>
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
          <p className="mt-1">For questions, please contact sales@machrio.com</p>
        </div>
      </div>
    </div>
  )
}
