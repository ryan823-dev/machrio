import { Suspense } from 'react'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getPool } from '@/lib/db'
import { Breadcrumbs } from '@/components/shared/Breadcrumbs'
import { FAQSchema, FAQSection } from '@/components/shared/FAQSchema'
import { StructuredData } from '@/components/shared/StructuredData'
import { CategoryBuyingGuide } from '@/components/shared/RelatedGuide'
import { ProductGrid } from '@/components/category/ProductGrid'
import { ExpandableIntro } from '@/components/category/ExpandableIntro'
import { EmptyStateAIDialog } from '@/components/category/EmptyStateAIDialog'

// 强制动态渲染（SSR）
export const dynamic = 'force-dynamic'
export const revalidate = 0

// =============================================
// Lexical richText rendering helpers
// =============================================

function extractChildren(children: unknown[]): string {
  if (!Array.isArray(children)) return ''
  return children
    .map((node) => {
      const n = node as Record<string, unknown>
      if (n.type === 'text') return n.text as string
      if (n.children) return extractChildren(n.children as unknown[])
      return ''
    })
    .join('')
}

function lexicalToHtml(richText: unknown): string {
  if (!richText || typeof richText !== 'object') return ''
  const root = (richText as Record<string, unknown>).root as Record<string, unknown> | undefined
  if (!root || !Array.isArray(root.children)) return ''
  return (root.children as Record<string, unknown>[])
    .map((node) => {
      if (node.type === 'paragraph') {
        const text = extractChildren(node.children as unknown[])
        return text ? `<p>${text}</p>` : ''
      }
      if (node.type === 'heading') {
        const tag = (node.tag as string) || 'h3'
        const text = extractChildren(node.children as unknown[])
        return text ? `<${tag}>${text}</${tag}>` : ''
      }
      if (node.type === 'list') {
        const listTag = node.listType === 'number' ? 'ol' : 'ul'
        const items = (node.children as Record<string, unknown>[])
          .map((item) => {
            const text = extractChildren(item.children as unknown[])
            return text ? `<li>${text}</li>` : ''
          })
          .filter(Boolean)
          .join('')
        return items ? `<${listTag}>${items}</${listTag}>` : ''
      }
      return ''
    })
    .filter(Boolean)
    .join('\n')
}

function hasRichTextContent(richText: unknown): boolean {
  if (!richText || typeof richText !== 'object') return false
  const root = (richText as Record<string, unknown>).root as Record<string, unknown> | undefined
  if (!root || !Array.isArray(root.children)) return false
  const text = extractChildren(root.children as unknown[])
  return text.trim().length > 0
}

// =============================================
// 数据库查询函数
// =============================================

interface CategoryRow {
  id: string
  name: string
  slug: string
  short_description: string | null
  intro_content: string | null
  description: unknown | null
  buying_guide: unknown | null
  faq: unknown | null
  seo_content: unknown | null
  parent_id: string | null
  display_order: number | null
}

interface ChildCategory {
  id: string
  name: string
  slug: string
}

// 使用 PostgreSQL 直接查询获取分类数据
async function getCategoryData(slug: string) {
  const pool = getPool()

  try {
    // 获取分类信息（包含所有 SEO 字段）
    const catResult = await pool.query<CategoryRow>(
      `SELECT id, name, slug, short_description, intro_content, description, buying_guide, faq, seo_content, parent_id, display_order
       FROM categories WHERE slug = $1`,
      [slug]
    )

    if (catResult.rows.length === 0) return null
    const category = catResult.rows[0]

    // 获取父分类
    let parent: { id: string; name: string; slug: string } | null = null
    let grandparent: { id: string; name: string; slug: string } | null = null
    if (category.parent_id) {
      const parentResult = await pool.query<{ id: string; name: string; slug: string; parent_id: string | null }>(
        'SELECT id, name, slug, parent_id FROM categories WHERE id = $1::uuid',
        [category.parent_id]
      )
      if (parentResult.rows[0]) {
        parent = { id: parentResult.rows[0].id, name: parentResult.rows[0].name, slug: parentResult.rows[0].slug }

        // 获取祖父分类
        if (parentResult.rows[0].parent_id) {
          const gpResult = await pool.query<{ id: string; name: string; slug: string }>(
            'SELECT id, name, slug FROM categories WHERE id = $1::uuid',
            [parentResult.rows[0].parent_id]
          )
          if (gpResult.rows[0]) {
            grandparent = { id: gpResult.rows[0].id, name: gpResult.rows[0].name, slug: gpResult.rows[0].slug }
          }
        }
      }
    }

    // 获取子分类
    const childrenResult = await pool.query<ChildCategory>(
      'SELECT id, name, slug FROM categories WHERE parent_id = $1::uuid ORDER BY display_order LIMIT 50',
      [category.id]
    )
    const children = childrenResult.rows

    return { category, parent, grandparent, children }
  } catch (error) {
    console.error('[getCategoryData] 错误:', error)
    return null
  }
}

// 获取分类产品
async function getCategoryProducts(categoryId: string) {
  const pool = getPool()
  const PRODUCTS_PER_PAGE = 24

  try {
    // 获取产品总数
    const countResult = await pool.query<{ count: string }>(
      'SELECT COUNT(*) FROM products WHERE primary_category_id = $1::uuid',
      [categoryId]
    )
    const totalDocs = parseInt(countResult.rows[0].count)

    // 获取产品（包含图片和价格）
    const productsResult = await pool.query(
      `SELECT id, name, slug, sku, short_description, pricing, images, status
       FROM products
       WHERE primary_category_id = $1::uuid AND status = 'published'
       ORDER BY name
       LIMIT $2`,
      [categoryId, PRODUCTS_PER_PAGE]
    )

    const docs = productsResult.rows.map((p) => {
      let imageUrl: string | null = null
      if (p.images && Array.isArray(p.images) && p.images.length > 0) {
        imageUrl = (p.images[0] as { url?: string })?.url || null
      }
      let basePrice: number | null = null
      if (p.pricing && typeof p.pricing === 'object' && 'basePrice' in p.pricing) {
        basePrice = (p.pricing as { basePrice: number }).basePrice
      }
      return {
        id: p.id,
        name: p.name,
        slug: p.slug,
        categorySlug: '',
        sku: p.sku,
        brand: 'Industrial',
        primaryImage: imageUrl,
        shortDescription: p.short_description || '',
        pricing: { basePrice, currency: 'USD' },
        purchaseMode: 'both' as const,
        availability: 'in-stock',
      }
    })

    return { docs, totalDocs }
  } catch (error) {
    console.error('[getCategoryProducts] 错误:', error)
    return { docs: [], totalDocs: 0 }
  }
}

interface CategoryPageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const { slug } = await params
  const data = await getCategoryData(slug)
  if (!data) return { title: 'Category Not Found' }

  const { category, parent, grandparent } = data
  const parentName = parent ? `${parent.name} - ` : ''
  const gpName = grandparent ? `${grandparent.name} - ` : ''
  const title = `${category.name} | ${gpName}${parentName}Machrio Industrial Supplies`
  const description = category.short_description || `Browse ${category.name} at Machrio.`

  return {
    title,
    description,
    alternates: { canonical: `/category/${slug}/` },
    openGraph: { title, description },
  }
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { slug } = await params

  const data = await getCategoryData(slug)
  if (!data) notFound()

  const { category, parent, grandparent, children } = data

  const isL1 = !parent && !grandparent
  const isL2 = parent && !grandparent
  const isL3 = parent && grandparent

  // 判断是否为叶子分类（没有子分类）
  const isLeafCategory = children.length === 0

  // 只在叶子分类或 L3 分类显示产品
  let productsResult = { docs: [], totalDocs: 0 }
  if (isL3 || isLeafCategory) {
    productsResult = await getCategoryProducts(category.id)
  }

  const breadcrumbs = [
    { label: 'Home', href: '/' },
    ...(grandparent ? [{ label: grandparent.name, href: `/category/${grandparent.slug}` }] : []),
    ...(parent ? [{ label: parent.name, href: `/category/${parent.slug}` }] : []),
    { label: category.name },
  ]

  const serverUrl = process.env.NEXT_PUBLIC_SERVER_URL || 'https://machrio.com'

  const itemListSchema = productsResult.docs.length > 0 ? {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: `${category.name} - Industrial Supplies`,
    numberOfItems: productsResult.totalDocs,
    itemListElement: productsResult.docs.slice(0, 20).map((p, idx) => ({
      '@type': 'ListItem',
      position: idx + 1,
      url: `${serverUrl}/product/${slug}/${p.slug}/`,
      name: p.name,
    })),
  } : null

  // 解析 FAQ 数据
  const faqList = Array.isArray(category.faq)
    ? (category.faq as Array<{ question?: string; answer?: string }>).map(item => ({
        question: item.question || '',
        answer: item.answer || ''
      }))
    : []

  return (
    <div className="container-main pb-12">
      <Breadcrumbs items={breadcrumbs} />
      {itemListSchema && <StructuredData data={itemListSchema} />}

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-secondary-900">{category.name}</h1>
        {category.intro_content ? (
          <ExpandableIntro content={category.intro_content} />
        ) : (
          <p className="mt-2 text-sm leading-relaxed text-secondary-600">
            {category.short_description || `Browse our selection of ${category.name} products.`}
          </p>
        )}
      </div>

      <CategoryBuyingGuide categorySlug={slug} />

      {(isL1 || isL2) && children.length > 0 && (
        <section className="mb-8">
          <h2 className="mb-4 text-lg font-semibold text-secondary-800">
            Browse {category.name} Categories
          </h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {children.map((child) => (
              <Link
                key={child.id}
                href={`/category/${child.slug}`}
                className="rounded-lg border border-secondary-200 bg-white px-4 py-4 text-center text-sm font-medium text-secondary-700 transition-all hover:border-primary-300 hover:bg-primary-50 hover:text-primary-700"
              >
                {child.name}
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* 无子分类时显示 EmptyStateAIDialog */}
      {(isL1 || isL2) && children.length === 0 && (
        <EmptyStateAIDialog
          categoryName={category.name}
          categorySlug={slug}
          parentCategories={parent ? [parent.name] : []}
        />
      )}

      {/* L3 分类显示产品 */}
      {isL3 && (
        <>
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm text-secondary-500">{productsResult.totalDocs} products</p>
          </div>

          {productsResult.docs.length > 0 ? (
            <Suspense fallback={<div className="h-96 animate-pulse rounded bg-secondary-100" />}>
              <ProductGrid products={productsResult.docs} view="list" />
            </Suspense>
          ) : (
            <EmptyStateAIDialog
              categoryName={category.name}
              categorySlug={slug}
              parentCategories={[grandparent?.name, parent?.name].filter(Boolean) as string[]}
            />
          )}
        </>
      )}

      {/* SEO 内容 */}
      {(hasRichTextContent(category.description) || hasRichTextContent(category.buying_guide) || hasRichTextContent(category.seo_content) || faqList.length > 0) && (
        <section className="mt-12 border-t border-secondary-200 pt-8">
          {hasRichTextContent(category.description) && (
            <div className="mb-10">
              <div className="prose prose-sm prose-secondary max-w-none text-secondary-600" dangerouslySetInnerHTML={{ __html: lexicalToHtml(category.description) }} />
            </div>
          )}
          {hasRichTextContent(category.buying_guide) && (
            <div className="mb-10">
              <h2 className="mb-4 text-lg font-bold text-secondary-900">How to Choose the Right {category.name}</h2>
              <div className="prose prose-sm prose-secondary max-w-none text-secondary-600" dangerouslySetInnerHTML={{ __html: lexicalToHtml(category.buying_guide) }} />
            </div>
          )}
          {hasRichTextContent(category.seo_content) && (
            <div className="mb-10">
              <div className="prose prose-sm prose-secondary max-w-none text-secondary-600" dangerouslySetInnerHTML={{ __html: lexicalToHtml(category.seo_content) }} />
            </div>
          )}
          {faqList.length > 0 && (
            <FAQSection faqs={faqList} title="Frequently Asked Questions" />
          )}
        </section>
      )}

      {/* FAQ Schema */}
      {faqList.length > 0 && (
        <FAQSchema faqs={faqList} />
      )}
    </div>
  )
}
