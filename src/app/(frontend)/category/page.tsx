import type { Metadata } from 'next'
import Link from 'next/link'
import { Breadcrumbs } from '@/components/shared/Breadcrumbs'
import { getPool } from '@/lib/db'

// 动态渲染 - 从数据库获取实时数据
export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'All Categories | Machrio Industrial Supplies',
  description: 'Browse all industrial product categories. Safety, adhesives, material handling, power transmission, and more.',
  alternates: { canonical: '/category/' },
}

// 从数据库获取顶级分类及子分类数量
async function getTopLevelCategories() {
  const pool = getPool()

  // 获取L1分类及其子分类数量
  const result = await pool.query(`
    SELECT
      c.id,
      c.name,
      c.slug,
      COUNT(child.id) as subcategory_count
    FROM categories c
    LEFT JOIN categories child ON child.parent_id = c.id
    WHERE c.parent_id IS NULL
    GROUP BY c.id, c.name, c.slug
    ORDER BY c.display_order, c.name
  `)

  // 获取每个L1分类的前6个L2子分类
  const categoriesWithSubs = await Promise.all(
    result.rows.map(async (cat) => {
      const subResult = await pool.query(`
        SELECT name, slug
        FROM categories
        WHERE parent_id = $1::uuid
        ORDER BY display_order, name
        LIMIT 6
      `, [cat.id])

      return {
        id: cat.id,
        name: cat.name,
        slug: cat.slug,
        subcategoryCount: parseInt(cat.subcategory_count) || 0,
        subcategories: subResult.rows.map(sub => ({
          name: sub.name,
          slug: sub.slug,
        })),
      }
    })
  )

  return categoriesWithSubs
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
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-50 text-primary-600">
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-lg font-bold text-secondary-900 hover:text-primary-700">
                    {cat.name}
                  </h2>
                  <p className="text-xs text-secondary-500">{cat.subcategoryCount} subcategories</p>
                </div>
              </div>
            </Link>

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