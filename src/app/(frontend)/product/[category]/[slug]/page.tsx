import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getPayload } from 'payload'
import config from '@payload-config'
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

export const dynamic = 'force-dynamic'

interface ProductPageProps {
  params: Promise<{ category: string; slug: string }>
}

// Extract plain text from Lexical richText JSON (for meta descriptions, etc.)
function extractTextFromLexical(richText: unknown): string {
  if (!richText || typeof richText !== 'object') return ''
  const root = (richText as Record<string, unknown>).root as Record<string, unknown> | undefined
  if (!root) return ''
  return extractChildrenPlain(root.children as unknown[])
}

function extractChildrenPlain(children: unknown[]): string {
  if (!Array.isArray(children)) return ''
  return children
    .map((node) => {
      const n = node as Record<string, unknown>
      if (n.type === 'text') return n.text as string
      if (n.children) return extractChildrenPlain(n.children as unknown[])
      return ''
    })
    .join('')
}

// Render Lexical richText as HTML with proper formatting
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

// Common section header patterns in product descriptions
// Only include headers that are unlikely to appear as regular words in sentences
const SECTION_HEADERS = [
  'Overview', 'Key Features', 'Features', 'Specifications', 'Applications',
  'Product Information', 'Product Description', 'Material', 'Size Specifications',
  'Technology & Construction', 'Benefits', 'Description', 'Details',
  'Technical Specifications', 'Product Details', 'Important Notes', 'Note'
  // Removed 'Usage' - it commonly appears in sentences like "high-volume usage"
]

// Convert text with section headers to properly formatted HTML
function formatTextWithHeaders(text: string): string {
  // Only match headers at the START of a line or after whitespace
  // Header must be followed by colon, newline, or end of string
  // This prevents matching words in the middle of sentences
  const headerPattern = SECTION_HEADERS.map(h => h.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')
  const regex = new RegExp(`(?:^|\\n)(${headerPattern})(?:\\s*:|\\s*\\n|\\s*$)`, 'gi')
  
  // Split by header patterns, keeping the headers
  const parts = text.split(regex).filter(Boolean)
  
  if (parts.length <= 1) {
    // No headers found, return as paragraph
    return text ? `<p>${text}</p>` : ''
  }
  
  let result = ''
  let currentHeader = ''
  
  for (let i = 0; i < parts.length; i++) {
    const part = parts[i].trim()
    if (!part) continue
    
    // Check if this part is a header (exact match, case insensitive)
    const isHeader = SECTION_HEADERS.some(h => 
      part.toLowerCase() === h.toLowerCase()
    )
    
    if (isHeader) {
      // Save previous header with content if any
      if (currentHeader) {
        result += `<h3>${currentHeader}</h3>`
      }
      currentHeader = part
    } else {
      // This is content
      if (currentHeader) {
        // We have a header, add it with content
        result += `<h3>${currentHeader}</h3><p>${part}</p>`
        currentHeader = ''
      } else {
        // No header, just content
        result += `<p>${part}</p>`
      }
    }
  }
  
  // Handle remaining header without content
  if (currentHeader) {
    result += `<h3>${currentHeader}</h3>`
  }
  
  return result
}

function lexicalToHtml(richText: unknown): string {
  if (!richText || typeof richText !== 'object') return ''
  const root = (richText as Record<string, unknown>).root as Record<string, unknown> | undefined
  if (!root || !Array.isArray(root.children)) return ''
  return (root.children as Record<string, unknown>[])
    .map((node) => {
      if (node.type === 'paragraph') {
        const text = extractChildren(node.children as unknown[])
        // Check if this paragraph contains section headers
        if (text && SECTION_HEADERS.some(h => new RegExp(`\\b${h}\\s*:?\\b`, 'i').test(text))) {
          return formatTextWithHeaders(text)
        }
        // Check if this paragraph is a text-based list (lines starting with - or *)
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

// Format text-based lists (lines starting with - or *)
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

async function getProductBySlug(slug: string) {
  try {
    const payload = await getPayload({ config })
    const result = await payload.find({
      collection: 'products',
      where: {
        slug: { equals: slug },
        status: { equals: 'published' },
      },
      limit: 1,
      depth: 2, // populate brand, primaryCategory, and primaryCategory.parent
    })
    if (result.docs.length === 0) return null
    return result.docs[0]
  } catch {
    return null
  }
}

interface RelatedProductData {
  name: string
  slug: string
  categorySlug: string
  sku: string
  imageUrl?: string
  price?: number
  currency: string
  source: 'manual' | 'same-brand' | 'same-category'
}

function mapProductToRelated(prod: Record<string, unknown>, source: RelatedProductData['source']): RelatedProductData {
  const pricing = prod.pricing as Record<string, unknown> | undefined
  const catObj = prod.primaryCategory && typeof prod.primaryCategory === 'object'
    ? prod.primaryCategory as Record<string, unknown>
    : null
  const primaryImageObj = prod.primaryImage && typeof prod.primaryImage === 'object'
    ? prod.primaryImage as Record<string, unknown>
    : null
  return {
    name: prod.name as string,
    slug: prod.slug as string,
    categorySlug: (catObj?.slug as string) || 'products',
    sku: prod.sku as string,
    imageUrl: (primaryImageObj?.url as string) || (prod.externalImageUrl as string) || undefined,
    price: pricing?.basePrice as number | undefined,
    currency: (pricing?.currency as string) || 'USD',
    source,
  }
}

async function getRelatedProducts(
  productId: string,
  categoryId: string,
  brandId: string | null,
  basePrice: number | undefined
) {
  const MAX_PRODUCTS = 8
  const results: RelatedProductData[] = []
  const seenIds = new Set<string>([productId])

  try {
    const payload = await getPayload({ config })

    // 1. Manual related products (highest priority)
    const currentProduct = await payload.findByID({
      collection: 'products',
      id: productId,
      depth: 2,
    })
    const manualRelated = currentProduct?.relatedProducts as unknown[] | undefined
    if (manualRelated && Array.isArray(manualRelated)) {
      for (const rel of manualRelated) {
        if (results.length >= MAX_PRODUCTS) break
        const prod = typeof rel === 'object' ? rel as Record<string, unknown> : null
        if (prod && prod.id && prod.status === 'published' && !seenIds.has(prod.id as string)) {
          seenIds.add(prod.id as string)
          results.push(mapProductToRelated(prod, 'manual'))
        }
      }
    }

    // 2. Same brand products (medium priority)
    if (brandId && results.length < MAX_PRODUCTS) {
      const sameBrand = await payload.find({
        collection: 'products',
        where: {
          brand: { equals: brandId },
          status: { equals: 'published' },
          id: { not_in: [...seenIds] },
        },
        limit: MAX_PRODUCTS - results.length,
        depth: 1,
      })
      for (const p of sameBrand.docs) {
        if (results.length >= MAX_PRODUCTS) break
        const prod = p as unknown as Record<string, unknown>
        if (!seenIds.has(prod.id as string)) {
          seenIds.add(prod.id as string)
          results.push(mapProductToRelated(prod, 'same-brand'))
        }
      }
    }

    // 3. Same category products (fill remaining slots)
    if (categoryId && results.length < MAX_PRODUCTS) {
      // Build where clause with optional price range
      const whereClause = {
        primaryCategory: { equals: categoryId },
        status: { equals: 'published' },
        id: { not_in: [...seenIds] },
        ...(basePrice && basePrice > 0 ? {
          'pricing.basePrice': {
            greater_than_equal: basePrice * 0.5,
            less_than_equal: basePrice * 2,
          }
        } : {}),
      }

      const sameCategory = await payload.find({
        collection: 'products',
        where: whereClause as any,
        limit: MAX_PRODUCTS - results.length,
        depth: 1,
        sort: '-createdAt',
      })

      for (const p of sameCategory.docs) {
        if (results.length >= MAX_PRODUCTS) break
        const prod = p as unknown as Record<string, unknown>
        if (!seenIds.has(prod.id as string)) {
          seenIds.add(prod.id as string)
          results.push(mapProductToRelated(prod, 'same-category'))
        }
      }

      // If still not enough, get any from same category (ignore price filter)
      if (results.length < MAX_PRODUCTS) {
        const moreFromCategory = await payload.find({
          collection: 'products',
          where: {
            primaryCategory: { equals: categoryId },
            status: { equals: 'published' },
            id: { not_in: [...seenIds] },
          },
          limit: MAX_PRODUCTS - results.length,
          depth: 1,
          sort: '-createdAt',
        })
        for (const p of moreFromCategory.docs) {
          if (results.length >= MAX_PRODUCTS) break
          const prod = p as unknown as Record<string, unknown>
          if (!seenIds.has(prod.id as string)) {
            seenIds.add(prod.id as string)
            results.push(mapProductToRelated(prod, 'same-category'))
          }
        }
      }
    }

    return results
  } catch {
    return []
  }
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { slug } = await params
  const product = await getProductBySlug(slug)
  if (!product) return { title: 'Product Not Found' }

  const brandName = product.brand && typeof product.brand === 'object'
    ? (product.brand as unknown as Record<string, unknown>).name as string
    : ''
  const catObj = product.primaryCategory && typeof product.primaryCategory === 'object'
    ? product.primaryCategory as unknown as Record<string, unknown>
    : null
  const catSlug = catObj?.slug as string || 'products'

  const serverUrl = process.env.NEXT_PUBLIC_SERVER_URL || 'https://machrio.com'
  const p = product as unknown as Record<string, unknown>
  const externalImageUrl = p.externalImageUrl as string | undefined
  const primaryImageObj = p.primaryImage && typeof p.primaryImage === 'object'
    ? p.primaryImage as Record<string, unknown>
    : null
  const imageUrl = primaryImageObj?.url as string || externalImageUrl || ''
  const fullImageUrl = imageUrl ? (imageUrl.startsWith('http') ? imageUrl : `${serverUrl}${imageUrl}`) : ''

  const title = `${product.name}${brandName ? ` - ${brandName}` : ''} | Machrio`
  const description = product.shortDescription || `Shop ${product.name} from Machrio. Industrial-grade products with transparent pricing.`

  return {
    title,
    description,
    alternates: { canonical: `/product/${catSlug}/${slug}/` },
    openGraph: {
      title,
      description,
      url: `${serverUrl}/product/${catSlug}/${slug}/`,
      ...(fullImageUrl && {
        images: [{ url: fullImageUrl, width: 800, height: 800, alt: product.name as string }],
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

function generateProductFAQs(product: Record<string, unknown>) {
  const faqs: { question: string; answer: string }[] = []
  const name = product.name as string
  const brandObj = product.brand && typeof product.brand === 'object' ? product.brand as Record<string, unknown> : null
  const brandName = brandObj?.name as string || ''

  // 1. Specification / Selection question — helps buyer confirm fit
  const catObj = product.primaryCategory && typeof product.primaryCategory === 'object'
    ? product.primaryCategory as Record<string, unknown>
    : null
  const catName = catObj?.name as string || ''
  const specifications = (product.specifications as Record<string, unknown>[] | undefined) || []
  const specSummary = specifications.slice(0, 3).map(s => `${s.label}: ${s.value}`).join(', ')
  faqs.push({
    question: `What are the key specifications of ${name}?`,
    answer: specSummary
      ? `Key specifications for ${name}: ${specSummary}. See the full specification table on this page for complete details. If you need help confirming whether this product fits your application, use our AI Sourcing Assistant or submit an RFQ with your requirements.`
      : `Full specifications for ${name} are listed in the specification table on this page.${catName ? ` This product is in the ${catName} category.` : ''} If you need help confirming fit for your application, use our AI Sourcing Assistant or submit an RFQ with your requirements.`,
  })

  // 2. Pricing / MOQ question — core procurement concern
  const moq = product.minOrderQuantity as number || 1
  const pricing = product.pricing as Record<string, unknown> | undefined
  const tiered = pricing?.tieredPricing as Record<string, unknown>[] | undefined
  const basePrice = pricing?.basePrice as number | undefined
  faqs.push({
    question: `What is the minimum order quantity and bulk pricing for ${name}?`,
    answer: `The minimum order quantity is ${moq} unit(s).${basePrice ? ` Unit price starts at $${basePrice}.` : ''}${tiered && tiered.length > 1 ? ' Volume discounts are available — see the tiered pricing table on this page for exact breakpoints.' : ''} For quantities beyond what is listed, or for custom pricing on recurring orders, submit an RFQ and our team will respond within 24 hours.`,
  })

  // 3. Lead time / Availability — the #1 operational concern
  const availability = product.availability as string || 'contact'
  const leadTime = product.leadTime as string || ''
  const availabilityText = availability === 'in-stock'
    ? 'This product is currently in stock and ships within 1-2 business days.'
    : availability === 'made-to-order'
    ? 'This product is made to order.'
    : 'Contact us for current availability.'
  faqs.push({
    question: `What is the lead time and availability for ${name}?`,
    answer: `${availabilityText}${leadTime ? ` Estimated lead time: ${leadTime}.` : ''} For bulk orders, lead times may vary based on quantity — request a quote for a confirmed delivery date. We can also arrange scheduled recurring shipments to prevent stockouts.`,
  })

  // 4. Brand / Compatibility question — if brand is known
  if (brandName && brandName !== 'Unbranded') {
    faqs.push({
      question: `Is this a genuine ${brandName} product? Do you carry other ${brandName} items?`,
      answer: `Yes, this is a genuine ${brandName} product sourced through authorized supply channels. We carry a range of ${brandName} products across our catalog — browse our ${brandName} brand page for the full selection. If you need a specific ${brandName} part number that is not listed, submit an RFQ and our sourcing team will locate it for you.`,
    })
  }

  // 5. RFQ / Custom quote question — for both purchase modes
  const purchaseMode = product.purchaseMode as string
  if (purchaseMode === 'both' || purchaseMode === 'rfq-only') {
    faqs.push({
      question: `How do I get a custom quote for ${name}?`,
      answer: `Click the "Request a Quote" button on this page or visit our RFQ form. Include your required quantity, delivery location, and any special requirements (specific certifications, custom packaging, recurring delivery schedule). Our sourcing team typically responds within 24 hours with pricing, confirmed lead time, and shipping options.`,
    })
  }

  return faqs
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params
  const product = await getProductBySlug(slug)
  if (!product) notFound()

  const p = product as unknown as Record<string, unknown>
  const serverUrl = process.env.NEXT_PUBLIC_SERVER_URL || 'https://machrio.com'

  // Resolve brand
  const brandObj = p.brand && typeof p.brand === 'object' ? p.brand as Record<string, unknown> : null
  const brandName = brandObj?.name as string || 'Unbranded'
  const brandSlug = brandObj?.slug as string || ''

  // Resolve category hierarchy
  const catObj = p.primaryCategory && typeof p.primaryCategory === 'object'
    ? p.primaryCategory as Record<string, unknown>
    : null
  const catName = catObj?.name as string || ''
  const catSlug = catObj?.slug as string || ''
  const parentCatObj = catObj?.parent && typeof catObj.parent === 'object'
    ? catObj.parent as Record<string, unknown>
    : null
  const parentCatName = parentCatObj?.name as string || ''
  const parentCatSlug = parentCatObj?.slug as string || ''

  // Image
  const externalImageUrl = p.externalImageUrl as string | undefined
  const primaryImageObj = p.primaryImage && typeof p.primaryImage === 'object'
    ? p.primaryImage as Record<string, unknown>
    : null
  const imageUrl = primaryImageObj?.url as string || externalImageUrl || ''

  // Pricing
  const pricing = p.pricing as Record<string, unknown> | undefined
  const basePrice = pricing?.basePrice as number | undefined
  const priceUnit = pricing?.priceUnit as string | undefined
  const currency = (pricing?.currency as string) || 'USD'
  const packageQty = p.packageQty as number | undefined
  const unitPrice = packageQty && packageQty > 1 && basePrice ? (basePrice / packageQty) : null
  const tieredPricing = pricing?.tieredPricing as Record<string, unknown>[] | undefined
  const compareAtPrice = pricing?.compareAtPrice as number | undefined

  // Specs
  const specifications = (p.specifications as Record<string, unknown>[] | undefined) || []

  // Shipping & Facets (for enhanced schema)
  const shippingInfo = p.shippingInfo as Record<string, unknown> | undefined
  const weightKg = shippingInfo?.weight as number | undefined
  const facets = p.facets as Record<string, unknown> | undefined
  const materials = facets?.material as string[] | undefined

  // Description
  const descriptionHtml = lexicalToHtml(p.fullDescription)
  const shortDescription = (p.shortDescription as string) || ''

  const purchaseMode = (p.purchaseMode as string) || 'both'
  const availability = (p.availability as string) || 'contact'
  const leadTime = (p.leadTime as string) || ''
  const moq = (p.minOrderQuantity as number) || 1

  const canBuyOnline = (purchaseMode === 'both' || purchaseMode === 'buy-online') && basePrice
  const canRFQ = purchaseMode === 'both' || purchaseMode === 'rfq-only'

  // FAQs
  const productFAQs = generateProductFAQs(p)

  // Related products: manual > same brand > same category
  const categoryId = catObj?.id as string || ''
  const brandId = brandObj?.id as string || null
  const relatedProducts = await getRelatedProducts(p.id as string, categoryId, brandId, basePrice)

  // Schema.org - Enhanced Product Schema with complete offers
  // Note: aggregateRating and review are intentionally omitted until real review system is launched (P3)
  const productSchema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: p.name,
    description: shortDescription,
    sku: p.sku,
    mpn: p.sku,
    ...(p.gtin13 ? { gtin13: p.gtin13 as string } : {}),
    brand: {
      '@type': 'Brand',
      name: brandName,
      ...(brandSlug && { url: `${serverUrl}/brand/${brandSlug}` }),
    },
    ...(catName && { category: catName }),
    ...(imageUrl && { image: imageUrl }),
    offers: basePrice
      ? {
          '@type': 'Offer',
          price: basePrice,
          priceCurrency: currency,
          // Extended to 90 days for SEO stability
          priceValidUntil: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          availability: availability === 'in-stock'
            ? 'https://schema.org/InStock'
            : availability === 'made-to-order'
            ? 'https://schema.org/PreOrder'
            : availability === 'out-of-stock'
            ? 'https://schema.org/OutOfStock'
            : 'https://schema.org/LimitedAvailability',
          url: `${serverUrl}/product/${catSlug || 'products'}/${p.slug}/`,
          seller: { '@type': 'Organization', name: 'Machrio', url: serverUrl },
          itemCondition: 'https://schema.org/NewCondition',
          // Shipping details for Rich Results
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
          // Return policy for trust signals
          hasMerchantReturnPolicy: {
            '@type': 'MerchantReturnPolicy',
            applicableCountry: 'US',
            returnPolicyCategory: 'https://schema.org/MerchantReturnFiniteReturnWindow',
            merchantReturnDays: 30,
            returnMethod: 'https://schema.org/ReturnByMail',
            returnFees: 'https://schema.org/FreeReturn',
          },
        }
      : {
          '@type': 'Offer',
          availability: 'https://schema.org/InStock',
          url: `${serverUrl}/product/${catSlug || 'products'}/${p.slug}/`,
          seller: { '@type': 'Organization', name: 'Machrio', url: serverUrl },
          itemCondition: 'https://schema.org/NewCondition',
          hasMerchantReturnPolicy: {
            '@type': 'MerchantReturnPolicy',
            applicableCountry: 'US',
            returnPolicyCategory: 'https://schema.org/MerchantReturnFiniteReturnWindow',
            merchantReturnDays: 30,
            returnMethod: 'https://schema.org/ReturnByMail',
          },
        },
    ...(weightKg && {
      weight: {
        '@type': 'QuantitativeValue',
        value: weightKg,
        unitCode: 'KGM',
      },
    }),
    ...(materials && materials.length > 0 && {
      material: materials.join(', '),
    }),
    ...(specifications.length > 0 && {
      additionalProperty: specifications.map((spec) => ({
        '@type': 'PropertyValue',
        name: spec.label as string,
        value: `${spec.value as string}${spec.unit ? ` ${spec.unit}` : ''}`,
      })),
    }),
  }

  // Breadcrumbs
  const breadcrumbs = [
    { label: 'Home', href: '/' },
    ...(parentCatSlug
      ? [{ label: parentCatName, href: `/category/${parentCatSlug}` }]
      : []),
    ...(catSlug
      ? [{ label: catName, href: `/category/${catSlug}` }]
      : []),
    { label: p.name as string },
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
            <ImageZoom src={imageUrl} alt={p.name as string} />
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
            {brandSlug ? (
              <Link href={`/brand/${brandSlug}`} className="hover:text-primary-700">{brandName}</Link>
            ) : (
              <span>{brandName}</span>
            )}
            {' '}&middot; SKU: {p.sku as string}
          </p>
          <h1 className="mt-1 text-2xl font-bold text-secondary-900">{p.name as string}</h1>
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
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-secondary-900">
                    ${basePrice.toFixed(2)}
                  </span>
                  {unitPrice && (
                    <span className="text-sm text-secondary-500">(${unitPrice.toFixed(2)}/each)</span>
                  )}
                  {!unitPrice && priceUnit && (
                    <span className="text-sm text-secondary-500">/ {priceUnit}</span>
                  )}
                  {compareAtPrice && (
                    <span className="text-sm text-secondary-400 line-through">
                      ${compareAtPrice.toFixed(2)}
                    </span>
                  )}
                </div>
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
                minQty: t.minQty as number,
                maxQty: t.maxQty as number | undefined,
                unitPrice: t.unitPrice as number,
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
                  productId: p.id as string,
                  sku: p.sku as string,
                  name: p.name as string,
                  slug: p.slug as string,
                  categorySlug: catSlug || 'products',
                  image: imageUrl || undefined,
                  price: basePrice,
                  priceUnit: priceUnit,
                }}
                minOrderQuantity={moq}
              />
            )}
            {canRFQ && (
              <div className="flex gap-2">
                <AddToQuoteButton
                  sku={p.sku as string}
                  productName={p.name as string}
                  quantity={moq}
                  className="flex-1"
                />
                <Link href={`/rfq?product=${p.sku}`} className="btn-accent flex-1 text-center">
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
                  <tr key={spec.label as string} className={i % 2 === 0 ? 'bg-secondary-50' : 'bg-white'}>
                    <td className="px-4 py-2.5 text-sm font-medium text-secondary-700 w-1/3">
                      {spec.label as string}
                    </td>
                    <td className="px-4 py-2.5 text-sm text-secondary-600">
                      {spec.value as string}{spec.unit ? ` ${spec.unit}` : ''}
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
      <BoughtTogether productId={p.id as string} />

      {/* Also Viewed (collaborative filtering) */}
      <AlsoViewed productId={p.id as string} />

      {/* Track view for server-side analytics */}
      <TrackProductViewServer productId={p.id as string} />

      {/* Recently Viewed (client-side) */}
      <TrackProductView product={{
        name: p.name as string,
        slug: p.slug as string,
        categorySlug: catSlug || 'products',
        sku: p.sku as string,
        imageUrl: imageUrl || undefined,
        price: basePrice,
        currency,
      }} />
      <RecentlyViewed excludeSlug={p.slug as string} />

      {/* FAQ Section */}
      <FAQSection faqs={productFAQs} />
    </div>
  )
}
