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
import { SubcategoryGrid } from '@/components/category/SubcategoryGrid'
import { FilterBar, DesktopSortBar } from '@/components/category/FilterBar'
import { ExpandableIntro } from '@/components/category/ExpandableIntro'

export const dynamic = 'force-dynamic'

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

/** Check if a Lexical richText field has actual content */
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
  searchParams: Promise<{ page?: string; brand?: string; minPrice?: string; maxPrice?: string; sort?: string; view?: string }>
}

async function getCategoryBySlug(slug: string) {
  try {
    const payload = await getPayload({ config })
    const result = await payload.find({
      collection: 'categories',
      where: { slug: { equals: slug } },
      limit: 1,
    })
    if (result.docs.length === 0) return null

    const category = result.docs[0]

    // Resolve parent for breadcrumbs
    let parent = null
    if (category.parent) {
      const parentId = typeof category.parent === 'object' ? category.parent.id : category.parent
      try {
        parent = await payload.findByID({ collection: 'categories', id: parentId })
      } catch { /* parent not found */ }
    }

    return { category, parent }
  } catch {
    return null
  }
}

async function getSubcategories(categoryId: string) {
  try {
    const payload = await getPayload({ config })
    const children = await payload.find({
      collection: 'categories',
      where: { parent: { equals: categoryId } },
      sort: 'displayOrder',
      limit: 50,
    })

    // Get product counts for each subcategory (including grandchildren)
    const subcats = await Promise.all(
      children.docs.map(async (child) => {
        try {
          // Get grandchildren to include in count
          const grandchildren = await payload.find({
            collection: 'categories',
            where: { parent: { equals: child.id } },
            limit: 200,
          })
          const allIds = [child.id, ...grandchildren.docs.map(gc => gc.id)]
          const count = await payload.count({
            collection: 'products',
            where: {
              primaryCategory: { in: allIds },
              status: { equals: 'published' },
            },
          })
          return { name: child.name, slug: child.slug, productCount: count.totalDocs }
        } catch {
          return { name: child.name, slug: child.slug, productCount: 0 }
        }
      })
    )
    return subcats
  } catch {
    return []
  }
}

async function getProducts(categoryId: string, childIds: string[], page: number, sort: string = '-createdAt') {
  try {
    const payload = await getPayload({ config })
    const allCategoryIds = [categoryId, ...childIds]

    const result = await payload.find({
      collection: 'products',
      where: {
        primaryCategory: { in: allCategoryIds },
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

interface FilterOptions {
  brandSlug?: string
  minPrice?: number
  maxPrice?: number
}

async function getFilteredProducts(
  categoryId: string,
  childIds: string[],
  page: number,
  filters: FilterOptions,
  sort: string = '-createdAt'
) {
  try {
    const payload = await getPayload({ config })
    const allCategoryIds = [categoryId, ...childIds]

    // Build where clause
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const whereConditions: any[] = [
      { primaryCategory: { in: allCategoryIds } },
      { status: { equals: 'published' } },
    ]

    // Brand filter
    if (filters.brandSlug) {
      // First get brand ID from slug
      const brandResult = await payload.find({
        collection: 'brands',
        where: { slug: { equals: filters.brandSlug } },
        limit: 1,
      })
      if (brandResult.docs.length > 0) {
        whereConditions.push({ brand: { equals: brandResult.docs[0].id } })
      }
    }

    // Price filters
    if (filters.minPrice !== undefined && filters.minPrice > 0) {
      whereConditions.push({ 'pricing.basePrice': { greater_than_equal: filters.minPrice } })
    }
    if (filters.maxPrice !== undefined && filters.maxPrice > 0) {
      whereConditions.push({ 'pricing.basePrice': { less_than_equal: filters.maxPrice } })
    }

    const result = await payload.find({
      collection: 'products',
      where: { and: whereConditions },
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

async function getCategoryBrands(categoryId: string, childIds: string[]) {
  try {
    const payload = await getPayload({ config })
    const allCategoryIds = [categoryId, ...childIds]

    // Get all products in category with brand populated
    const products = await payload.find({
      collection: 'products',
      where: {
        primaryCategory: { in: allCategoryIds },
        status: { equals: 'published' },
      },
      limit: 1000,
      depth: 1,
    })

    // Count products per brand
    const brandCounts = new Map<string, { name: string; slug: string; count: number }>()
    for (const product of products.docs) {
      const brand = product.brand as unknown as Record<string, unknown> | null
      if (brand && typeof brand === 'object') {
        const slug = brand.slug as string
        const name = brand.name as string
        if (slug && name) {
          const existing = brandCounts.get(slug)
          if (existing) {
            existing.count++
          } else {
            brandCounts.set(slug, { name, slug, count: 1 })
          }
        }
      }
    }

    return Array.from(brandCounts.values()).sort((a, b) => b.count - a.count)
  } catch {
    return []
  }
}

async function getCategoryPriceRange(categoryId: string, childIds: string[]) {
  try {
    const payload = await getPayload({ config })
    const allCategoryIds = [categoryId, ...childIds]

    const products = await payload.find({
      collection: 'products',
      where: {
        primaryCategory: { in: allCategoryIds },
        status: { equals: 'published' },
        'pricing.basePrice': { greater_than: 0 },
      },
      limit: 1000,
    })

    let min = Infinity
    let max = 0
    for (const product of products.docs) {
      const pricing = product.pricing as Record<string, unknown> | undefined
      const price = pricing?.basePrice as number | undefined
      if (price && price > 0) {
        if (price < min) min = price
        if (price > max) max = price
      }
    }

    return { min: min === Infinity ? 0 : min, max }
  } catch {
    return { min: 0, max: 0 }
  }
}

function mapProductToCard(product: Record<string, unknown>) {
  const pricing = product.pricing as Record<string, unknown> | undefined
  const brand = product.brand as Record<string, unknown> | null

  // Resolve category slug for product URL
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

  // Resolve image URL: prefer uploaded primaryImage, fall back to externalImageUrl
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
    purchaseMode: (product.purchaseMode as 'both' | 'buy-online' | 'rfq-only') || 'both',
    availability: (product.availability as string) || 'contact',
  }
}

export async function generateMetadata({ params, searchParams }: CategoryPageProps): Promise<Metadata> {
  const { slug } = await params
  const resolvedSearchParams = await searchParams
  const data = await getCategoryBySlug(slug)
  if (!data) return { title: 'Category Not Found' }

  const { category, parent } = data
  const parentName = parent ? `${parent.name} - ` : ''
  const title = `${category.name} | ${parentName}Machrio Industrial Supplies`
  
  // SEO-optimized meta description with keyword-rich fallback
  const description = category.shortDescription ||
    generateCategoryDescription(category.name, parent?.name)

  const serverUrl = process.env.NEXT_PUBLIC_SERVER_URL || 'https://machrio.com'

  // SEO: noindex pages with sort/filter params to prevent duplicate content
  // Only clean category pages and pagination are indexable
  const hasFilterParams = !!(resolvedSearchParams.brand || resolvedSearchParams.minPrice || resolvedSearchParams.maxPrice || resolvedSearchParams.sort)

  return {
    title,
    description,
    alternates: { canonical: `/category/${slug}/` },
    robots: hasFilterParams
      ? { index: false, follow: true }
      : { index: true, follow: true },
    openGraph: {
      title,
      description,
      url: `${serverUrl}/category/${slug}/`,
    },
    twitter: {
      card: 'summary',
      title,
      description,
    },
  }
}

/**
 * Generate SEO-optimized meta description for categories without shortDescription
 * AEO: Structured for AI extraction with clear value propositions
 */
function generateCategoryDescription(categoryName: string, parentName?: string): string {
  const categoryLower = categoryName.toLowerCase()
  const parentContext = parentName ? ` in ${parentName}` : ''
  
  // Category-specific descriptions for top-level categories
  const categoryDescriptions: Record<string, string> = {
    'safety': `Shop industrial safety equipment including PPE, fall protection, eye & face protection, hearing protection, and workplace safety supplies. OSHA-compliant products with same-day shipping.`,
    'material handling': `Browse material handling equipment: casters, wheels, lifting devices, hoists, and transport solutions for warehouse and manufacturing. Industrial-grade quality with bulk pricing.`,
    'packaging & shipping': `Find packaging and shipping supplies: protective packaging, strapping, packing tape, cable ties, and shipping materials. Volume discounts available for B2B buyers.`,
    'adhesives & sealants & tape': `Industrial adhesives, sealants, and specialty tapes for manufacturing, construction, and maintenance. Professional-grade bonding solutions with technical support.`,
    'cleaning and janitorial': `Janitorial supplies and industrial cleaning products: facility cleaning, air filtration, floor care, and sanitation equipment. Bulk ordering with fast delivery.`,
    'lighting': `Industrial lighting solutions: task lights, jobsite lighting, flashlights, and facility lighting. Energy-efficient options for workplace illumination.`,
    'tool storage & workbenches': `Shop tool storage and workbenches: industrial shelving, storage cabinets, workstations, and shop organization. Heavy-duty construction for demanding environments.`,
    'power transmission': `Power transmission components: seals, gaskets, bearings, belts, and drive components. OEM-quality replacement parts with technical specifications.`,
    'plumbing & pumps': `Plumbing and pump supplies: valves, hose fittings, pipes, and fluid handling equipment. Industrial-grade components for commercial applications.`,
  }
  
  // Check for exact match first
  if (categoryDescriptions[categoryLower]) {
    return categoryDescriptions[categoryLower]
  }
  
  // Generate description for subcategories
  return `Browse ${categoryName}${parentContext} at Machrio. Industrial-grade products with transparent pricing, bulk discounts, and same-day shipping. Request quotes for volume orders.`
}

export default async function CategoryPage({ params, searchParams }: CategoryPageProps) {
  const { slug } = await params
  const { page: pageParam, brand: brandFilter, minPrice: minPriceParam, maxPrice: maxPriceParam, sort: sortParam, view: viewParam } = await searchParams
  const currentPage = Math.max(1, parseInt(pageParam || '1', 10))
  const minPrice = minPriceParam ? parseFloat(minPriceParam) : undefined
  const maxPrice = maxPriceParam ? parseFloat(maxPriceParam) : undefined

  const data = await getCategoryBySlug(slug)
  if (!data) notFound()

  const { category, parent } = data

  // Get subcategories
  const subcategories = await getSubcategories(category.id)

  // Re-fetch child category IDs for product query (include grandchildren for level-1 categories)
  let childCategoryIds: string[] = []
  try {
    const payload = await getPayload({ config })
    const children = await payload.find({
      collection: 'categories',
      where: { parent: { equals: category.id } },
      limit: 50,
    })
    childCategoryIds = children.docs.map(c => c.id)
    // Also get grandchildren (level 3) where products actually live
    if (children.docs.length > 0) {
      const grandchildrenResults = await Promise.all(
        children.docs.map(child =>
          payload.find({
            collection: 'categories',
            where: { parent: { equals: child.id } },
            limit: 200,
          })
        )
      )
      const grandchildIds = grandchildrenResults.flatMap(r => r.docs.map(c => c.id))
      childCategoryIds = [...childCategoryIds, ...grandchildIds]
    }
  } catch { /* ignore */ }

  // Map sort param to Payload sort string
  let sortField = '-createdAt'
  if (sortParam === 'price-asc') sortField = 'pricing.basePrice'
  else if (sortParam === 'price-desc') sortField = '-pricing.basePrice'
  else if (sortParam === 'newest') sortField = '-createdAt'
  else if (sortParam === 'name') sortField = 'name'

  // Get filter data and products
  const hasFilters = brandFilter || minPrice || maxPrice
  const [brandsData, priceRangeData, productsResult] = await Promise.all([
    getCategoryBrands(category.id, childCategoryIds),
    getCategoryPriceRange(category.id, childCategoryIds),
    hasFilters
      ? getFilteredProducts(category.id, childCategoryIds, currentPage, {
          brandSlug: brandFilter,
          minPrice,
          maxPrice,
        }, sortField)
      : getProducts(category.id, childCategoryIds, currentPage, sortField),
  ])

  const products = productsResult.docs.map(p => mapProductToCard(p as unknown as Record<string, unknown>))
  const totalDocs = productsResult.totalDocs
  const totalPages = productsResult.totalPages

  // Build breadcrumbs
  const breadcrumbs = [
    { label: 'Home', href: '/' },
    ...(parent
      ? [{ label: parent.name, href: `/category/${parent.slug}` }]
      : []),
    { label: category.name },
  ]

  // Description text
  const descriptionText = category.shortDescription ||
    `Browse our selection of ${category.name} products for industrial and commercial applications.`

  // Build pagination query string
  const buildPageUrl = (pageNum: number) => {
    const params = new URLSearchParams()
    params.set('page', String(pageNum))
    if (brandFilter) params.set('brand', brandFilter)
    if (minPriceParam) params.set('minPrice', minPriceParam)
    if (maxPriceParam) params.set('maxPrice', maxPriceParam)
    if (sortParam) params.set('sort', sortParam)
    return `/category/${slug}?${params.toString()}`
  }

  const serverUrl = process.env.NEXT_PUBLIC_SERVER_URL || 'https://machrio.com'

  // Build ItemList schema for product listing
  const itemListSchema = products.length > 0 ? {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: `${category.name} - Industrial Supplies`,
    numberOfItems: totalDocs,
    itemListElement: products.slice(0, 20).map((p, idx) => ({
      '@type': 'ListItem',
      position: idx + 1,
      url: `${serverUrl}/product/${p.categorySlug}/${p.slug}/`,
      name: p.name,
    })),
  } : null

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
            {descriptionText}
          </p>
        )}
      </div>

      {/* Buying Guide Banner */}
      <CategoryBuyingGuide categorySlug={slug} />

      {/* Subcategory cards */}
      {subcategories.length > 0 && (
        <SubcategoryGrid items={subcategories} parentSlug={slug} />
      )}

      {/* Filter + Products Layout */}
      <div className="lg:grid lg:grid-cols-[220px_1fr] lg:gap-6">
        {/* Sidebar filters (desktop) + mobile filter toggle */}
        <div>
          <FilterBar
            categorySlug={slug}
            brands={brandsData}
            priceRange={priceRangeData}
            totalProducts={totalDocs}
          />
        </div>

        {/* Product area */}
        <div className="min-w-0">
          {/* Desktop sort bar - above products */}
          <DesktopSortBar
            categorySlug={slug}
            brands={brandsData}
            totalProducts={totalDocs}
          />
          
          {totalDocs > 0 ? (
            <>
              <Suspense fallback={<div className="h-96 animate-pulse rounded bg-secondary-100" />}>
                <ProductGrid products={products} view={(viewParam === 'grid' ? 'grid' : 'list')} />
              </Suspense>
            </>
          ) : (
            /* Empty state */
            <div className="flex flex-col items-center py-16 text-center">
              <svg className="h-16 w-16 text-secondary-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
              <h2 className="mt-4 text-lg font-semibold text-secondary-700">
                {hasFilters ? 'No products match your filters' : 'No products yet'}
              </h2>
              <p className="mt-2 max-w-md text-sm text-secondary-500">
                {hasFilters
                  ? 'Try adjusting your filters or clearing them to see more products.'
                  : `We're expanding our ${category.name} catalog. Need something specific? Submit a quote request and our sourcing team will find it for you.`}
              </p>
              {hasFilters ? (
                <Link
                  href={`/category/${slug}`}
                  className="btn-primary mt-6 px-8 py-2.5"
                >
                  Clear Filters
                </Link>
              ) : (
                <Link
                  href="/rfq"
                  className="btn-accent mt-6 px-8 py-2.5"
                >
                  Request a Quote
                </Link>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Pagination - below the grid */}
      {totalDocs > 0 && totalPages > 1 && (
        <div className="mt-8 flex items-center justify-center gap-2">
          {currentPage > 1 && (
            <Link
              href={buildPageUrl(currentPage - 1)}
              className="rounded border border-secondary-300 px-3 py-1.5 text-sm text-secondary-600 hover:bg-secondary-50"
            >
              Previous
            </Link>
          )}
          {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
            let pageNum: number
            if (totalPages <= 7) {
              pageNum = i + 1
            } else if (currentPage <= 4) {
              pageNum = i + 1
            } else if (currentPage >= totalPages - 3) {
              pageNum = totalPages - 6 + i
            } else {
              pageNum = currentPage - 3 + i
            }
            return (
              <Link
                key={pageNum}
                href={buildPageUrl(pageNum)}
                className={`rounded border px-3 py-1.5 text-sm ${
                  pageNum === currentPage
                    ? 'border-primary-200 bg-primary-50 font-medium text-primary-700'
                    : 'border-secondary-200 text-secondary-600 hover:bg-secondary-50'
                }`}
              >
                {pageNum}
              </Link>
            )
          })}
          {currentPage < totalPages && (
            <Link
              href={buildPageUrl(currentPage + 1)}
              className="rounded border border-secondary-300 px-3 py-1.5 text-sm text-secondary-600 hover:bg-secondary-50"
            >
              Next
            </Link>
          )}
        </div>
      )}

      {totalDocs > 0 && (
        <section className="mt-12 border-t border-secondary-200 pt-8">
          {/* Description (richText) */}
          {hasRichTextContent(category.description) && (
            <div className="mb-10">
              <div
                className="prose prose-sm prose-secondary max-w-none text-secondary-600"
                dangerouslySetInnerHTML={{ __html: lexicalToHtml(category.description) }}
              />
            </div>
          )}

          {/* Buying Guide (richText - Lexical format) */}
          {hasRichTextContent(category.buyingGuide) && (
            <div className="mb-10">
              <h2 className="mb-4 text-lg font-bold text-secondary-900">
                How to Choose the Right {category.name}
              </h2>
              <div
                className="prose prose-sm prose-secondary max-w-none text-secondary-600"
                dangerouslySetInnerHTML={{ __html: lexicalToHtml(category.buyingGuide) }}
              />
            </div>
          )}

          {/* FAQ Section */}
          {Array.isArray(category.faq) && category.faq.length > 0 && (
            <FAQSection
              faqs={category.faq.map((item: { question?: string; answer?: string }) => ({
                question: item.question || '',
                answer: item.answer || '',
              }))}
              title="Frequently Asked Questions"
            />
          )}

          {/* SEO Content (richText) */}
          {hasRichTextContent(category.seoContent) && (
            <div className="mt-10">
              <div
                className="prose prose-sm prose-secondary max-w-none text-secondary-600"
                dangerouslySetInnerHTML={{ __html: lexicalToHtml(category.seoContent) }}
              />
            </div>
          )}

          {/* Fallback About section if no content at all */}
          {!hasRichTextContent(category.description) &&
           !hasRichTextContent(category.buyingGuide) &&
           (!Array.isArray(category.faq) || category.faq.length === 0) &&
           !hasRichTextContent(category.seoContent) && (
            <div className="max-w-3xl text-sm leading-relaxed text-secondary-500">
              <h2 className="mb-3 text-lg font-semibold text-secondary-800">
                About {category.name}
              </h2>
              <p>{descriptionText}</p>
            </div>
          )}
        </section>
      )}

      {/* FAQPage Structured Data */}
      {Array.isArray(category.faq) && category.faq.length > 0 && (
        <FAQSchema
          faqs={category.faq.map((item: { question?: string; answer?: string }) => ({
            question: item.question || '',
            answer: item.answer || '',
          }))}
        />
      )}
    </div>
  )
}
