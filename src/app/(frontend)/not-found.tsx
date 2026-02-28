import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="container-main py-20 text-center">
      <h1 className="text-6xl font-bold text-secondary-300">404</h1>
      <h2 className="mt-4 text-2xl font-bold text-secondary-900">Page Not Found</h2>
      <p className="mt-3 text-secondary-600 max-w-md mx-auto">
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
        Try browsing our categories or requesting a custom quote.
      </p>
      <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
        <Link href="/category" className="btn-primary px-6 py-3">
          Browse Categories
        </Link>
        <Link href="/rfq" className="btn-accent px-6 py-3">
          Request a Quote
        </Link>
        <Link href="/" className="btn-secondary px-6 py-3">
          Go Home
        </Link>
      </div>
    </div>
  )
}
