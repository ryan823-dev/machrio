import { Suspense } from 'react'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getPayload } from 'payload'
import config from '@payload-config'
import { Breadcrumbs } from '@/components/shared/Breadcrumbs'
import { FAQSchema, FAQSection } from '@/components/shared/FAQSchema'
import { StructuredData } from '@/components/shared/StructuredData'
import { CategoryBuyingGuide } from '@/components/shared/RelatedGuide'
import { ProductGrid } from '@/components/category/ProductGrid'
import { FilterBar, DesktopSortBar } from '@/components/category/FilterBar'
import { ExpandableIntro } from '@/components/category/ExpandableIntro'
import { EmptyStateAIDialog } from '@/components/category/EmptyStateAIDialog'

// 使用 ISR，每 5 分钟重新验证一次
export const revalidate = 300

// ---------------------------------------------------------------------------
// Lexical richText rendering helpers
// ---------------------------------------------------------------------------

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

const PRODUCTS_PER_PAGE = 24

interface CategoryPageProps {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ page?: string; brand?: string; minPrice?: string; maxPrice?: string; sort?: string; view?: string; [key: string]: string | undefined }>
}

// 简化版：只获取分类信息和直接子分类（不递归查询孙分类）
async function getCategoryData(slug: string) {
  try {
    const payload = await getPayload({ config })
    
    // 获取分类
    const result = await payload.find({
      collection: 'categories',
      where: { slug: { equals: slug } },
      limit: 1,
    })
    if (result.docs.length === 0) return null

    const category = result.docs[0]

    // 并行获取父分类和子分类
    let parent = null
    let grandparent = null
    let children: any[] = []

    const parentId = category.parent ? (typeof category.parent === 'object' ? category.parent.id : category.parent) : null

    const [parentResult, childrenResult] = await Promise.all([
      parentId ? payload.findByID({ collection: 'categories', id: parentId }).catch(() => null) : Promise.resolve(null),
      payload.find({
        collection: 'categories',
        where: { parent: { equals: category.id } },
        sort: 'displayOrder',
        limit: 50,
      }).then(r => r.docs).catch(() => []),
    ])

    parent = parentResult
    children = childrenResult

    // 如果有父分类，再获取祖父分类
    if (parent?.parent) {
      const gpId = typeof parent.parent === 'object' ? parent.parent.id : parent.parent
      grandparent = await payload.findByID({ collection: 'categories', id: gpId }).catch(() => null)
    }

    return { category, parent, grandparent, children }
  } catch {
    return null
  }
}

// 简化版：获取产品（直接查询，不递归）
async function getCategoryProducts(categoryId: string, page: number, sort: string) {
  try {
    const payload = await getPayload({ config })
    
    const result = await payload.find({
      collection: 'products',
      where: {
        primaryCategory: { equals: categoryId },
        status: { equals: 'published' },
      },
      limit: PRODUCTS_PER_PAGE,
      page,
      sort,
      depth: 2,
    })

    return result
  } catch {
    return { docs: [], totalDocs: 0, page: 1, totalPages: 1, hasNextPage: false, hasPrevPage: false }
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

export async function generateMetadata({ params, searchParams }: CategoryPageProps): Promise<Metadata> {
  const { slug } = await params
  const resolvedSearchParams = await searchParams
  const data = await getCategoryData(slug)
  if (!data) return { title: 'Category Not Found' }

  const { category, parent, grandparent } = data
  const parentName = parent ? `${parent.name} - ` : ''
  const gpName = grandparent ? `${grandparent.name} - ` : ''
  const title = `${category.name} | ${gpName}${parentName}Machrio Industrial Supplies`
  const description = category.shortDescription || `Browse ${category.name} at Machrio. Industrial-grade products with transparent pricing.`

  const hasFilterParams = !!(resolvedSearchParams.brand || resolvedSearchParams.minPrice || resolvedSearchParams.maxPrice || resolvedSearchParams.sort)

  return {
    title,
    description,
    alternates: { canonical: `/category/${slug}/` },
    robots: hasFilterParams ? { index: false, follow: true } : { index: true, follow: true },
    openGraph: { title, description },
  }
}

export default async function CategoryPage({ params, searchParams }: CategoryPageProps) {
  const { slug } = await params
  const resolvedSearchParams = await searchParams
  const { page: pageParam, sort: sortParam } = resolvedSearchParams
  const currentPage = Math.max(1, parseInt(pageParam || '1', 10))

  const data = await getCategoryData(slug)
  if (!data) notFound()

  const { category, parent, grandparent, children } = data

  // 判断分类层级
  const isL1 = !parent && !grandparent
  const isL2 = parent && !grandparent
  const isL3 = parent && grandparent

  // 排序参数
  let sortField = '-createdAt'
  if (sortParam === 'price-asc') sortField = 'pricing.basePrice'
  else if (sortParam === 'price-desc') sortField = '-pricing.basePrice'
  else if (sortParam === 'name') sortField = 'name'

  // 只有 L3 分类才显示产品列表
  let productsResult = { docs: [], totalDocs: 0, page: 1, totalPages: 1, hasNextPage: false, hasPrevPage: false }
  if (isL3) {
    productsResult = await getCategoryProducts(category.id, currentPage, sortField)
  }

  const products = productsResult.docs.map(p => mapProductToCard(p as unknown as Record<string, unknown>))

  // 面包屑
  const breadcrumbs = [
    { label: 'Home', href: '/' },
    ...(grandparent ? [{ label: grandparent.name, href: `/category/${grandparent.slug}` }] : []),
    ...(parent ? [{ label: parent.name, href: `/category/${parent.slug}` }] : []),
    { label: category.name },
  ]

  const serverUrl = process.env.NEXT_PUBLIC_SERVER_URL || 'https://machrio.com'

  const itemListSchema = products.length > 0 ? {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: `${category.name} - Industrial Supplies`,
    numberOfItems: productsResult.totalDocs,
    itemListElement: products.slice(0, 20).map((p, idx) => ({
      '@type': 'ListItem',
      position: idx + 1,
      url: `${serverUrl}/product/${p.categorySlug}/${p.slug}/`,
      name: p.name,
    })),
  } : null

  // 分页 URL 构建
  const buildPageUrl = (pageNum: number) => {
    const params = new URLSearchParams()
    params.set('page', String(pageNum))
    if (sortParam) params.set('sort', sortParam)
    return `/category/${slug}?${params.toString()}`
  }

  return (
    <div className="container-main pb-12">
      <Breadcrumbs items={breadcrumbs} />
      {itemListSchema && <StructuredData data={itemListSchema} />}

      {/* Category Hero */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-secondary-900">{category.name}</h1>
        {category.introContent ? (
          <ExpandableIntro content={category.introContent as string} />
        ) : (
          <p className="mt-2 text-sm leading-relaxed text-secondary-600">
            {category.shortDescription || `Browse our selection of ${category.name} products.`}
          </p>
        )}
      </div>

      {/* Buying Guide Banner */}
      <CategoryBuyingGuide categorySlug={slug} />

      {/* L1/L2: 显示子分类卡片 */}
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

      {/* L1/L2 无子分类时显示 AI 对话 */}
      {(isL1 || isL2) && children.length === 0 && (
        <EmptyStateAIDialog
          categoryName={category.name}
          categorySlug={slug}
          parentCategories={parent ? [parent.name] : []}
        />
      )}

      {/* L3: 显示产品列表 */}
      {isL3 && (
        <>
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm text-secondary-500">{productsResult.totalDocs} products</p>
          </div>

          {products.length > 0 ? (
            <>
              <Suspense fallback={<div className="h-96 animate-pulse rounded bg-secondary-100" />}>
                <ProductGrid products={products} view="list" />
              </Suspense>

              {/* Pagination */}
              {productsResult.totalPages > 1 && (
                <div className="mt-8 flex items-center justify-center gap-2">
                  {productsResult.hasPrevPage && (
                    <Link href={buildPageUrl(currentPage - 1)} className="rounded border border-secondary-300 px-4 py-2 text-sm text-secondary-600 hover:bg-secondary-50">
                      Previous
                    </Link>
                  )}
                  <span className="px-4 text-sm text-secondary-500">
                    Page {currentPage} of {productsResult.totalPages}
                  </span>
                  {productsResult.hasNextPage && (
                    <Link href={buildPageUrl(currentPage + 1)} className="rounded border border-secondary-300 px-4 py-2 text-sm text-secondary-600 hover:bg-secondary-50">
                      Next
                    </Link>
                  )}
                </div>
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

      {/* SEO Content */}
      {totalDocs > 0 && (
        <section className="mt-12 border-t border-secondary-200 pt-8">
          {hasRichTextContent(category.description) && (
            <div className="mb-10">
              <div className="prose prose-sm prose-secondary max-w-none text-secondary-600" dangerouslySetInnerHTML={{ __html: lexicalToHtml(category.description) }} />
            </div>
          )}
          {hasRichTextContent(category.buyingGuide) && (
            <div className="mb-10">
              <h2 className="mb-4 text-lg font-bold text-secondary-900">How to Choose the Right {category.name}</h2>
              <div className="prose prose-sm prose-secondary max-w-none text-secondary-600" dangerouslySetInnerHTML={{ __html: lexicalToHtml(category.buyingGuide) }} />
            </div>
          )}
          {Array.isArray(category.faq) && category.faq.length > 0 && (
            <FAQSection faqs={category.faq.map((item: { question?: string; answer?: string }) => ({ question: item.question || '', answer: item.answer || '' }))} title="Frequently Asked Questions" />
          )}
        </section>
      )}

      {Array.isArray(category.faq) && category.faq.length > 0 && (
        <FAQSchema faqs={category.faq.map((item: { question?: string; answer?: string }) => ({ question: item.question || '', answer: item.answer || '' }))} />
      )}
    </div>
  )
}