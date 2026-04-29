import { NextResponse } from 'next/server'
import { safeQuery } from '@/lib/db'
import { normalizePublicAssetUrls } from '@/lib/public-asset-url'
import { getCanonicalProductCategory, isRelevantRelatedProduct } from '@/lib/seo'

interface ProductContextRow {
  id: string
  name: string
  slug: string
  category_id: string | null
  category_slug: string | null
  category_name: string | null
}

interface RelatedProductRow {
  id: string
  name: string
  slug: string
  sku: string | null
  pricing: unknown | null
  images: unknown | null
  external_image_url: string | null
  category_slug: string | null
  category_name: string | null
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

function parseBasePrice(pricing: unknown): number | undefined {
  if (!pricing) return undefined

  let parsedPricing = pricing

  if (typeof parsedPricing === 'string') {
    try {
      parsedPricing = JSON.parse(parsedPricing)
    } catch {
      return undefined
    }
  }

  if (!parsedPricing || typeof parsedPricing !== 'object') {
    return undefined
  }

  const rawPricing = parsedPricing as Record<string, unknown>
  return parseFiniteNumber(rawPricing.basePrice ?? rawPricing.base_price)
}

function extractProductImageUrl(
  rawImages: unknown,
  externalImageUrl: string | null | undefined,
  baseUrl: string,
): string | undefined {
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
    for (const image of parsedImages as Array<{ url?: string | null }>) {
      if (typeof image?.url === 'string' && image.url.trim()) {
        rawUrls.push(image.url.trim())
      }
    }
  }

  if (typeof externalImageUrl === 'string' && externalImageUrl.trim()) {
    rawUrls.push(externalImageUrl.trim())
  }

  return normalizePublicAssetUrls(rawUrls, {
    baseUrl,
    requireHttps: true,
  })[0]
}

async function getProductContext(productId: string): Promise<ProductContextRow | null> {
  const result = await safeQuery<ProductContextRow>(
    `SELECT
       p.id,
       p.name,
       p.slug,
       c.id AS category_id,
       c.slug AS category_slug,
       c.name AS category_name
     FROM products p
     LEFT JOIN categories c ON p.primary_category_id = c.id
     WHERE p.id::text = $1 AND p.status = 'published'
     LIMIT 1`,
    [productId],
  )

  return result.rows[0] || null
}

async function getSameCategoryProducts(
  categoryId: string,
  currentProductId: string,
  limit: number,
): Promise<RelatedProductRow[]> {
  const result = await safeQuery<RelatedProductRow>(
    `SELECT
       p.id,
       p.name,
       p.slug,
       p.sku,
       p.pricing,
       p.images,
       p.external_image_url,
       c.slug AS category_slug,
       c.name AS category_name
     FROM products p
     LEFT JOIN categories c ON p.primary_category_id = c.id
     WHERE p.primary_category_id = $1
       AND p.status = 'published'
       AND p.id != $2
     ORDER BY p.created_at DESC
     LIMIT $3`,
    [categoryId, currentProductId, limit],
  )

  return result.rows
}

async function getFallbackProducts(
  currentProductId: string,
  limit: number,
): Promise<RelatedProductRow[]> {
  const result = await safeQuery<RelatedProductRow>(
    `SELECT
       p.id,
       p.name,
       p.slug,
       p.sku,
       p.pricing,
       p.images,
       p.external_image_url,
       c.slug AS category_slug,
       c.name AS category_name
     FROM products p
     LEFT JOIN categories c ON p.primary_category_id = c.id
     WHERE p.status = 'published'
       AND p.id != $1
     ORDER BY p.created_at DESC
     LIMIT $2`,
    [currentProductId, limit],
  )

  return result.rows
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const productId = searchParams.get('productId')
  const limit = Number.parseInt(searchParams.get('limit') || '8', 10)
  const maxDisplay = Number.isFinite(limit) ? Math.min(Math.max(limit, 1), 12) : 8

  if (!productId) {
    return NextResponse.json({ products: [], error: 'Missing productId parameter' }, { status: 400 })
  }

  try {
    const product = await getProductContext(productId)

    if (!product) {
      return NextResponse.json({ products: [] })
    }

    const baseUrl = process.env.NEXT_PUBLIC_SERVER_URL || origin
    const results: Array<{
      name: string
      slug: string
      categorySlug: string
      sku: string
      imageUrl?: string
      price?: number
      currency: string
      source: 'same-category'
    }> = []
    const seenIds = new Set<string>([product.id])

    const primaryRows = product.category_id
      ? await getSameCategoryProducts(product.category_id, product.id, maxDisplay)
      : []
    const fallbackRows = primaryRows.length < maxDisplay
      ? await getFallbackProducts(product.id, maxDisplay - primaryRows.length)
      : []

    for (const row of [...primaryRows, ...fallbackRows]) {
      if (results.length >= maxDisplay || seenIds.has(row.id)) {
        continue
      }

      const candidate = {
        name: row.name,
        slug: row.slug,
        categorySlug: row.category_slug,
        categoryName: row.category_name,
      }

      if (!isRelevantRelatedProduct(product, candidate)) {
        continue
      }

      const canonicalCategory = getCanonicalProductCategory(candidate)
      results.push({
        name: row.name,
        slug: row.slug,
        categorySlug: canonicalCategory.slug,
        sku: row.sku || row.id,
        imageUrl: extractProductImageUrl(row.images, row.external_image_url, baseUrl),
        price: parseBasePrice(row.pricing),
        currency: 'USD',
        source: 'same-category',
      })
      seenIds.add(row.id)
    }

    return NextResponse.json(
      { products: results },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=3600',
        },
      },
    )
  } catch (error) {
    console.error('[related-products] Failed to load related products:', error)
    return NextResponse.json({ products: [] }, { status: 500 })
  }
}
