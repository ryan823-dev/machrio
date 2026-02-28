import { notFound } from 'next/navigation'
import { getPayload } from 'payload'
import config from '@payload-config'
import { PrintButton } from '@/components/shared/PrintButton'

export const dynamic = 'force-dynamic'

interface InvoicePageProps {
  params: Promise<{ orderNumber: string }>
}

async function getOrder(orderNumber: string) {
  try {
    const payload = await getPayload({ config })
    const result = await payload.find({
      collection: 'orders',
      where: { orderNumber: { equals: orderNumber } },
      limit: 1,
      depth: 0,
    })
    if (result.docs.length === 0) return null
    return result.docs[0]
  } catch {
    return null
  }
}

async function getBankAccounts() {
  try {
    const payload = await getPayload({ config })
    const result = await payload.find({
      collection: 'bank-accounts',
      where: { isActive: { equals: true } },
      sort: 'sortOrder',
      limit: 20,
    })
    return result.docs
  } catch {
    return []
  }
}

export default async function InvoicePage({ params }: InvoicePageProps) {
  const { orderNumber } = await params
  const [order, bankAccounts] = await Promise.all([
    getOrder(orderNumber),
    getBankAccounts(),
  ])
  if (!order) notFound()

  const o = order as unknown as Record<string, unknown>
  const customer = o.customer as Record<string, unknown>
  const shipping = o.shipping as Record<string, unknown>
  const items = o.items as Record<string, unknown>[]
  const createdAt = new Date(o.createdAt as string)
  const dueDate = new Date(createdAt.getTime() + 14 * 24 * 60 * 60 * 1000) // 14 days

  // Match bank accounts by currency, or show all if none match
  const currency = o.currency as string
  const matchedAccounts = bankAccounts.filter(
    (a) => (a as unknown as Record<string, unknown>).currency === currency
  )
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
              MRO<span className="text-amber-500">works</span>
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
              <p className="font-semibold">{customer.company as string}</p>
              <p>{customer.name as string}</p>
              <p>{customer.email as string}</p>
              {String(customer.phone || '') && <p>{String(customer.phone)}</p>}
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
              <span>${(o.subtotal as number).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-secondary-600">
              <span>Shipping</span>
              <span>{(o.shippingCost as number) === 0 ? 'FREE' : `$${(o.shippingCost as number).toFixed(2)}`}</span>
            </div>
            <div className="flex justify-between border-t-2 border-secondary-300 pt-2 font-bold text-secondary-900 text-base">
              <span>Total Due</span>
              <span>${(o.total as number).toFixed(2)} {currency}</span>
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
              {displayAccounts.map((account) => {
                const a = account as unknown as Record<string, unknown>
                return (
                  <div key={a.id as string} className="rounded-lg border border-secondary-200 bg-secondary-50 p-4 text-xs">
                    <p className="font-bold text-secondary-800">
                      {a.flag ? `${a.flag} ` : ''}{a.accountName as string}
                    </p>
                    <div className="mt-2 space-y-1 text-secondary-600">
                      <p><span className="font-medium text-secondary-700">Bank:</span> {a.bankName as string}</p>
                      <p><span className="font-medium text-secondary-700">Beneficiary:</span> {a.beneficiaryName as string}</p>
                      <p><span className="font-medium text-secondary-700">Account:</span> {a.accountNumber as string}</p>
                      {a.localBankCode && a.localBankCodeLabel ? (
                        <p><span className="font-medium text-secondary-700">{String(a.localBankCodeLabel)}:</span> {String(a.localBankCode)}</p>
                      ) : null}
                      {a.swiftCode ? <p><span className="font-medium text-secondary-700">SWIFT/BIC:</span> {String(a.swiftCode)}</p> : null}
                      {a.bankAddress ? <p><span className="font-medium text-secondary-700">Bank Address:</span> {String(a.bankAddress)}</p> : null}
                      {a.additionalInfo ? <p className="mt-1 italic text-secondary-500">{String(a.additionalInfo)}</p> : null}
                    </div>
                  </div>
                )
              })}
            </div>
            {matchedAccounts.length > 0 && bankAccounts.length > matchedAccounts.length && (
              <p className="mt-3 text-xs text-secondary-400">
                Can&apos;t pay in {currency}? Contact <strong>sales@machrio.com</strong> for alternative bank accounts in other currencies.
              </p>
            )}
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
