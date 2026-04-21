import type { Metadata } from 'next'
import Link from 'next/link'
import { FindOrderAccessForm } from '@/components/order/FindOrderAccessForm'

interface FindOrderPageProps {
  searchParams: Promise<{
    orderNumber?: string | string[]
  }>
}

function getSearchValue(value: string | string[] | undefined): string {
  return Array.isArray(value) ? value[0] || '' : value || ''
}

export const metadata: Metadata = {
  title: 'Find Your Order | Machrio',
  description: 'Request a secure access link for your Machrio order using your order number and purchasing email.',
  robots: {
    index: false,
    follow: false,
  },
  alternates: { canonical: '/find-order' },
}

export default async function FindOrderPage({ searchParams }: FindOrderPageProps) {
  const { orderNumber } = await searchParams
  const initialOrderNumber = getSearchValue(orderNumber)

  return (
    <div className="container-main py-12">
      <div className="mx-auto max-w-3xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-secondary-900">Need to reopen an order?</h1>
          <p className="mt-2 text-secondary-600">
            We&apos;ll email you a secure order link so you can view your protected order page, invoice, and bank transfer instructions without signing in.
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-[minmax(0,1.15fr)_minmax(280px,0.85fr)]">
          <FindOrderAccessForm initialOrderNumber={initialOrderNumber} />

          <div className="space-y-6">
            <div className="rounded-2xl border border-secondary-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-secondary-900">What you&apos;ll need</h2>
              <ul className="mt-4 space-y-2 text-sm text-secondary-600">
                <li>Your order number</li>
                <li>The purchasing email used at checkout</li>
                <li>Access to that inbox</li>
              </ul>
            </div>

            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6">
              <h2 className="text-lg font-semibold text-amber-900">Still can&apos;t find it?</h2>
              <p className="mt-3 text-sm text-amber-800">
                Contact our support team and include your company name plus any order reference you have. We&apos;ll help you recover the order access link.
              </p>
              <div className="mt-4 flex flex-wrap gap-3">
                <Link href="/contact" className="btn-secondary">
                  Contact Support
                </Link>
                <a href="mailto:sales@machrio.com" className="btn-accent">
                  Email Sales
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
