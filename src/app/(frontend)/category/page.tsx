import type { Metadata } from 'next'
import Link from 'next/link'
import { getPayload } from 'payload'
import config from '@payload-config'
import { Breadcrumbs } from '@/components/shared/Breadcrumbs'

// 使用 ISR，每 10 分钟重新验证一次
// 分类列表变化不频繁，可以使用较长的缓存时间
export const revalidate = 600

export const metadata: Metadata = {
  title: 'All Categories | Machrio Industrial Supplies',
  description: 'Browse all industrial product categories. Safety, adhesives, material handling, power transmission, and more.',
  alternates: { canonical: '/category/' },
}

async function getTopLevelCategories() {
  try {
    const payload = await getPayload({ config })
    const result = await payload.find({
      collection: 'categories',
      where: {
        or: [
          { parent: { exists: false } },
          { parent: { equals: null } },
        ],
      },
      sort: 'displayOrder',
      limit: 50,
    })

    // For each top-level category, get subcategories and product count
    const categories = await Promise.all(
      result.docs.map(async (cat) => {
        // Get subcategories
        const children = await payload.find({
          collection: 'categories',
          where: { parent: { equals: cat.id } },
          sort: 'displayOrder',
          limit: 50,
        })

        // Count products in this category + all subcategories + grandchildren
        const allIds = [cat.id, ...children.docs.map(c => c.id)]
        // Also get level-3 categories (grandchildren)
        const grandchildrenResults = await Promise.all(
          children.docs.map(child =>
            payload.find({
              collection: 'categories',
              where: { parent: { equals: child.id } },
              limit: 200,
            })
          )
        )
        const grandchildren = grandchildrenResults.flatMap(r => r.docs)
        allIds.push(...grandchildren.map(c => c.id))
        let productCount = 0
        try {
          const countResult = await payload.count({
            collection: 'products',
            where: {
              primaryCategory: { in: allIds },
              status: { equals: 'published' },
            },
          })
          productCount = countResult.totalDocs
        } catch { /* ignore */ }

        const subcategories = children.docs.map(child => ({
          name: child.name,
          slug: child.slug,
        }))

        return {
          id: cat.id,
          name: cat.name,
          slug: cat.slug,
          icon: (cat as unknown as Record<string, unknown>).iconEmoji as string || '',
          shortDescription: cat.shortDescription || '',
          productCount,
          subcategories,
        }
      })
    )

    return categories
  } catch {
    return []
  }
}

export default async function AllCategoriesPage() {
  const categories = await getTopLevelCategories()

  const breadcrumbs = [
    { label: 'Home', href: '/' },
    { label: 'All Categories' },
  ]

  return (
    <div className="container-main pb-12">
      <Breadcrumbs items={breadcrumbs} />

      <div className="mb-8">
        <h1 className="text-2xl font-bold text-secondary-900">All Categories</h1>
        <p className="mt-2 text-sm text-secondary-600">
          Browse our complete catalog of industrial MRO supplies and equipment.
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {categories.map((cat) => (
          <div key={cat.id} className="rounded-lg border border-secondary-200 bg-white p-6 transition-shadow hover:shadow-md">
            <Link href={`/category/${cat.slug}`} className="block">
              <div className="flex items-center gap-3">
                {cat.icon ? (
                  <span className="text-2xl">{cat.icon}</span>
                ) : (
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-50 text-primary-600">
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                    </svg>
                  </div>
                )}
                <div>
                  <h2 className="text-lg font-bold text-secondary-900 hover:text-primary-700">
                    {cat.name}
                  </h2>
                  <p className="text-xs text-secondary-500">{cat.productCount} products</p>
                </div>
              </div>
            </Link>

            {cat.shortDescription && (
              <p className="mt-3 text-sm text-secondary-600 line-clamp-2">{cat.shortDescription}</p>
            )}

            {cat.subcategories.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-1.5">
                {cat.subcategories.map((sub) => (
                  <Link
                    key={sub.slug}
                    href={`/category/${sub.slug}`}
                    className="rounded-full border border-secondary-200 px-2.5 py-1 text-xs text-secondary-600 transition-colors hover:border-primary-300 hover:bg-primary-50 hover:text-primary-700"
                  >
                    {sub.name}
                  </Link>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {categories.length === 0 && (
        <div className="py-16 text-center">
          <p className="text-secondary-500">No categories found.</p>
        </div>
      )}
    </div>
  )
}
