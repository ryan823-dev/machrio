import { NextResponse } from 'next/server'
import { getProducts } from '@/lib/db'
import { getPool } from '@/lib/db'

/**
 * Google Merchant Center XML Feed
 * 根据 Google Merchant Center 规范生成产品数据
 * 文档：https://support.google.com/merchants/answer/7052112
 */

export async function GET() {
  const pool = getPool()
  
  try {
    // 获取所有已发布的产品（不限制数量）
    const result = await getProducts({ 
      limit: 10000,  // 获取足够多的产品
      status: 'published' 
    })

    const products = result.docs
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://machrio.com'

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
      const images = Array.isArray(product.images)
        ? product.images
        : typeof product.images === 'string'
          ? JSON.parse(product.images)
          : null

      const pricing = product.pricing && typeof product.pricing === 'string'
        ? JSON.parse(product.pricing)
        : product.pricing

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
      xmlParts.push(`<g:link>${baseUrl}/products/${product.slug}</g:link>`)
      
      // g:image_link - 主产品图片 URL
      // 优先使用 external_image_url，如果没有则尝试从 images 数组获取
      let imageUrl = product.external_image_url
      
      // 如果没有 external_image_url，检查 images 字段（JSON 数组）
      if (!imageUrl && Array.isArray(images)) {
        const productImages = images as Array<{ url?: string }>
        if (productImages.length > 0 && productImages[0].url) {
          imageUrl = productImages[0].url
        }
      }
      
      if (imageUrl) {
        xmlParts.push(`<g:image_link>${escapeXml(imageUrl)}</g:image_link>`)
      } else {
        // 如果没有图片，使用占位图（Google 可能不接受，但先保证格式完整）
        // 注意：建议上传一个默认的占位图片到 /public/placeholder-product.jpg
        xmlParts.push(`<g:image_link>${baseUrl}/placeholder-product.jpg</g:image_link>`)
      }
      
      // g:availability - 库存状态
      const availability = mapAvailability(product.availability)
      xmlParts.push(`<g:availability>${availability}</g:availability>`)
      
      // g:price - 价格和货币
      if (pricing && typeof pricing === 'object' && 'basePrice' in pricing) {
        const productPricing = pricing as { basePrice: number; currency: string }
        const price = `${productPricing.basePrice.toFixed(2)} ${productPricing.currency || 'USD'}`
        xmlParts.push(`<g:price>${price}</g:price>`)
      } else {
        // 如果没有价格，提供默认值
        xmlParts.push(`<g:price>0.00 USD</g:price>`)
      }
      
      // 可选但推荐的字段
      
      // g:brand - 品牌名称（查询品牌表）
      let brandName = 'Machrio'
      if (product.brand_id) {
        try {
          const brandResult = await pool.query(
            'SELECT name FROM brands WHERE id = $1',
            [product.brand_id]
          )
          if (brandResult.rows.length > 0) {
            brandName = brandResult.rows[0].name
          }
        } catch (err) {
          console.error('Error fetching brand:', err)
        }
      }
      xmlParts.push(`<g:brand>${escapeXml(brandName)}</g:brand>`)
      
      // g:condition - 产品状态（new/refurbished/used）
      xmlParts.push(`<g:condition>new</g:condition>`)
      
      // g:target_country - 目标销售国家
      xmlParts.push(`<g:target_country>US</g:target_country>`)
      
      // g:product_type - 产品类别（使用分类路径）
      if (product.primary_category_id) {
        try {
          const categoryResult = await pool.query(
            `SELECT c1.name as l1, c2.name as l2, c3.name as l3
             FROM categories c3
             LEFT JOIN categories c2 ON c3.parent_id = c2.id
             LEFT JOIN categories c1 ON c2.parent_id = c1.id
             WHERE c3.id = $1`,
            [product.primary_category_id]
          )
          if (categoryResult.rows.length > 0) {
            const cat = categoryResult.rows[0]
            const categoryPath = [cat.l1, cat.l2, cat.l3].filter(Boolean).join(' > ')
            xmlParts.push(`<g:product_type>${escapeXml(categoryPath)}</g:product_type>`)
          }
        } catch (err) {
          console.error('Error fetching category:', err)
        }
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
  if (status === 'in_stock' || status === 'instock') return 'in_stock'
  if (status === 'out_of_stock' || status === 'outofstock') return 'out_of_stock'
  if (status === 'backorder') return 'backorder'
  if (status === 'preorder') return 'preorder'
  
  return 'in_stock'
}
