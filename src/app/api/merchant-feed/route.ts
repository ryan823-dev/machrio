import { NextResponse } from 'next/server'
import { getPool } from '@/lib/db'
import { normalizePublicAssetUrl } from '@/lib/public-asset-url'
import { getProductBrandQueryParts } from '@/lib/product-brand-query'
import { normalizePurchaseMode } from '@/lib/purchase-mode'
import { getCanonicalProductCategory } from '@/lib/seo'

/**
 * Google Merchant Center XML Feed
 * 根据 Google Merchant Center 规范生成产品数据
 * 文档：https://support.google.com/merchants/answer/7052112
 */

export async function GET() {
  const pool = getPool()
  
  try {
    const { brandSelectSql, brandJoinSql } = await getProductBrandQueryParts(pool)
    const result = await pool.query<{
      id: string
      name: string
      slug: string
      sku: string | null
      short_description: string | null
      pricing: unknown | null
      images: unknown | null
      external_image_url: string | null
      availability: string | null
      purchase_mode: string | null
      category_slug: string | null
      category_name: string | null
      brand_name: string | null
    }>(
      `SELECT
        p.id,
        p.name,
        p.slug,
        p.sku,
        p.short_description,
        p.pricing,
        p.images,
        p.external_image_url,
        p.availability,
        p.purchase_mode,
        c.slug as category_slug,
        c.name as category_name,
        ${brandSelectSql}
       FROM products p
       LEFT JOIN categories c ON p.primary_category_id = c.id
       ${brandJoinSql}
       WHERE p.status = 'published'
       ORDER BY p.created_at DESC
       LIMIT 10000`,
    )

    const products = result.rows
    const baseUrl =
      process.env.NEXT_PUBLIC_SERVER_URL ||
      process.env.NEXT_PUBLIC_SITE_URL ||
      'https://machrio.com'

    // 构建 XML
    const xmlParts: string[] = []

    // XML 声明和命名空间
    xmlParts.push(`<?xml version="1.0" encoding="UTF-8"?>`)
    xmlParts.push(`<rss xmlns:g="http://base.google.com/ns/1.0" version="2.0">`)
    xmlParts.push(`<channel>`)
    xmlParts.push(`<title>Machrio Industrial Supplies Product Feed</title>`)
    xmlParts.push(`<link>${baseUrl}</link>`)
    xmlParts.push(`<description>Industrial supplies and equipment from Machrio</description>`)

    // 添加每个产品
    for (const product of products) {
      const images = parseProductImages(product.images)
      const pricing = parseProductPricing(product.pricing)
      const basePrice = parsePositivePrice(pricing?.basePrice)
      const purchaseMode = normalizePurchaseMode(product.purchase_mode)
      const canBuyOnline =
        (purchaseMode === 'both' || purchaseMode === 'buy-online') &&
        basePrice !== null
      const imageUrl = getMerchantImageUrl(product.external_image_url, images, baseUrl)

      if (!canBuyOnline || !imageUrl) {
        continue
      }

      const canonicalCategory = getCanonicalProductCategory({
        name: product.name,
        slug: product.slug,
        categorySlug: product.category_slug,
        categoryName: product.category_name,
      })
      const productUrl = `${baseUrl}/product/${canonicalCategory.slug}/${product.slug}`
      const currency = pricing?.currency || 'USD'

      xmlParts.push(`<item>`)
      
      // 必需字段
      
      // g:id - 产品唯一标识符（使用 SKU）
      xmlParts.push(`<g:id>${escapeXml(product.sku || product.id)}</g:id>`)
      
      // g:title - 产品名称（最多 150 字符）
      const title = truncate(product.name, 150)
      xmlParts.push(`<g:title>${escapeXml(title)}</g:title>`)
      
      // g:description - 产品描述（最多 5000 字符）
      const description = product.short_description || product.name
      xmlParts.push(`<g:description>${escapeXml(description)}</g:description>`)
      
      // g:link - 产品页面 URL
      xmlParts.push(`<g:link>${escapeXml(productUrl)}</g:link>`)
      
      // g:image_link - 主产品图片 URL
      xmlParts.push(`<g:image_link>${escapeXml(imageUrl)}</g:image_link>`)
      
      // g:availability - 库存状态
      const availability = mapAvailability(product.availability)
      xmlParts.push(`<g:availability>${availability}</g:availability>`)
      
      // g:price - 价格和货币
      xmlParts.push(`<g:price>${basePrice.toFixed(2)} ${currency}</g:price>`)
      
      // 可选但推荐的字段
      
      // g:brand - 品牌名称（查询品牌表）
      const brandName = product.brand_name || 'Machrio'
      xmlParts.push(`<g:brand>${escapeXml(brandName)}</g:brand>`)
      
      // g:condition - 产品状态（new/refurbished/used）
      xmlParts.push(`<g:condition>new</g:condition>`)
      
      // g:target_country - 目标销售国家
      xmlParts.push(`<g:target_country>US</g:target_country>`)
      
      // g:product_type - 产品类别（使用分类路径）
      if (product.category_name) {
        xmlParts.push(`<g:product_type>${escapeXml(product.category_name)}</g:product_type>`)
      }
      
      // g:mpn - 制造商部件号（使用 SKU）
      if (product.sku) {
        xmlParts.push(`<g:mpn>${escapeXml(product.sku)}</g:mpn>`)
      }
      
      // g:gtin - 如果有 GTIN
      // 如果数据库有 gtin 字段，可以在这里添加
      
      // g:availability_date - 如果有预计到货日期
      if (product.availability === 'backorder') {
        // 可以添加预计到货日期
      }
      
      xmlParts.push(`</item>`)
    }

    // 关闭标签
    xmlParts.push(`</channel>`)
    xmlParts.push(`</rss>`)

    const xmlContent = xmlParts.join('\n')

    // 注意：不要调用 pool.end()！在 serverless 环境中连接池应该被复用

    return new NextResponse(xmlContent, {
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
      },
    })
  } catch (error) {
    console.error('Error generating merchant feed:', error)
    // 不要调用 pool.end()！
    return NextResponse.json(
      { error: 'Failed to generate product feed' },
      { status: 500 }
    )
  }
}

/**
 * XML 特殊字符转义
 */
function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

/**
 * 截断文本到指定长度
 */
function truncate(text: string, maxLength: number): string {
  if (!text) return ''
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength - 3) + '...'
}

/**
 * 映射库存状态到 Google Merchant 格式
 */
function mapAvailability(availability: string | null): string {
  if (!availability) return 'in_stock'
  
  const status = availability.toLowerCase()
  if (status === 'in_stock' || status === 'instock' || status === 'in-stock') return 'in_stock'
  if (status === 'out_of_stock' || status === 'outofstock' || status === 'out-of-stock') return 'out_of_stock'
  if (status === 'made-to-order') return 'preorder'
  if (status === 'backorder') return 'backorder'
  if (status === 'preorder' || status === 'pre-order') return 'preorder'
  
  return 'in_stock'
}

function parseProductImages(images: unknown): Array<{ url?: string }> {
  if (Array.isArray(images)) return images as Array<{ url?: string }>

  if (typeof images === 'string') {
    try {
      const parsed = JSON.parse(images)
      return Array.isArray(parsed) ? parsed as Array<{ url?: string }> : []
    } catch {
      return []
    }
  }

  return []
}

function parseProductPricing(pricing: unknown): { basePrice?: unknown; currency?: string } | null {
  if (!pricing) return null

  if (typeof pricing === 'string') {
    try {
      const parsed = JSON.parse(pricing)
      return parsed && typeof parsed === 'object'
        ? parsed as { basePrice?: unknown; currency?: string }
        : null
    } catch {
      return null
    }
  }

  return typeof pricing === 'object'
    ? pricing as { basePrice?: unknown; currency?: string }
    : null
}

function parsePositivePrice(value: unknown): number | null {
  if (typeof value === 'number') {
    return Number.isFinite(value) && value > 0 ? value : null
  }

  if (typeof value === 'string') {
    const parsed = Number.parseFloat(value)
    return Number.isFinite(parsed) && parsed > 0 ? parsed : null
  }

  return null
}

function getMerchantImageUrl(
  externalImageUrl: string | null,
  images: Array<{ url?: string }>,
  baseUrl: string,
): string | null {
  const candidates = [
    externalImageUrl,
    ...images.map((image) => image?.url || null),
  ]

  for (const candidate of candidates) {
    const normalized = normalizePublicAssetUrl(candidate, {
      baseUrl,
      requireHttps: true,
    })

    if (normalized) {
      return normalized
    }
  }

  return null
}
