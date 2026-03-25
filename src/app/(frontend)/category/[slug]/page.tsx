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
    seoContent?: unknown
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

// 从 nav-categories.json 获取分类层级关系（与导航一致）
async function getCategoryDataFromNav(slug: string): Promise<CategoryData | null> {
  const data = await import('@/data/nav-categories.json').then(m => m.default || m)

  // 遍历 L1
  for (const l1 of data.categories || []) {
    if (l1.slug === slug) {
      const category = { id: l1.id, name: l1.name, slug: l1.slug, shortDescription: l1.shortDescription }
      const children = l1.children ? l1.children.map(c => ({ id: c.id, name: c.name, slug: c.slug })) : []
      return { category, parent: null, grandparent: null, children, productCount: 0 }
    }

    // 遍历 L2
    if (l1.children) {
      for (const l2 of l1.children) {
        if (l2.slug === slug) {
          const category = { id: l2.id, name: l2.name, slug: l2.slug, shortDescription: l2.shortDescription }
          const parent = { id: l1.id, name: l1.name, slug: l1.slug }
          const children = l2.children ? l2.children.map(c => ({ id: c.id, name: c.name, slug: c.slug })) : []
          return { category, parent, grandparent: null, children, productCount: 0 }
        }

        // 遍历 L3
        if (l2.children) {
          for (const l3 of l2.children) {
            if (l3.slug === slug) {
              const category = { id: l3.id, name: l3.name, slug: l3.slug }
              const parent = { id: l2.id, name: l2.name, slug: l2.slug }
              const grandparent = { id: l1.id, name: l1.name, slug: l1.slug }
              return { category, parent, grandparent, children: [], productCount: 0 }
            }
          }
        }
      }
    }
  }

  return null
}

// 从数据库获取分类的 SEO 内容
async function getCategorySeoContent(slug: string): Promise<{
  shortDescription?: string
  introContent?: string
  description?: unknown
  buyingGuide?: unknown
  faq?: Array<{ question: string; answer: string }>
  seoContent?: unknown
} | null> {
  try {
    const { getCategoryBySlug } = await import('@/lib/db-queries')
    const result = await getCategoryBySlug(slug)
    if (!result) return null

    const { category } = result
    // 同时支持 camelCase 和 snake_case 字段名
    return {
      shortDescription: (category as any).short_description || (category as any).shortDescription || undefined,
      introContent: (category as any).intro_content || (category as any).introContent || undefined,
      description: (category as any).description || undefined,
      buyingGuide: (category as any).buying_guide || (category as any).buyingGuide || undefined,
      faq: (category as any).faq || undefined,
      seoContent: (category as any).seo_content || (category as any).seoContent || undefined,
    }
  } catch (e) {
    console.error('Failed to fetch SEO content from database:', e)
    return null
  }
}

// 组合函数：获取分类完整数据（层级关系 + SEO 内容）
async function getStaticCategoryData(slug: string): Promise<CategoryData | null> {
  // 1. 获取层级关系（从 nav-categories.json）
  const navData = await getCategoryDataFromNav(slug)
  if (!navData) return null

  // 2. 获取 SEO 内容（从数据库）
  const seoContent = await getCategorySeoContent(slug)

  // 3. 合并数据
  return {
    ...navData,
    category: {
      ...navData.category,
      shortDescription: seoContent?.shortDescription || navData.category.shortDescription,
      introContent: seoContent?.introContent,
      description: seoContent?.description,
      buyingGuide: seoContent?.buyingGuide,
      faq: seoContent?.faq,
      seoContent: seoContent?.seoContent,
    },
  }
}

async function getProducts(slug: string): Promise<{ docs: ProductCardData[]; totalDocs: number }> {
  // 优先从数据库获取产品
  try {
    const { getProductsByCategorySlug } = await import('@/lib/db-queries')
    const result = await getProductsByCategorySlug(slug, 1, 24)

    return {
      docs: result.products.map(p => {
        // 提取图片 URL
        let imageUrl: string | null = null
        if (p.images && Array.isArray(p.images) && p.images.length > 0) {
          imageUrl = p.images[0].url || null
        }

        // 提取价格
        let basePrice: number | null = null
        if (p.pricing && typeof p.pricing === 'object' && 'basePrice' in p.pricing) {
          basePrice = (p.pricing as { basePrice: number }).basePrice
        }

        return {
          id: p.id,
          name: p.name,
          slug: p.slug,
          categorySlug: slug,
          sku: p.sku,
          brand: 'Industrial',
          primaryImage: imageUrl,
          shortDescription: p.short_description || '',
          pricing: { basePrice, currency: 'USD' },
          purchaseMode: 'both' as const,
          availability: 'in-stock',
        }
      }),
      totalDocs: result.totalCount,
    }
  } catch (e) {
    console.error('Failed to fetch products from database:', e)
    return { docs: [], totalDocs: 0 }
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
  const productsResult = await getProducts(slug)

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

      {/* 子分类展示（L1 和 L2 分类） */}
      {(isL1 || isL2) && children.length > 0 && (
        <section className="mb-8">
          <h2 className="mb-4 text-lg font-semibold text-secondary-800">
            {isL1 ? `Browse ${category.name} Categories` : `Browse ${category.name} Subcategories`}
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

      {/* L2 无子分类时显示引导 */}
      {isL2 && children.length === 0 && (
        <div className="rounded-lg border border-secondary-200 bg-secondary-50 p-6 text-center">
          <p className="text-secondary-600">
            Explore our {category.name} products by browsing the categories above or using the search.
          </p>
        </div>
      )}

      {/* 产品列表（L2 无子分类时或 L3 分类） */}
      {/* L2 有 L3 子分类时不显示产品列表，引导用户进入 L3 */}
      {((isL2 && children.length === 0) || isL3) && (
        <>
          {productsResult.totalDocs > 0 ? (
            <>
              <div className="mb-4 flex items-center justify-between">
                <p className="text-sm text-secondary-500">{productsResult.totalDocs} products</p>
                {(isL1 || isL2) && (
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

      {/* SEO 内容（所有分类层级） */}
      {(hasRichTextContent(category.description) || hasRichTextContent(category.buyingGuide) || hasRichTextContent(category.seoContent) || (category.faq && category.faq.length > 0)) && (
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
          {hasRichTextContent(category.seoContent) && (
            <div className="mb-10">
              <div
                className="prose prose-sm prose-secondary max-w-none text-secondary-600"
                dangerouslySetInnerHTML={{ __html: lexicalToHtml(category.seoContent) }}
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
