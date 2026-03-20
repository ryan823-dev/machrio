import type { Metadata } from 'next'
import Link from 'next/link'
import { Breadcrumbs } from '@/components/shared/Breadcrumbs'

// 直接使用静态数据，避免繁重的数据库查询
// 导航数据在构建时生成，包含完整的三层分类结构
import navCategoriesData from '@/data/nav-categories.json'

// 静态生成 - 这个页面不需要动态数据
export const dynamic = 'force-static'

export const metadata: Metadata = {
  title: 'All Categories | Machrio Industrial Supplies',
  description: 'Browse all industrial product categories. Safety, adhesives, material handling, power transmission, and more.',
  alternates: { canonical: '/category/' },
}

// 从静态数据提取顶级分类
function getTopLevelCategories() {
  const categories = (navCategoriesData as { categories: Array<{
    id: string
    name: string
    slug: string
    children?: Array<{ name: string; slug: string }>
  }> }).categories

  return categories.map(cat => ({
    id: cat.id,
    name: cat.name,
    slug: cat.slug,
    icon: '',
    shortDescription: '',
    productCount: 0, // 静态数据不包含产品数量，避免繁重查询
    subcategories: (cat.children || []).slice(0, 6).map(child => ({
      name: child.name,
      slug: child.slug,
    })),
  }))
}

export default function AllCategoriesPage() {
  const categories = getTopLevelCategories()

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
