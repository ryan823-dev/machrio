import type { Metadata } from 'next'
import Link from 'next/link'
import { safeQuery } from '@/lib/db'
import { Breadcrumbs } from '@/components/shared/Breadcrumbs'
import { ProductGrid } from '@/components/category/ProductGrid'
import { normalizePurchaseMode } from '@/lib/purchase-mode'
import { parsePricing } from '@/lib/pricing'

// SSR: 直接查询 PostgreSQL
export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'New Arrivals | Machrio Industrial Supplies',
  description: 'Discover the latest industrial products added to our catalog. New tools, safety equipment, MRO supplies, and more.',
  alternates: { canonical: '/new-arrivals' },
  openGraph: {
    title: 'New Arrivals | Machrio Industrial Supplies',
    description: 'Discover the latest industrial products added to our catalog.',
  },
}

interface NewArrivalProductRow {
  id: string
  name: string
  slug: string
  sku: string
  short_description: string | null
  pricing: unknown | null
  external_image_url: string | null
  availability: string | null
  purchase_mode: string | null
  package_qty: number | null
  package_unit: string | null
}

function mapProductToCard(product: NewArrivalProductRow) {
  const pricing = parsePricing(product.pricing)

  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    categorySlug: 'products',
    sku: product.sku,
    brand: 'Unbranded',
    primaryImage: product.external_image_url || undefined,
    shortDescription: product.short_description || '',
    pricing: {
      basePrice: pricing?.basePrice,
      currency: pricing?.currency || 'USD',
      priceUnit: pricing?.priceUnit,
    },
    packageQty: product.package_qty || undefined,
    packageUnit: product.package_unit || undefined,
    purchaseMode: normalizePurchaseMode(product.purchase_mode),
    availability: product.availability || 'contact',
  }
}

export default async function NewArrivalsPage() {
  let gridProducts: Array<ReturnType<typeof mapProductToCard>> = []
  try {
    const result = await safeQuery<NewArrivalProductRow>(
      `SELECT id, name, slug, sku, short_description, pricing,
              external_image_url, availability, purchase_mode,
              package_qty, package_unit
       FROM products
       WHERE status = 'published'
       ORDER BY created_at DESC
       LIMIT $1`,
      [100]
    )

    gridProducts = result.rows.map(mapProductToCard)
  } catch (error) {
    console.error('Error loading new arrivals:', error)
  }

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
