import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Product No Longer Available | Machrio',
  robots: 'noindex, nofollow',
}

export default function ProductGonePage() {
  return (
    <div className="container-main py-20 text-center">
      <div className="mx-auto max-w-2xl">
        <div className="mb-8 text-6xl">📦</div>
        <h1 className="text-3xl font-bold text-secondary-900">
          This Product Is No Longer Available
        </h1>
        <p className="mt-4 text-lg text-secondary-600">
          The product you're looking for has been permanently removed from our catalog.
          It may have been discontinued or replaced with a newer version.
        </p>
        <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:justify-center">
          <Link href="/category" className="btn-primary px-6 py-3">
            Browse All Products
          </Link>
          <Link href="/rfq" className="btn-accent px-6 py-3">
            Request a Custom Quote
          </Link>
          <Link href="/" className="btn-secondary px-6 py-3">
            Go to Homepage
          </Link>
        </div>
        <p className="mt-8 text-sm text-secondary-400">
          If you believe this is an error, please contact us at{' '}
          <a href="mailto:support@machrio.com" className="text-primary-600 hover:underline">
            support@machrio.com
          </a>
        </p>
      </div>
    </div>
  )
}