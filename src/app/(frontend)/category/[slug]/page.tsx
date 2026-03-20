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
import { L1SubcategoryCard } from '@/components/category/L1SubcategoryCard'
import { FeaturedProductsSection } from '@/components/category/FeaturedProductsSection'
import { FilterBar, DesktopSortBar } from '@/components/category/FilterBar'
import { ExpandableIntro } from '@/components/category/ExpandableIntro'
import { EmptyStateAIDialog } from '@/components/category/EmptyStateAIDialog'

// 使用 ISR，每 5 分钟重新验证一次
// 分类页面数据可以缓存，过滤和排序通过 URL 参数处理
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
  searchParams: Promise<{ page?: string; brand?: string; minPrice?: string; maxPrice?: string; sort?: string; view?: string; [key: string]: string | undefined }>
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

    // Resolve parent and grandparent for breadcrumbs (3-level support)
    let parent = null
    let grandparent = null
    if (category.parent) {
      const parentId = typeof category.parent === 'object' ? category.parent.id : category.parent
      try {
        parent = await payload.findByID({ collection: 'categories', id: parentId })
        // Resolve grandparent if parent also has a parent (L3 category)
        if (parent?.parent) {
          const gpId = typeof parent.parent === 'object' ? parent.parent.id : parent.parent
          try {
            grandparent = await payload.findByID({ collection: 'categories', id: gpId })
          } catch { /* grandparent not found */ }
        }
      } catch { /* parent not found */ }
    }

    return { category, parent, grandparent }
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

/**
 * Get L2 subcategories with their L3 children (for L1 page display)
 */
async function getL2WithL3Children(categoryId: string) {
  try {
    const payload = await getPayload({ config })
    
    // Get L2 categories (direct children)
    const l2Categories = await payload.find({
      collection: 'categories',
      where: { parent: { equals: categoryId } },
      sort: 'displayOrder',
      limit: 50,
    })

    // For each L2, get its L3 children and product count
    const results = await Promise.all(
      l2Categories.docs.map(async (l2) => {
        // Get L3 children
        const l3Children = await payload.find({
          collection: 'categories',
          where: { parent: { equals: l2.id } },
          sort: 'displayOrder',
          limit: 50,
        })

        // Get product count (from L2 + all L3)
        const allIds = [l2.id, ...l3Children.docs.map(c => c.id)]
        const productCount = await payload.count({
          collection: 'products',
          where: {
            primaryCategory: { in: allIds },
            status: { equals: 'published' },
          },
        })

        return {
          name: l2.name,
          slug: l2.slug,
          productCount: productCount.totalDocs,
          l3Tags: l3Children.docs.map(l3 => ({
            name: l3.name,
            slug: l3.slug,
          })),
        }
      })
    )

    return results
  } catch {
    return []
  }
}

/**
 * Get newest products for a category (for featured section on L1/L2 pages)
 */
async function getFeaturedProducts(categoryId: string, childIds: string[], limit: number = 8) {
  try {
    const payload = await getPayload({ config })
    const allCategoryIds = [categoryId, ...childIds]

    const result = await payload.find({
      collection: 'products',
      where: {
        primaryCategory: { in: allCategoryIds },
        status: { equals: 'published' },
      },
      limit,
      sort: '-createdAt',
      depth: 2,
    })

    return result.docs
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

interface CustomFilterValue {
  key: string
  name: string
  values: { value: string; count: number }[]
}

async function getCustomFilterValues(
  categoryId: string,
  childIds: string[],
  attributes: { name: string; key: string }[]
): Promise<CustomFilterValue[]> {
  if (!attributes || attributes.length === 0) return []
  
  try {
    const payload = await getPayload({ config })
    const allCategoryIds = [categoryId, ...childIds]

    const products = await payload.find({
      collection: 'products',
      where: {
        primaryCategory: { in: allCategoryIds },
        status: { equals: 'published' },
      },
      limit: 1000,
    })

    const results: CustomFilterValue[] = []

    for (const attr of attributes) {
      const valueCounts = new Map<string, number>()

      for (const product of products.docs) {
        const specs = product.specifications as { label: string; value: string; unit?: string }[] | undefined
        if (!specs) continue

        const matchingSpec = specs.find(
          (s) => s.label.toLowerCase() === attr.name.toLowerCase()
        )
        if (matchingSpec && matchingSpec.value) {
          const val = matchingSpec.value.trim()
          valueCounts.set(val, (valueCounts.get(val) || 0) + 1)
        }
      }

      if (valueCounts.size > 0) {
        results.push({
          key: attr.key,
          name: attr.name,
          values: Array.from(valueCounts.entries())
            .map(([value, count]) => ({ value, count }))
            .sort((a, b) => b.count - a.count),
        })
      }
    }

    return results
  } catch {
    return []
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
    packageQty: (product.packageQty as number) || undefined,
    purchaseMode: (product.purchaseMode as 'both' | 'buy-online' | 'rfq-only') || 'both',
    availability: (product.availability as string) || 'contact',
  }
}

export async function generateMetadata({ params, searchParams }: CategoryPageProps): Promise<Metadata> {
  const { slug } = await params
  const resolvedSearchParams = await searchParams
  const data = await getCategoryBySlug(slug)
  if (!data) return { title: 'Category Not Found' }

  const { category, parent, grandparent } = data
  const parentName = parent ? `${parent.name} - ` : ''
  const gpName = grandparent ? `${grandparent.name} - ` : ''
  const title = `${category.name} | ${gpName}${parentName}Machrio Industrial Supplies`
  
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
  const resolvedSearchParams = await searchParams
  const { page: pageParam, brand: brandFilter, minPrice: minPriceParam, maxPrice: maxPriceParam, sort: sortParam, view: viewParam } = resolvedSearchParams
  const currentPage = Math.max(1, parseInt(pageParam || '1', 10))
  const minPrice = minPriceParam ? parseFloat(minPriceParam) : undefined
  const maxPrice = maxPriceParam ? parseFloat(maxPriceParam) : undefined

  const data = await getCategoryBySlug(slug)
  if (!data) notFound()

  const { category, parent, grandparent } = data

  // Determine category level for conditional rendering
  const isL1 = !parent && !grandparent  // Top-level category
  const isL2 = parent && !grandparent   // Second-level category  
  const isL3 = parent && grandparent    // Third-level category (leaf)

  // Get subcategories
  const subcategories = await getSubcategories(category.id)

  // For L1 pages: get L2 subcategories with their L3 children
  const l2WithL3 = isL1 ? await getL2WithL3Children(category.id) : []

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
  
  // For L1/L2 pages, also get featured products (newest arrivals)
  const shouldGetFeaturedProducts = (isL1 || isL2) && !hasFilters

  // Get custom filter attributes for L3 categories
  const customAttributes = (category.customFilterAttributes as { name: string; key: string; displayOrder?: number }[]) || []

  const [brandsData, priceRangeData, productsResult, featuredProductsRaw, customFiltersData] = await Promise.all([
    getCategoryBrands(category.id, childCategoryIds),
    getCategoryPriceRange(category.id, childCategoryIds),
    // Only get paginated products for L3 pages or when filters are applied
    (isL3 || hasFilters)
      ? (hasFilters
          ? getFilteredProducts(category.id, childCategoryIds, currentPage, {
              brandSlug: brandFilter,
              minPrice,
              maxPrice,
            }, sortField)
          : getProducts(category.id, childCategoryIds, currentPage, sortField))
      : Promise.resolve({ docs: [], totalDocs: 0, page: 1, totalPages: 1, hasNextPage: false, hasPrevPage: false }),
    shouldGetFeaturedProducts
      ? getFeaturedProducts(category.id, childCategoryIds, 8)
      : Promise.resolve([]),
    isL3 && customAttributes.length > 0
      ? getCustomFilterValues(category.id, childCategoryIds, customAttributes)
      : Promise.resolve([]),
  ])

  // Parse custom filter params from URL
  const customFilterParams: Record<string, string[]> = {}
  if (customAttributes.length > 0) {
    for (const attr of customAttributes) {
      const paramValue = resolvedSearchParams[attr.key]
      if (paramValue) {
        customFilterParams[attr.key] = paramValue.split(',')
      }
    }
  }
  const hasCustomFilters = Object.keys(customFilterParams).length > 0

  // Map products to card format
  let products = productsResult.docs.map(p => {
    const mapped = mapProductToCard(p as unknown as Record<string, unknown>)
    // Attach specifications for client-side filtering
    const specs = (p as unknown as Record<string, unknown>).specifications as { label: string; value: string }[] | undefined
    return { ...mapped, _specifications: specs }
  })

  // Apply client-side filtering for custom attributes
  if (hasCustomFilters && products.length > 0) {
    products = products.filter(product => {
      return Object.entries(customFilterParams).every(([key, values]) => {
        const attrName = customAttributes.find(a => a.key === key)?.name
        if (!attrName) return true
        
        const spec = product._specifications?.find(
          s => s.label.toLowerCase() === attrName.toLowerCase()
        )
        return spec && values.includes(spec.value)
      })
    })
  }

  const featuredProducts = featuredProductsRaw.map(p => mapProductToCard(p as unknown as Record<string, unknown>))
  
  // Adjust totals for client-side filtered results
  const totalDocs = hasCustomFilters ? products.length : productsResult.totalDocs
  const totalPages = hasCustomFilters ? Math.ceil(products.length / PRODUCTS_PER_PAGE) : productsResult.totalPages
  
  // Paginate client-side filtered results
  if (hasCustomFilters && products.length > PRODUCTS_PER_PAGE) {
    const startIndex = (currentPage - 1) * PRODUCTS_PER_PAGE
    products = products.slice(startIndex, startIndex + PRODUCTS_PER_PAGE)
  }

  // Build breadcrumbs (supports 3 levels: Home > L1 > L2 > L3)
  const breadcrumbs = [
    { label: 'Home', href: '/' },
    ...(grandparent
      ? [{ label: grandparent.name, href: `/category/${grandparent.slug}` }]
      : []),
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
    // Preserve custom filter params
    Object.entries(customFilterParams).forEach(([key, values]) => {
      if (values.length > 0) params.set(key, values.join(','))
    })
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

      {/* L1 Page: Show L2 subcategories with L3 tags */}
      {isL1 && l2WithL3.length > 0 && (
        <section className="mb-8">
          <h2 className="mb-4 text-lg font-semibold text-secondary-800">
            Browse {category.name} Categories
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {l2WithL3.map((l2) => (
              <L1SubcategoryCard
                key={l2.slug}
                name={l2.name}
                slug={l2.slug}
                productCount={l2.productCount}
                l3Tags={l2.l3Tags}
              />
            ))}
          </div>
        </section>
      )}

      {/* L2 Page: Show L3 subcategories prominently */}
      {isL2 && subcategories.length > 0 && (
        <SubcategoryGrid items={subcategories} parentSlug={slug} />
      )}

      {/* L2 Page: When all subcategories have 0 products, show AI sourcing dialog */}
      {isL2 && subcategories.length > 0 && subcategories.every(s => s.productCount === 0) && featuredProducts.length === 0 && (
        <EmptyStateAIDialog
          categoryName={category.name}
          categorySlug={slug}
          parentCategories={parent ? [parent.name] : []}
        />
      )}

      {/* L1/L2 Pages: Show featured products (newest arrivals) */}
      {(isL1 || isL2) && featuredProducts.length > 0 && (
        <FeaturedProductsSection
          title="Newest Arrivals"
          products={featuredProducts}
          viewAllHref={`/category/${slug}?sort=newest`}
          viewAllLabel="View All Products"
        />
      )}

      {/* L3 Page: Filter + Products Layout */}
      {isL3 && (
        <div className="lg:grid lg:grid-cols-[220px_1fr] lg:gap-6">
        {/* Sidebar filters (desktop) + mobile filter toggle */}
        <div>
          <FilterBar
            categorySlug={slug}
            brands={brandsData}
            priceRange={priceRangeData}
            totalProducts={totalDocs}
            customFilters={customFiltersData}
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
            /* Empty state - AI Dialog + RFQ for categories without products */
            hasFilters ? (
              <div className="flex flex-col items-center py-16 text-center">
                <svg className="h-16 w-16 text-secondary-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
                <h2 className="mt-4 text-lg font-semibold text-secondary-700">
                  No products match your filters
                </h2>
                <p className="mt-2 max-w-md text-sm text-secondary-500">
                  Try adjusting your filters or clearing them to see more products.
                </p>
                <Link
                  href={`/category/${slug}`}
                  className="btn-primary mt-6 px-8 py-2.5"
                >
                  Clear Filters
                </Link>
              </div>
            ) : (
              <EmptyStateAIDialog
                categoryName={category.name}
                categorySlug={slug}
                parentCategories={[
                  ...(grandparent ? [grandparent.name] : []),
                  ...(parent ? [parent.name] : []),
                ]}
              />
            )
          )}
        </div>
      </div>
      )}

      {/* Pagination - below the grid (L3 only) */}
      {isL3 && totalDocs > 0 && totalPages > 1 && (
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
