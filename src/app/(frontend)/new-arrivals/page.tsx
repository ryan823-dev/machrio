import type { Metadata } from 'next'
import Link from 'next/link'
import { getPayload } from 'payload'
import config from '@payload-config'
import { Breadcrumbs } from '@/components/shared/Breadcrumbs'
import { ProductGrid } from '@/components/category/ProductGrid'

// SSR: Supabase is fast enough, no need for ISR
export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'New Arrivals | Machrio Industrial Supplies',
  description: 'Discover the latest industrial products added to our catalog. New tools, safety equipment, MRO supplies, and more.',
  alternates: { canonical: '/new-arrivals/' },
  openGraph: {
    title: 'New Arrivals | Machrio Industrial Supplies',
    description: 'Discover the latest industrial products added to our catalog.',
  },
}

async function getNewestProducts(limit: number = 100) {
  try {
    const payload = await getPayload({ config })
    const result = await payload.find({
      collection: 'products',
      where: {
        status: { equals: 'published' },
      },
      limit,
      sort: '-createdAt',
      depth: 2,
    })
    return result.docs
  } catch {
    return []
  }
}

function mapProductToCard(product: Record<string, unknown>) {
  const pricing = product.pricing as Record<string, unknown> | undefined
  const brand = product.brand as Record<string, unknown> | null
  const primaryCategory = product.primaryCategory as Record<string, unknown> | string | null

  let categorySlug = 'products'
  if (primaryCategory && typeof primaryCategory === 'object') {
    const parent = (primaryCategory as Record<string, unknown>).parent as Record<string, unknown> | string | null
    if (parent && typeof parent === 'object') {
      categorySlug = (parent as Record<string, unknown>).slug as string || 'products'
    } else {
      categorySlug = (primaryCategory as Record<string, unknown>).slug as string || 'products'
    }
  }

  const primaryImageObj = product.primaryImage && typeof product.primaryImage === 'object'
    ? product.primaryImage as Record<string, unknown>
    : null
  const primaryImage = (primaryImageObj?.url as string) || (product.externalImageUrl as string) || undefined

  return {
    name: product.name as string,
    slug: product.slug as string,
    categorySlug,
    sku: product.sku as string,
    brand: brand ? (brand.name as string || 'Unbranded') : 'Unbranded',
    primaryImage,
    shortDescription: (product.shortDescription as string) || '',
    pricing: {
      basePrice: pricing?.basePrice as number | undefined,
      currency: (pricing?.currency as string) || 'USD',
      priceUnit: pricing?.priceUnit as string | undefined,
    },
    packageQty: (product.packageQty as number) || undefined,
    purchaseMode: (product.purchaseMode as 'both' | 'buy-online' | 'rfq-only') || 'both',
    availability: (product.availability as string) || 'contact',
  }
}

export default async function NewArrivalsPage() {
  const products = await getNewestProducts(100)
  const gridProducts = products.map(p => mapProductToCard(p as unknown as Record<string, unknown>))

  const breadcrumbs = [
    { label: 'Home', href: '/' },
    { label: 'New Arrivals' },
  ]

  return (
    <div className="container-main pb-12">
      <Breadcrumbs items={breadcrumbs} />

      <div className="mb-8">
        <h1 className="text-2xl font-bold text-secondary-900">New Arrivals</h1>
        <p className="mt-2 text-sm text-secondary-600">
          Discover the latest products added to our catalog. Updated frequently with new industrial supplies and equipment.
        </p>
      </div>

      {/* Product count */}
      <div className="mb-6 flex items-center justify-between">
        <p className="text-sm text-secondary-500">
          Showing {gridProducts.length} newest products
        </p>
        <Link href="/category" className="text-sm text-primary-600 hover:text-primary-700">
          Browse All Categories &rarr;
        </Link>
      </div>

      {gridProducts.length > 0 ? (
        <ProductGrid products={gridProducts} view="grid" />
      ) : (
        <div className="rounded-lg border border-secondary-200 bg-secondary-50 py-16 text-center">
          <svg className="mx-auto h-12 w-12 text-secondary-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
          <p className="mt-4 text-secondary-500">No products available at the moment.</p>
          <p className="mt-1 text-sm text-secondary-400">Check back soon for new arrivals!</p>
        </div>
      )}

      {/* CTA */}
      <div className="mt-12 rounded-lg border border-primary-200 bg-primary-50 p-6">
        <h2 className="text-lg font-semibold text-primary-800">Looking for something specific?</h2>
        <p className="mt-2 text-primary-700">
          Browse our categories or use the search to find exactly what you need.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link href="/category" className="btn-primary">Browse Categories</Link>
          <Link href="/search" className="btn-secondary">Search Products</Link>
        </div>
      </div>
    </div>
  )
}