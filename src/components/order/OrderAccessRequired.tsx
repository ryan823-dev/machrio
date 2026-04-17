import Link from 'next/link'

export function OrderAccessRequired() {
  return (
    <div className="container-main py-16">
      <div className="mx-auto max-w-lg rounded-2xl border border-secondary-200 bg-white p-8 text-center shadow-sm">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-secondary-100">
          <svg className="h-7 w-7 text-secondary-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.8}
              d="M12 11c1.657 0 3-1.79 3-4s-1.343-4-3-4-3 1.79-3 4 1.343 4 3 4zm0 0v2m-6 8h12a2 2 0 002-2v-3a4 4 0 00-4-4H8a4 4 0 00-4 4v3a2 2 0 002 2z"
            />
          </svg>
        </div>

        <h1 className="mt-5 text-2xl font-bold text-secondary-900">This order link is protected</h1>
        <p className="mt-3 text-sm leading-6 text-secondary-600">
          Sign in with the purchasing email address, or open the secure order link from your email.
          Order and invoice pages are no longer accessible with the order number alone.
        </p>

        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link href="/account" className="btn-primary">
            Sign In to Account
          </Link>
          <Link href="/contact" className="btn-secondary">
            Contact Support
          </Link>
        </div>
      </div>
    </div>
  )
}
