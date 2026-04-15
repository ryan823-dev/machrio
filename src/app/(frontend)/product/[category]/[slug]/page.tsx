import type { Metadata } from 'next'
import { notFound, permanentRedirect } from 'next/navigation'
import Link from 'next/link'
import { getProductBySlug } from '@/lib/db-queries'
import { getPool } from '@/lib/db'
import { Breadcrumbs } from '@/components/shared/Breadcrumbs'
import { StructuredData } from '@/components/shared/StructuredData'
import { FAQSchema, FAQSection } from '@/components/shared/FAQSchema'
import { AddToCartButton } from '@/components/shared/AddToCartButton'
import { TieredPricingTable } from '@/components/product/TieredPricingTable'
import { TrustBadges } from '@/components/product/TrustBadges'
import { AddToQuoteButton } from '@/components/product/AddToQuoteButton'
import { RelatedProducts } from '@/components/product/RelatedProducts'
import { ImageZoom } from '@/components/product/ImageZoom'
import { RecentlyViewed, TrackProductView } from '@/components/product/RecentlyViewed'
import { AlsoViewed, TrackProductViewServer } from '@/components/product/AlsoViewed'
import { BoughtTogether } from '@/components/product/BoughtTogether'
import { RelatedGuide } from '@/components/shared/RelatedGuide'
import { normalizeRichTextContent } from '@/lib/lexical-utils'
import {
  normalizePurchaseMode,
  supportsOnlineCheckout,
  supportsQuoteRequests,
} from '@/lib/purchase-mode'
import { normalizePublicAssetUrls } from '@/lib/public-asset-url'
import { resolveProductPath } from '@/lib/url-resolution'
import {
  getCanonicalProductCategory,
  getProductExactMatchToken,
  getProductMetaDescription,
  getProductSeoName,
  isRelevantRelatedProduct,
  withBrandSuffix,
} from '@/lib/seo'

// SSR: 实时数据库查询，无静态缓存
export const dynamic = 'force-dynamic'

interface ProductPageProps {
  params: Promise<{ category: string; slug: string }>
}

interface ParsedPricing {
  basePrice?: number
  priceUnit?: string
  currency?: string
  compareAtPrice?: number
  tieredPricing?: { minQty: number; maxQty?: number; unitPrice: number }[]
}

interface ProductImageRecord {
  url?: string | null
}
function parseFiniteNumber(value: unknown): number | undefined {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : undefined
  }

  if (typeof value === 'string') {
    const parsed = Number.parseFloat(value)
    return Number.isFinite(parsed) ? parsed : undefined
  }

  return undefined
}

function parsePricing(pricing: unknown): ParsedPricing | null {
  if (!pricing) return null

  let pricingData = pricing

  if (typeof pricingData === 'string') {
    try {
      pricingData = JSON.parse(pricingData)
    } catch {
      return null
    }
  }

  if (!pricingData || typeof pricingData !== 'object') {
    return null
  }

  const rawPricing = pricingData as Record<string, unknown>
  const rawTieredPricing = Array.isArray(rawPricing.tieredPricing)
    ? rawPricing.tieredPricing
    : Array.isArray(rawPricing.tiered_pricing)
    ? rawPricing.tiered_pricing
    : undefined

  const tieredPricing = rawTieredPricing
    ?.map((tier) => {
      if (!tier || typeof tier !== 'object') return null

      const rawTier = tier as Record<string, unknown>
      const minQty = parseFiniteNumber(rawTier.minQty ?? rawTier.min_qty)
      const maxQty = parseFiniteNumber(rawTier.maxQty ?? rawTier.max_qty)
      const unitPrice = parseFiniteNumber(rawTier.unitPrice ?? rawTier.unit_price)

      if (minQty === undefined || unitPrice === undefined) {
        return null
      }

      return {
        minQty,
        ...(maxQty !== undefined ? { maxQty } : {}),
        unitPrice,
      }
    })
    .filter((tier): tier is NonNullable<typeof tier> => tier !== null)

  return {
    basePrice: parseFiniteNumber(rawPricing.basePrice ?? rawPricing.base_price),
    priceUnit: typeof (rawPricing.priceUnit ?? rawPricing.price_unit) === 'string'
      ? String(rawPricing.priceUnit ?? rawPricing.price_unit)
      : undefined,
    currency: typeof rawPricing.currency === 'string' ? rawPricing.currency : undefined,
    compareAtPrice: parseFiniteNumber(rawPricing.compareAtPrice ?? rawPricing.compare_at_price),
    tieredPricing: tieredPricing && tieredPricing.length > 0 ? tieredPricing : undefined,
  }
}

// 获取产品数据（纯数据库，无回退）
async function getProductBySlugFromDB(slug: string) {
  return await getProductBySlug(slug)
}

function extractProductImageUrls(
  rawImages: unknown,
  externalImageUrl: string | null | undefined,
  serverUrl: string,
): string[] {
  const rawUrls: Array<string | null | undefined> = []
  let parsedImages = rawImages

  if (typeof parsedImages === 'string') {
    try {
      parsedImages = JSON.parse(parsedImages)
    } catch {
      parsedImages = null
    }
  }

  if (Array.isArray(parsedImages)) {
    for (const image of parsedImages as ProductImageRecord[]) {
      if (typeof image?.url === 'string' && image.url.trim()) {
        rawUrls.push(image.url.trim())
      }
    }
  }

  if (typeof externalImageUrl === 'string' && externalImageUrl.trim()) {
    rawUrls.push(externalImageUrl.trim())
  }

  return normalizePublicAssetUrls(rawUrls, {
    baseUrl: serverUrl,
    requireHttps: true,
  })
}

function mapAvailabilityToSchema(availability: string | null | undefined): string {
  if (availability === 'in-stock') return 'https://schema.org/InStock'
  if (availability === 'made-to-order') return 'https://schema.org/PreOrder'
  if (availability === 'out-of-stock') return 'https://schema.org/OutOfStock'
  return 'https://schema.org/LimitedAvailability'
}
// Common section header patterns in product descriptions
const SECTION_HEADERS = [
  'Overview', 'Key Features', 'Features', 'Specifications', 'Applications',
  'Product Information', 'Product Description', 'Material', 'Size Specifications',
  'Technology & Construction', 'Benefits', 'Description', 'Details',
  'Technical Specifications', 'Product Details', 'Important Notes', 'Note'
]

// Convert text with section headers to properly formatted HTML
function formatTextWithHeaders(text: string): string {
  const headerPattern = SECTION_HEADERS.map(h => h.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')
  const regex = new RegExp(`(?:^|\\n)(${headerPattern})(?:\\s*:|\\s*\\n|\\s*$)`, 'gi')
  
  const parts = text.split(regex).filter(Boolean)
  
  if (parts.length <= 1) {
    return text ? `<p>${text}</p>` : ''
  }
  
  let result = ''
  let currentHeader = ''
  
  for (let i = 0; i < parts.length; i++) {
    const part = parts[i].trim()
    if (!part) continue
    
    const isHeader = SECTION_HEADERS.some(h => 
      part.toLowerCase() === h.toLowerCase()
    )
    
    if (isHeader) {
      if (currentHeader) {
        result += `<h3>${currentHeader}</h3>`
      }
      currentHeader = part
    } else {
      if (currentHeader) {
        result += `<h3>${currentHeader}</h3><p>${part}</p>`
        currentHeader = ''
      } else {
        result += `<p>${part}</p>`
      }
    }
  }
  
  if (currentHeader) {
    result += `<h3>${currentHeader}</h3>`
  }
  
  return result
}

// Extract children from Lexical nodes
function extractChildren(children: unknown[]): string {
  if (!Array.isArray(children)) return ''
  return children
    .map((node) => {
      const n = node as Record<string, unknown>
      if (n.type === 'text') {
        let text = n.text as string
        if (n.format === 1 || n.bold) text = `<strong>${text}</strong>`
        if (n.format === 2 || n.italic) text = `<em>${text}</em>`
        return text
      }
      if (n.type === 'link') {
        const url = ((n.fields as Record<string, unknown>)?.url as string) || '#'
        const inner = extractChildren(n.children as unknown[])
        return `<a href="${url}" class="text-primary-600 underline hover:text-primary-800">${inner}</a>`
      }
      if (n.children) return extractChildren(n.children as unknown[])
      return ''
    })
    .join('')
}

function lexicalToHtml(richText: unknown): string {
  const normalized = normalizeRichTextContent(richText)
  if (!normalized || typeof normalized !== 'object') return ''
  const root = (normalized as Record<string, unknown>).root as Record<string, unknown> | undefined
  if (!root || !Array.isArray(root.children)) return ''
  return (root.children as Record<string, unknown>[])
    .map((node) => {
      if (node.type === 'paragraph') {
        const text = extractChildren(node.children as unknown[])
        if (text && SECTION_HEADERS.some(h => new RegExp(`\\b${h}\\s*:?\\b`, 'i').test(text))) {
          return formatTextWithHeaders(text)
        }
        if (text && /^[\s]*[-*][\s]/.test(text)) {
          return formatTextList(text)
        }
        return text ? `<p>${text}</p>` : ''
      }
      if (node.type === 'heading') {
        const tag = (node.tag as string) || 'h3'
        const text = extractChildren(node.children as unknown[])
        return text ? `<${tag}>${text}</${tag}>` : ''
      }
      if (node.type === 'list') {
        const tag = node.listType === 'number' ? 'ol' : 'ul'
        const items = (node.children as Record<string, unknown>[])
          .map((li) => `<li>${extractChildren(li.children as unknown[])}</li>`)
          .join('')
        return `<${tag}>${items}</${tag}>`
      }
      if (node.type === 'quote') {
        const text = extractChildren(node.children as unknown[])
        return text ? `<blockquote>${text}</blockquote>` : ''
      }
      return ''
    })
    .filter(Boolean)
    .join('\n')
}

// Format text-based lists
function formatTextList(text: string): string {
  const lines = text.split('\n')
  const listItems: string[] = []
  const nonListLines: string[] = []
  
  for (const line of lines) {
    const trimmed = line.trim()
    if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      listItems.push(trimmed.substring(2))
    } else if (trimmed) {
      nonListLines.push(trimmed)
    }
  }
  
  let result = ''
  if (listItems.length > 0) {
    result += '<ul>' + listItems.map(item => `<li>${item}</li>`).join('') + '</ul>'
  }
  if (nonListLines.length > 0) {
    result += nonListLines.map(line => `<p>${line}</p>`).join('')
  }
  return result
}

// Types for related products from PostgreSQL
interface RelatedProductData {
  name: string
  slug: string
  categorySlug: string
  categoryName?: string
  sku: string
  imageUrl?: string
  price?: number
  currency: string
  source: 'manual' | 'same-brand' | 'same-category'
}

// Get related products using PostgreSQL
async function getRelatedProductsFromDB(
  currentProduct: {
    id: string
    name: string
    slug: string
    categoryId: string | null
    categorySlug?: string | null
    categoryName?: string | null
  },
  serverUrl: string,
): Promise<RelatedProductData[]> {
  const MAX_PRODUCTS = 8
  const results: RelatedProductData[] = []
  const seenIds = new Set<string>([currentProduct.id])
  const pool = getPool()

  try {
    // 1. Same category products (primary source)
    if (currentProduct.categoryId && results.length < MAX_PRODUCTS) {
      const sameCategory = await pool.query(
        `SELECT p.id, p.name, p.slug, p.sku, p.pricing, p.images, p.external_image_url,
                c.slug as category_slug, c.name as category_name
         FROM products p
         LEFT JOIN categories c ON p.primary_category_id = c.id
         WHERE p.primary_category_id = $1 AND p.status = 'published' AND p.id != $2
         ORDER BY p.created_at DESC
         LIMIT $3`,
        [currentProduct.categoryId, currentProduct.id, MAX_PRODUCTS]
      )
      
      for (const row of sameCategory.rows) {
        if (results.length >= MAX_PRODUCTS) break
        const candidate = {
          name: row.name,
          slug: row.slug,
          categorySlug: row.category_slug,
          categoryName: row.category_name,
        }
        if (!isRelevantRelatedProduct(currentProduct, candidate)) continue
        const pricing = parsePricing(row.pricing)
        const imageUrl = extractProductImageUrls(row.images, row.external_image_url, serverUrl)[0]
        const canonicalCategory = getCanonicalProductCategory(candidate)
        results.push({
          name: row.name,
          slug: row.slug,
          categorySlug: canonicalCategory.slug,
          categoryName: canonicalCategory.name,
          sku: row.sku || '',
          imageUrl,
          price: pricing?.basePrice,
          currency: pricing?.currency || 'USD',
          source: 'same-category',
        })
        seenIds.add(row.id)
      }
    }

    // 2. Get more products if needed (fallback to any products)
    if (results.length < MAX_PRODUCTS) {
      const moreProducts = await pool.query(
        `SELECT p.id, p.name, p.slug, p.sku, p.pricing, p.images, p.external_image_url,
                c.slug as category_slug, c.name as category_name
         FROM products p
         LEFT JOIN categories c ON p.primary_category_id = c.id
         WHERE p.status = 'published' AND p.id != $1
         ORDER BY p.created_at DESC
         LIMIT $2`,
        [currentProduct.id, MAX_PRODUCTS - results.length]
      )
      
      for (const row of moreProducts.rows) {
        if (results.length >= MAX_PRODUCTS) break
        if (seenIds.has(row.id)) continue
        const candidate = {
          name: row.name,
          slug: row.slug,
          categorySlug: row.category_slug,
          categoryName: row.category_name,
        }
        if (!isRelevantRelatedProduct(currentProduct, candidate)) continue
        const pricing = parsePricing(row.pricing)
        const imageUrl = extractProductImageUrls(row.images, row.external_image_url, serverUrl)[0]
        const canonicalCategory = getCanonicalProductCategory(candidate)
        results.push({
          name: row.name,
          slug: row.slug,
          categorySlug: canonicalCategory.slug,
          categoryName: canonicalCategory.name,
          sku: row.sku || '',
          imageUrl,
          price: pricing?.basePrice,
          currency: pricing?.currency || 'USD',
          source: 'same-category',
        })
        seenIds.add(row.id)
      }
    }

    return results
  } catch (err) {
    console.error('Error fetching related products:', err)
    return []
  }
  // 注意：不要调用 pool.end()！
  // 在 serverless 环境中，连接池应该被复用而不是关闭
}

// Generate product FAQs
function generateProductFAQs(product: {
  name: string
  brand_name: string | null
  category_name: string | null
  specifications: unknown | null
  min_order_quantity: number | null
  pricing: unknown | null
  availability: string | null
  lead_time: string | null
  purchase_mode?: string
}) {
  const faqs: { question: string; answer: string }[] = []
  const { name, category_name, specifications, min_order_quantity, pricing, availability, lead_time } = product
  const purchaseMode = normalizePurchaseMode(product.purchase_mode)
  
  // 1. Specification / Selection question
  const specsArray = specifications as { label: string; value: string }[] | null
  const specs = Array.isArray(specsArray) ? specsArray : []
  const specSummary = specs.slice(0, 3).map(s => `${s.label}: ${s.value}`).join(', ')
  faqs.push({
    question: `What are the key specifications of ${name}?`,
    answer: specSummary
      ? `Key specifications for ${name}: ${specSummary}. See the full specification table on this page for complete details.`
      : `Full specifications for ${name} are listed in the specification table on this page.${category_name ? ` This product is in the ${category_name} category.` : ''}`,
  })

  // 2. Pricing / MOQ question
  const moq = min_order_quantity || 1
  const tiered = (pricing as { tieredPricing?: { minQty: number; unitPrice: number }[] })?.tieredPricing
  const basePrice = (pricing as { basePrice?: number })?.basePrice
  faqs.push({
    question: `What is the minimum order quantity and bulk pricing for ${name}?`,
    answer: `The minimum order quantity is ${moq} unit(s).${supportsOnlineCheckout(purchaseMode) && basePrice ? ` Unit price starts at $${basePrice}.` : ''}${supportsOnlineCheckout(purchaseMode) && tiered && tiered.length > 1 ? ' Volume discounts are available — see the tiered pricing table on this page for exact breakpoints.' : ''}`,
  })

  // 3. Lead time / Availability
  const availabilityText = availability === 'in-stock'
    ? 'This product is currently in stock and ships within 1-2 business days.'
    : availability === 'made-to-order'
    ? 'This product is made to order.'
    : 'Contact us for current availability.'
  faqs.push({
    question: `What is the lead time and availability for ${name}?`,
    answer: `${availabilityText}${lead_time ? ` Estimated lead time: ${lead_time}.` : ''}`,
  })

  // 4. Brand / Compatibility question - brands not in DB, skip
  // if (brand_name && brand_name !== 'Unbranded') {
  //   faqs.push({
  //     question: `Is this a genuine ${brand_name} product?`,
  //     answer: `Yes, this is a genuine ${brand_name} product. Browse our brand page for the full selection.`,
  //   })
  // }

  return faqs
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { slug } = await params
  const { product } = await getProductBySlugFromDB(slug)
  
  if (!product) {
    return { title: withBrandSuffix('Product Not Found') }
  }

  const serverUrl = process.env.NEXT_PUBLIC_SERVER_URL || 'https://machrio.com'
  const canonicalCategory = getCanonicalProductCategory({
    name: product.name,
    slug: product.slug,
    categorySlug: product.category_slug,
    categoryName: product.category_name,
  })
  const seoProductName = getProductSeoName({
    name: product.name,
    slug: product.slug,
  })
  const canonicalPath = `/product/${canonicalCategory.slug}/${slug}`
  
  const imageUrls = extractProductImageUrls(product.images, product.external_image_url, serverUrl)
  const fullImageUrl = imageUrls[0] || ''
  const title = withBrandSuffix(seoProductName)
  const description = getProductMetaDescription({
    slug: product.slug,
    shortDescription: product.short_description,
  }) || `Shop ${seoProductName} from Machrio. Industrial-grade products with transparent pricing.`

  return {
    title,
    description,
    alternates: { canonical: canonicalPath },
    openGraph: {
      title,
      description,
      url: `${serverUrl}${canonicalPath}`,
      ...(fullImageUrl && {
        images: [{ url: fullImageUrl, width: 800, height: 800, alt: product.name }],
      }),
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      ...(fullImageUrl && {
        images: [fullImageUrl],
      }),
    },
  }
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { category, slug } = await params
  const { product } = await getProductBySlugFromDB(slug)
  
  if (!product) {
    const legacyPath = `/product/${category}/${slug}`
    const resolution = await resolveProductPath(legacyPath, category, slug)

    if (resolution.redirectTo) {
      permanentRedirect(resolution.redirectTo)
    }

    notFound()
  }

  const serverUrl = process.env.NEXT_PUBLIC_SERVER_URL || 'https://machrio.com'
  const canonicalCategory = getCanonicalProductCategory({
    name: product.name,
    slug: product.slug,
    categorySlug: product.category_slug,
    categoryName: product.category_name,
  })
  const canonicalPath = `/product/${canonicalCategory.slug}/${product.slug}`

  if (category !== canonicalCategory.slug) {
    permanentRedirect(canonicalPath)
  }

  // Resolve category hierarchy
  const rawCatSlug = product.category_slug || ''
  const catSlug = canonicalCategory.slug
  const catName = canonicalCategory.name
  const parentCatSlug = product.parent_category_slug || ''
  const parentCatName = product.parent_category_name || ''
  const useDatabaseHierarchy = rawCatSlug === catSlug
  const seoProductName = getProductSeoName({
    name: product.name,
    slug: product.slug,
  })
  const displayBrandName = product.brand_name || 'Industrial'
  const schemaImageUrls = extractProductImageUrls(product.images, product.external_image_url, serverUrl)
  const imageUrl = schemaImageUrls[0] || ''

  // Pricing - 解析 JSON 字符串（数据库存储为 text）
  const pricing = parsePricing(product.pricing)
  const basePrice = pricing?.basePrice
  const priceUnit = pricing?.priceUnit
  const currency = pricing?.currency || 'USD'
  const compareAtPrice = pricing?.compareAtPrice

  // 自动生成阶梯定价（如果没有数据）
  // 1-10件: 原价, 11-50件: 95折, 51+件: 9折
  const tieredPricing = pricing?.tieredPricing || (basePrice ? [
    { minQty: 1, maxQty: 10, unitPrice: basePrice },
    { minQty: 11, maxQty: 50, unitPrice: Math.round(basePrice * 0.95 * 100) / 100 },
    { minQty: 51, unitPrice: Math.round(basePrice * 0.9 * 100) / 100 },
  ] : null)

  // Specs - 解析 JSON 字符串（数据库存储为 text）
  let specifications: { label: string; value: string; unit?: string }[] = []
  try {
    let specsData = product.specifications
    if (typeof specsData === 'string') {
      specsData = JSON.parse(specsData)
    }
    specifications = Array.isArray(specsData) ? specsData : []
  } catch {
    specifications = []
  }

  // Description
  const descriptionHtml = lexicalToHtml(product.full_description)
  const shortDescription = product.short_description || ''

  const purchaseMode = normalizePurchaseMode(product.purchase_mode)
  const availability = product.availability || 'contact'
  const leadTime = product.lead_time || ''
  const moq = product.min_order_quantity || 1

  const canBuyOnline =
    supportsOnlineCheckout(purchaseMode) &&
    typeof basePrice === 'number' &&
    basePrice > 0
  const canRFQ = supportsQuoteRequests(purchaseMode)
  const showQuoteActions = canRFQ || !canBuyOnline

  // Extract package quantity from product name (e.g., "Pkg Qty 2")
  const packageQtyFromName = (() => {
    const match = product.name.match(/pkg\s*qty\.?\s*(\d+)/i)
    return match ? parseInt(match[1], 10) : null
  })()
  
  // Get package quantity from database field, fallback to name extraction
  const packageQty = product.package_qty || packageQtyFromName
  
  // Calculate per-item price if there's a package quantity
  const perItemPrice = packageQty && basePrice ? (basePrice / packageQty) : null

  // FAQs
  const productFAQs = generateProductFAQs({
    name: seoProductName,
    brand_name: product.brand_name,
    category_name: catName,
    specifications: product.specifications,
    min_order_quantity: product.min_order_quantity,
    pricing: product.pricing,
    availability: product.availability,
    lead_time: product.lead_time,
    purchase_mode: purchaseMode,
  })

  // Related products: same category
  const relatedProducts = await getRelatedProductsFromDB({
    id: product.id,
    name: product.name,
    slug: product.slug,
    categoryId: product.category_id,
    categorySlug: product.category_slug,
    categoryName: product.category_name,
  }, serverUrl)

  const schemaAvailability = mapAvailabilityToSchema(availability)
  const manufacturerPartNumber = getProductExactMatchToken(product.slug)
  const offerSchema = canBuyOnline && basePrice
    ? {
        '@type': 'Offer',
        url: `${serverUrl}${canonicalPath}`,
        price: basePrice,
        priceCurrency: currency,
        priceValidUntil: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        availability: schemaAvailability,
        seller: { '@type': 'Organization', name: 'Machrio', url: serverUrl },
        itemCondition: 'https://schema.org/NewCondition',
        ...(moq > 1 && {
          eligibleQuantity: {
            '@type': 'QuantitativeValue',
            minValue: moq,
          },
        }),
        shippingDetails: {
          '@type': 'OfferShippingDetails',
          shippingRate: {
            '@type': 'MonetaryAmount',
            value: 0,
            currency: 'USD',
          },
          shippingDestination: {
            '@type': 'DefinedRegion',
            addressCountry: 'US',
          },
          deliveryTime: {
            '@type': 'ShippingDeliveryTime',
            handlingTime: {
              '@type': 'QuantitativeValue',
              minValue: 1,
              maxValue: availability === 'in-stock' ? 2 : 5,
              unitCode: 'DAY',
            },
            transitTime: {
              '@type': 'QuantitativeValue',
              minValue: 2,
              maxValue: 7,
              unitCode: 'DAY',
            },
          },
        },
        hasMerchantReturnPolicy: {
          '@type': 'MerchantReturnPolicy',
          applicableCountry: 'US',
          returnPolicyCategory: 'https://schema.org/MerchantReturnFiniteReturnWindow',
          merchantReturnDays: 30,
          returnMethod: 'https://schema.org/ReturnByMail',
          returnFees: 'https://schema.org/FreeReturn',
        },
      }
    : null

  // Schema.org - Enhanced Product Schema with complete offers
  const productSchema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: seoProductName,
    description: shortDescription,
    url: `${serverUrl}${canonicalPath}`,
    ...(product.sku && { sku: product.sku }),
    ...(manufacturerPartNumber && { mpn: manufacturerPartNumber }),
    ...(product.brand_name && {
      brand: {
        '@type': 'Brand',
        name: product.brand_name,
      },
    }),
    ...(catName && { category: catName }),
    ...(schemaImageUrls.length > 0 && { image: schemaImageUrls }),
    ...(offerSchema && { offers: offerSchema }),
    ...(specifications.length > 0 && {
      additionalProperty: specifications.map((spec) => ({
        '@type': 'PropertyValue',
        name: spec.label,
        value: `${spec.value}${spec.unit ? ` ${spec.unit}` : ''}`,
      })),
    }),
  }

  // Breadcrumbs
  const breadcrumbs = [
    { label: 'Home', href: '/' },
    ...(useDatabaseHierarchy && parentCatSlug
      ? [{ label: parentCatName, href: `/category/${parentCatSlug}` }]
      : []),
    { label: catName, href: `/category/${catSlug}` },
    { label: seoProductName },
  ]

  return (
    <div className="container-main pb-12">
      <StructuredData data={productSchema} />
      <FAQSchema faqs={productFAQs} />
      <Breadcrumbs items={breadcrumbs} />

      {/* Product hero */}
      <div className="grid gap-8 md:grid-cols-2">
        {/* Image */}
        <div className="rounded-lg border border-secondary-200 bg-secondary-50">
          {imageUrl ? (
            <ImageZoom src={imageUrl} alt={product.name} />
          ) : (
            <div className="flex aspect-square items-center justify-center text-secondary-300">
              <svg className="h-32 w-32" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
              </svg>
            </div>
          )}
        </div>

        {/* Product info */}
        <div>
          <p className="text-sm text-secondary-500">
            <span>{displayBrandName}</span>
            {' '}&middot; SKU: {product.sku || 'N/A'}
          </p>
          <h1 className="mt-1 text-2xl font-bold text-secondary-900">{seoProductName}</h1>
          {shortDescription && (
            <p className="mt-3 text-sm leading-relaxed text-secondary-600">{shortDescription}</p>
          )}

          {/* Availability */}
          <div className="mt-4">
            {availability === 'in-stock' ? (
              <span className="badge-success">{leadTime || 'In Stock'}</span>
            ) : availability === 'made-to-order' ? (
              <span className="badge-warning">Made to Order</span>
            ) : (
              <span className="badge-info">Contact for Availability</span>
            )}
          </div>

          {/* Pricing */}
          <div className="mt-6 rounded-lg border border-secondary-200 bg-secondary-50 p-4">
            {canBuyOnline ? (
              <>
                <div className="flex items-baseline gap-2 flex-wrap">
                  <span className="text-2xl font-bold text-secondary-900">
                    ${basePrice!.toFixed(2)}
                  </span>
                  {priceUnit && (
                    <span className="text-sm text-secondary-500">/ {priceUnit}</span>
                  )}
                  {compareAtPrice && (
                    <span className="text-sm text-secondary-400 line-through">
                      ${compareAtPrice.toFixed(2)}
                    </span>
                  )}
                </div>
                {/* Per item price */}
                {perItemPrice && packageQty && packageQty > 1 && (
                  <div className="mt-2 text-sm font-medium text-secondary-600">
                    ${perItemPrice.toFixed(2)}/each
                    <span className="text-secondary-400 ml-2">({packageQty} pcs/pkg)</span>
                  </div>
                )}
              </>
            ) : (
              <div>
                <span className="text-lg font-semibold text-amber-600">Contact for Price</span>
                <p className="mt-1 text-xs text-secondary-500">
                  This product requires a custom quote. Submit an RFQ for best pricing.
                </p>
              </div>
            )}
          </div>

          {/* Tiered Pricing Table */}
          {canBuyOnline && tieredPricing && tieredPricing.length > 1 && (
            <TieredPricingTable
              tiers={tieredPricing.map(t => ({
                minQty: t.minQty,
                maxQty: t.maxQty,
                unitPrice: t.unitPrice,
              }))}
              basePrice={basePrice}
              currency={currency}
              priceUnit={priceUnit}
            />
          )}

          {/* Quantity + Actions */}
          <div className="mt-4 flex flex-col gap-3">
            {canBuyOnline && (
              <AddToCartButton
                product={{
                  productId: product.id,
                  sku: product.sku || '',
                  name: seoProductName,
                  slug: product.slug,
                  categorySlug: catSlug || 'products',
                  image: imageUrl || undefined,
                  price: basePrice,
                  priceUnit: priceUnit,
                }}
                minOrderQuantity={moq}
              />
            )}
            {showQuoteActions && (
              <div className="flex gap-2">
                <AddToQuoteButton
                  sku={product.sku || ''}
                  productName={seoProductName}
                  quantity={moq}
                  className="flex-1"
                />
                <Link href={`/rfq?product=${product.sku}`} className="btn-accent flex-1 text-center">
                  Request Quote
                </Link>
              </div>
            )}
          </div>

          {/* Trust Badges */}
          <TrustBadges />
        </div>
      </div>

      {/* Specs table */}
      {specifications.length > 0 && (
        <section className="mt-12">
          <h2 className="text-lg font-bold text-secondary-900">Technical Specifications</h2>
          <div className="mt-4 overflow-hidden rounded-lg border border-secondary-200">
            <table className="w-full">
              <tbody>
                {specifications.map((spec, i) => (
                  <tr key={spec.label} className={i % 2 === 0 ? 'bg-secondary-50' : 'bg-white'}>
                    <td className="px-4 py-2.5 text-sm font-medium text-secondary-700 w-1/3">
                      {spec.label}
                    </td>
                    <td className="px-4 py-2.5 text-sm text-secondary-600">
                      {spec.value}{spec.unit ? ` ${spec.unit}` : ''}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Description */}
      {descriptionHtml && (
        <section className="mt-10">
          <h2 className="text-lg font-bold text-secondary-900">Product Description</h2>
          <div
            className="mt-4 article-content max-w-none"
            dangerouslySetInnerHTML={{ __html: descriptionHtml }}
          />
        </section>
      )}

      {/* Related Buying Guide */}
      <RelatedGuide categorySlug={catSlug} />

      {/* Related Products */}
      <RelatedProducts products={relatedProducts} />

      {/* Frequently Bought Together (order co-occurrence) */}
      <BoughtTogether productId={product.id} />

      {/* Also Viewed (collaborative filtering) */}
      <AlsoViewed productId={product.id} />

      {/* Track view for server-side analytics */}
      <TrackProductViewServer productId={product.id} />

      {/* Recently Viewed (client-side) */}
      <TrackProductView product={{
        name: seoProductName,
        slug: product.slug,
        categorySlug: catSlug || 'products',
        sku: product.sku || '',
        imageUrl: imageUrl || undefined,
        price: basePrice,
        currency,
      }} />
      <RecentlyViewed excludeSlug={product.slug} />

      {/* FAQ Section */}
      <FAQSection faqs={productFAQs} />
    </div>
  )
}
