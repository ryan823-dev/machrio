import { Suspense } from 'react'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Breadcrumbs } from '@/components/shared/Breadcrumbs'
import { FAQSchema, FAQSection } from '@/components/shared/FAQSchema'
import { StructuredData } from '@/components/shared/StructuredData'
import { CategoryBuyingGuide } from '@/components/shared/RelatedGuide'
import { ProductGrid } from '@/components/category/ProductGrid'
import { ExpandableIntro } from '@/components/category/ExpandableIntro'
import { EmptyStateAIDialog } from '@/components/category/EmptyStateAIDialog'

// 强制动态渲染，但使用静态数据
export const dynamic = 'force-dynamic'

// =============================================
// 类型定义
// =============================================

interface ProductCardData {
  id: string
  name: string
  slug: string
  categorySlug: string
  sku: string
  brand: string
  primaryImage: string | null
  shortDescription: string
  pricing: {
    basePrice: number | null
    currency: string
    priceUnit?: string
  }
  purchaseMode: 'both' | 'buy-online' | 'rfq-only'
  availability: string
  packageQty?: number
  packageUnit?: string
}

// =============================================
// 辅助函数
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
// 静态数据查询函数（使用 await import）
// =============================================

interface CategoryData {
  category: {
    id: string
    name: string
    slug: string
    shortDescription?: string
    introContent?: string
    description?: unknown
    buyingGuide?: unknown
    faq?: Array<{ question: string; answer: string }>
    displayOrder: number
  }
  parent: {
    id: string
    name: string
    slug: string
  } | null
  grandparent: {
    id: string
    name: string
    slug: string
  } | null
  children: Array<{
    id: string
    name: string
    slug: string
  }>
  productCount: number
}

// 从数据库获取分类数据
async function getCategoryDataFromDb(slug: string): Promise<CategoryData | null> {
  const { getCategoryBySlug: getDbCategory } = await import('@/lib/db-queries')
  const { staticL2Categories } = await import('@/data/static-catalog')

  const dbData = await getDbCategory(slug)
  if (!dbData) return null

  const { category, parent, grandparent, children, productCount } = dbData

  return {
    category: {
      id: category.id,
      name: category.name,
      slug: category.slug,
      displayOrder: category.display_order || 0,
    },
    parent: parent ? { id: parent.id, name: parent.name, slug: parent.slug } : null,
    grandparent: grandparent ? { id: grandparent.id, name: grandparent.name, slug: grandparent.slug } : null,
    children: children.map(c => ({ id: c.id, name: c.name, slug: c.slug })),
    productCount,
  }
}

async function getStaticCategoryData(slug: string): Promise<CategoryData | null> {
  // 优先从数据库获取
  try {
    const dbData = await getCategoryDataFromDb(slug)
    if (dbData) return dbData
  } catch (e) {
    console.error('Database query failed, falling back to static data:', e)
  }

  // Fallback to static data
  const { getCategoryBySlug } = await import('@/data/static-catalog')

  const data = getCategoryBySlug(slug)
  if (!data) return null

  const { category, parent, grandparent } = data

  // Get children from static L2 categories
  let children: Array<{ id: string; name: string; slug: string }> = []
  if (category.level === 1) {
    children = staticL2Categories.filter(c => c.parentSlug === slug)
      .map(c => ({ id: c.id, name: c.name, slug: c.slug }))
  }

  return {
    category: {
      id: category.id,
      name: category.name,
      slug: category.slug,
      shortDescription: category.shortDescription,
      introContent: category.introContent,
      description: category.description,
      buyingGuide: category.buyingGuide,
      faq: category.faq,
      displayOrder: category.displayOrder,
    },
    parent: parent ? { id: parent.id, name: parent.name, slug: parent.slug } : null,
    grandparent: grandparent ? { id: grandparent.id, name: grandparent.name, slug: grandparent.slug } : null,
    children,
    productCount: 0,
  }
}

async function getStaticProducts(slug: string, isL1: boolean): Promise<{ docs: ProductCardData[]; totalDocs: number }> {
  // 使用动态 import 加载静态数据
  const { getProductsByCategorySlug, getProductsByL1Slug } = await import('@/data/static-catalog')

  const result = isL1 ? getProductsByL1Slug(slug) : getProductsByCategorySlug(slug)

  return {
    docs: result.docs.map(p => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      categorySlug: slug,
      sku: p.sku,
      brand: p.brand || 'Industrial',
      primaryImage: p.primaryImage,
      shortDescription: p.shortDescription,
      pricing: { basePrice: p.pricing.basePrice, currency: 'USD' },
      purchaseMode: 'both' as const,
      availability: 'in-stock',
    })),
    totalDocs: result.totalDocs,
  }
}

// =============================================
// 页面组件
// =============================================

interface CategoryPageProps {
  params: Promise<{ slug: string }>
}

const PRODUCTS_PER_PAGE = 24

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const { slug } = await params
  const data = await getStaticCategoryData(slug)

  if (!data) {
    return { title: 'Category Not Found' }
  }

  const { category, parent, grandparent } = data
  const parentName = parent ? `${parent.name} - ` : ''
  const gpName = grandparent ? `${grandparent.name} - ` : ''
  const title = `${category.name} | ${gpName}${parentName}Machrio Industrial Supplies`
  const description = category.shortDescription || `Browse ${category.name} at Machrio.`

  return {
    title,
    description,
    alternates: { canonical: `/category/${slug}/` },
    openGraph: { title, description },
  }
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { slug } = await params
  const data = await getStaticCategoryData(slug)

  if (!data) {
    notFound()
  }

  const { category, parent, grandparent, children } = data

  // 判断分类层级
  const isL1 = !parent
  const isL2 = !!parent && !grandparent
  const isL3 = !!parent && !!grandparent

  // 获取产品
  const productsResult = await getStaticProducts(slug, isL1)

  // 构建面包屑
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

  return (
    <div className="container-main pb-12">
      <Breadcrumbs items={breadcrumbs} />
      {itemListSchema && <StructuredData data={itemListSchema} />}

      {/* 分类标题 */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-secondary-900">{category.name}</h1>
        {category.introContent ? (
          <ExpandableIntro content={category.introContent} />
        ) : (
          <p className="mt-2 text-sm leading-relaxed text-secondary-600">
            {category.shortDescription || `Browse our selection of ${category.name} products.`}
          </p>
        )}
      </div>

      <CategoryBuyingGuide categorySlug={slug} />

      {/* 子分类展示（L1 或 L2 分类） */}
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

      {/* 空状态 */}
      {(isL1 || isL2) && children.length === 0 && (
        <EmptyStateAIDialog
          categoryName={category.name}
          categorySlug={slug}
          parentCategories={parent ? [parent.name] : []}
        />
      )}

      {/* 产品列表（L1 或 L3 分类） */}
      {(isL1 || isL3) && (
        <>
          {productsResult.totalDocs > 0 ? (
            <>
              <div className="mb-4 flex items-center justify-between">
                <p className="text-sm text-secondary-500">{productsResult.totalDocs} products</p>
                {isL1 && (
                  <Link href={`/category/${slug}`} className="text-sm text-primary-600 hover:text-primary-800">
                    View all products →
                  </Link>
                )}
              </div>

              <Suspense fallback={<div className="h-96 animate-pulse rounded bg-secondary-100" />}>
                <ProductGrid products={productsResult.docs} view="list" />
              </Suspense>
            </>
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
      {productsResult.totalDocs > 0 && (
        <section className="mt-12 border-t border-secondary-200 pt-8">
          {hasRichTextContent(category.description) && (
            <div className="mb-10">
              <div
                className="prose prose-sm prose-secondary max-w-none text-secondary-600"
                dangerouslySetInnerHTML={{ __html: lexicalToHtml(category.description) }}
              />
            </div>
          )}
          {hasRichTextContent(category.buyingGuide) && (
            <div className="mb-10">
              <h2 className="mb-4 text-lg font-bold text-secondary-900">How to Choose the Right {category.name}</h2>
              <div
                className="prose prose-sm prose-secondary max-w-none text-secondary-600"
                dangerouslySetInnerHTML={{ __html: lexicalToHtml(category.buyingGuide) }}
              />
            </div>
          )}
          {category.faq && category.faq.length > 0 && (
            <FAQSection faqs={category.faq} title="Frequently Asked Questions" />
          )}
        </section>
      )}

      {/* FAQ Schema */}
      {category.faq && category.faq.length > 0 && (
        <FAQSchema faqs={category.faq} />
      )}
    </div>
  )
}
