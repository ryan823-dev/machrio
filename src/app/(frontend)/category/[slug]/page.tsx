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
import { Pagination } from '@/components/category/Pagination'
import { HowToChoose } from '@/components/category/HowToChoose'
import { ProductRecommendation } from '@/components/category/ProductRecommendation'
import { EnhancedFAQ } from '@/components/category/EnhancedFAQ'
import { SubcategoryGrid } from '@/components/category/SubcategoryGrid'

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
  productCount?: number
}

// 使用 PostgreSQL 直接查询获取分类数据（纯数据库，无回退）
async function getCategoryData(slug: string) {
  const pool = getPool()

  // 获取分类信息（包含所有 SEO 字段）
  const catResult = await pool.query<CategoryRow>(
    `SELECT id, name, slug, short_description, intro_content, description, buying_guide, faq, seo_content, parent_id, display_order
     FROM categories WHERE slug = $1`,
    [slug]
  )

  if (catResult.rows.length === 0) {
    return null
  }

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

  // 获取子分类（包含产品数量）
  const childrenResult = await pool.query<ChildCategory>(
    `SELECT c.id, c.name, c.slug, 
            COALESCE(COUNT(p.id), 0)::int as "productCount"
     FROM categories c
     LEFT JOIN products p ON p.primary_category_id = c.id AND p.status = 'published'
     WHERE c.parent_id = $1::uuid
     GROUP BY c.id
     ORDER BY c.display_order
     LIMIT 50`,
    [category.id]
  )
  const children = childrenResult.rows

  return { category, parent, grandparent, children }
}

// 获取分类产品（支持分页）
async function getCategoryProducts(categoryId: string, categorySlug: string, page: number = 1) {
  const PRODUCTS_PER_PAGE = 24
  const pool = getPool()

  // 获取产品总数（只统计已发布产品，与列表查询条件一致）
  const countResult = await pool.query<{ count: string }>(
    "SELECT COUNT(*) FROM products WHERE primary_category_id = $1::uuid AND status = 'published'",
    [categoryId]
  )
  const totalDocs = parseInt(countResult.rows[0].count)
  const totalPages = Math.ceil(totalDocs / PRODUCTS_PER_PAGE)

  // 计算偏移量
  const offset = (page - 1) * PRODUCTS_PER_PAGE

  // 获取产品（包含图片和价格）
  const productsResult = await pool.query(
    `SELECT id, name, slug, sku, short_description, pricing, external_image_url, status
     FROM products
     WHERE primary_category_id = $1::uuid AND status = 'published'
     ORDER BY name
     LIMIT $2 OFFSET $3`,
    [categoryId, PRODUCTS_PER_PAGE, offset]
  )

    const docs = productsResult.rows.map((p) => {
      // Use external_image_url directly
      let imageUrl: string | undefined = p.external_image_url || undefined

      // 解析 pricing（可能是 JSON 字符串或已解析的对象）
      let basePrice: number | undefined = undefined
      try {
        let pricingData = p.pricing
        if (typeof pricingData === 'string') {
          pricingData = JSON.parse(pricingData)
        }
        if (pricingData && typeof pricingData === 'object' && 'basePrice' in pricingData) {
          const rawPrice = (pricingData as { basePrice: unknown }).basePrice
          // Ensure basePrice is a valid number
          if (typeof rawPrice === 'number' && !isNaN(rawPrice)) {
            basePrice = rawPrice
          } else if (typeof rawPrice === 'string') {
            const parsed = parseFloat(rawPrice)
            if (!isNaN(parsed)) {
              basePrice = parsed
            }
          }
        }
      } catch {
        basePrice = undefined
      }

      return {
        id: p.id,
        name: p.name,
        slug: p.slug,
        categorySlug: categorySlug,
        sku: p.sku ?? '',
        brand: 'Industrial',
        primaryImage: imageUrl,
        shortDescription: p.short_description || '',
        pricing: { basePrice, currency: 'USD' },
        purchaseMode: 'both' as const,
        availability: 'in-stock',
      }
    })

  return {
    docs,
    totalDocs,
    page,
    totalPages,
    hasMore: page < totalPages,
  }
}

interface CategoryPageProps {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ page?: string }>
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
    alternates: { canonical: `/category/${slug}` },
    openGraph: { title, description },
  }
}

export default async function CategoryPage({ params, searchParams }: CategoryPageProps) {
  const { slug } = await params
  const { page: pageParam } = await searchParams
  const currentPage = parseInt(pageParam || '1', 10)

  const data = await getCategoryData(slug)
  if (!data) notFound()

  const { category, parent, grandparent, children } = data

  const isL1 = !parent && !grandparent
  const isL2 = parent && !grandparent
  const isL3 = parent && grandparent

  // 判断是否为叶子分类（没有子分类）
  const isLeafCategory = children.length === 0

  // 只在叶子分类或 L3 分类显示产品
  const productsResult = isL3 || isLeafCategory
    ? await getCategoryProducts(category.id, slug, currentPage)
    : { docs: [], totalDocs: 0, page: 1, totalPages: 0, hasMore: false }

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
        ) : hasRichTextContent(category.description) ? (
          <div className="mt-2 prose prose-sm prose-secondary max-w-none text-secondary-600" dangerouslySetInnerHTML={{ __html: lexicalToHtml(category.description) }} />
        ) : (
          <p className="mt-2 text-sm leading-relaxed text-secondary-600">
            {category.short_description || `Browse our selection of ${category.name} products.`}
          </p>
        )}
      </div>

      <CategoryBuyingGuide categorySlug={slug} />

      {/* L1/L2: Show subcategories with product counts */}
      {(isL1 || isL2) && children.length > 0 && (
        <SubcategoryGrid 
          categorySlug={slug}
          categoryName={category.name}
          subcategories={children}
        />
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
            <>
              <Suspense fallback={<div className="h-96 animate-pulse rounded bg-secondary-100" />}>
                <ProductGrid products={productsResult.docs} view="list" />
              </Suspense>

              {/* 分页组件 */}
              {productsResult.totalPages > 1 && (
                <Pagination
                  currentPage={productsResult.page}
                  totalPages={productsResult.totalPages}
                  basePath={`/category/${slug}`}
                />
              )}
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

      {/* SEO Content Modules */}
      <section className="mt-12 border-t border-secondary-200 pt-8">
        {/* How to Choose (for L3 or if buying_guide exists) */}
        {(isL3 || !isL3) && category.buying_guide && hasRichTextContent(category.buying_guide) && (
          <HowToChoose
            categorySlug={slug}
            categoryName={category.name}
            buyingGuideContent={category.buying_guide}
          />
        )}
        
        {/* Product Recommendation (for L1/L2/L3) */}
        {(isL1 || isL2 || isL3) && (
          <ProductRecommendation
            categoryId={category.id}
            categorySlug={slug}
            categoryName={category.name}
            limit={isL3 ? 4 : 8}
          />
        )}
        
        {/* Enhanced FAQ */}
        {faqList.length > 0 && (
          <EnhancedFAQ
            faqs={faqList}
            categoryName={category.name}
          />
        )}
        
        {/* Additional SEO Content */}
        {hasRichTextContent(category.seo_content) && (
          <div className="mb-10">
            <div 
              className="prose prose-sm prose-secondary max-w-none text-secondary-600"
              dangerouslySetInnerHTML={{ __html: lexicalToHtml(category.seo_content) }}
            />
          </div>
        )}
      </section>

      {/* FAQ Schema */}
      {faqList.length > 0 && (
        <FAQSchema faqs={faqList} />
      )}
    </div>
  )
}
