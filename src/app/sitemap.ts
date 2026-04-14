import type { MetadataRoute } from 'next'
import { getPool } from '@/lib/db'

export const dynamic = 'force-static'
export const revalidate = 3600 // 每小时重新生成

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SERVER_URL || 'https://machrio.com'

  // 静态页面
  const staticPages: MetadataRoute.Sitemap = [
    { url: baseUrl, lastModified: new Date(), changeFrequency: 'daily', priority: 1 },
    { url: `${baseUrl}/category`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
    { url: `${baseUrl}/new-arrivals`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.8 },
    { url: `${baseUrl}/rfq`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.8 },
    { url: `${baseUrl}/deals`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.7 },
    { url: `${baseUrl}/knowledge-center`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.6 },
    { url: `${baseUrl}/glossary`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.6 },
    { url: `${baseUrl}/about`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
    { url: `${baseUrl}/contact`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
    { url: `${baseUrl}/faq`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
    { url: `${baseUrl}/terms`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.3 },
    { url: `${baseUrl}/privacy`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.3 },
    { url: `${baseUrl}/how-to-order`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.4 },
    { url: `${baseUrl}/payment-methods`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.4 },
    { url: `${baseUrl}/shipping-policy`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.4 },
    { url: `${baseUrl}/return-refund`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.4 },
    { url: `${baseUrl}/clearance-duties`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.4 },
    { url: `${baseUrl}/industry/manufacturing`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.6 },
    { url: `${baseUrl}/industry/construction`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.6 },
    { url: `${baseUrl}/industry/automotive`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.6 },
    { url: `${baseUrl}/industry/healthcare`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.6 },
    { url: `${baseUrl}/industry/food-beverage`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.6 },
    { url: `${baseUrl}/industry/warehouse`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.6 },
  ]

  // 如果没有数据库连接，只返回静态页面
  if (!process.env.DATABASE_URI) {
    console.warn('DATABASE_URI not configured, returning static pages only')
    return staticPages
  }

  // 使用全局连接池获取数据
  const pool = getPool()

  try {
    // 获取分类（带超时）
    const categoriesResult = await Promise.race([
      pool.query('SELECT slug, updated_at FROM categories ORDER BY display_order'),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Categories query timeout')), 5000)
      ) as Promise<any>
    ])
    
    const categoryPages: MetadataRoute.Sitemap = categoriesResult.rows.map((cat: { slug: string; updated_at: string | null }) => ({
      url: `${baseUrl}/category/${cat.slug}`,
      lastModified: cat.updated_at ? new Date(cat.updated_at) : new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    }))
    staticPages.push(...categoryPages)

    // 获取所有产品（带分类路径，带超时）
    const productsResult = await Promise.race([
      pool.query(`
        SELECT p.slug, p.updated_at, c.slug as category_slug
        FROM products p
        LEFT JOIN categories c ON p.primary_category_id = c.id
        WHERE p.status = 'published'
        ORDER BY p.created_at DESC
      `),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Products query timeout')), 10000)
      ) as Promise<any>
    ])
    
    const productPages: MetadataRoute.Sitemap = productsResult.rows.map((product: { slug: string; updated_at: string | null; category_slug: string | null }) => ({
      url: `${baseUrl}/product/${product.category_slug || 'products'}/${product.slug}`,
      lastModified: product.updated_at ? new Date(product.updated_at) : new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.6,
    }))
    staticPages.push(...productPages)
    
    console.log(`Sitemap generated: ${staticPages.length} URLs`)
  } catch (error) {
    console.error('Sitemap database query failed, returning static pages only:', error)
    // 即使失败也返回静态页面，而不是空数组
  }
  // 注意：不要调用 pool.end()！在 serverless 环境中连接池应该被复用

  return staticPages
}
