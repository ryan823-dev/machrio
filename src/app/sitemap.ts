import type { MetadataRoute } from 'next'
import { getPayload } from 'payload'
import config from '@payload-config'

// 使用动态渲染，避免构建时超时
export const dynamic = 'force-dynamic'
export const revalidate = 86400 // 每天重新验证一次

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SERVER_URL || 'https://www.machrio.com'

  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    { url: baseUrl, lastModified: new Date(), changeFrequency: 'daily', priority: 1 },
    { url: `${baseUrl}/category`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
    { url: `${baseUrl}/new-arrivals`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.8 },
    { url: `${baseUrl}/rfq`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.8 },
    { url: `${baseUrl}/deals`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.7 },
    { url: `${baseUrl}/knowledge-center`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.6 },
    { url: `${baseUrl}/glossary`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.6 },
    { url: `${baseUrl}/about`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
    { url: `${baseUrl}/contact`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
    { url: `${baseUrl}/faq`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
    { url: `${baseUrl}/terms`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.3 },
    { url: `${baseUrl}/privacy`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.3 },
    // Industry pages
    { url: `${baseUrl}/industry/manufacturing`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.6 },
    { url: `${baseUrl}/industry/construction`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.6 },
    { url: `${baseUrl}/industry/automotive`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.6 },
    { url: `${baseUrl}/industry/healthcare`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.6 },
    { url: `${baseUrl}/industry/food-beverage`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.6 },
    { url: `${baseUrl}/industry/warehouse`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.6 },
  ]

  let categoryPages: MetadataRoute.Sitemap = []
  let productPages: MetadataRoute.Sitemap = []
  let articlePages: MetadataRoute.Sitemap = []

  try {
    const payload = await getPayload({ config })

    // 仅获取分类
    const categories = await payload.find({
      collection: 'categories',
      limit: 500,
    })
    categoryPages = categories.docs.map((category) => ({
      url: `${baseUrl}/category/${category.slug}`,
      lastModified: new Date(category.updatedAt),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    }))

    // 构建分类 slug 映射
    const categorySlugMap = new Map<string, string>()
    for (const cat of categories.docs) {
      categorySlugMap.set(cat.id, cat.slug)
    }

    // 仅获取最新的 2000 个产品（减少查询时间）
    const products = await payload.find({
      collection: 'products',
      limit: 2000,
      where: { status: { equals: 'published' } },
      depth: 1,
      sort: '-updatedAt',
    })

    productPages = products.docs.map((product) => {
      let categorySlug = 'products'
      const primaryCategory = product.primaryCategory
      if (primaryCategory && typeof primaryCategory === 'object') {
        const cat = primaryCategory as unknown as Record<string, unknown>
        const parentRef = cat.parent
        if (parentRef && typeof parentRef === 'object') {
          categorySlug = (parentRef as Record<string, unknown>).slug as string || 'products'
        } else if (parentRef && typeof parentRef === 'string') {
          categorySlug = categorySlugMap.get(parentRef) || cat.slug as string || 'products'
        } else {
          categorySlug = cat.slug as string || 'products'
        }
      }
      return {
        url: `${baseUrl}/product/${categorySlug}/${product.slug}`,
        lastModified: new Date(product.updatedAt),
        changeFrequency: 'weekly' as const,
        priority: 0.7,
      }
    })

    // 获取文章
    const articles = await payload.find({
      collection: 'articles',
      limit: 500,
      where: { status: { equals: 'published' } },
    })
    articlePages = articles.docs.map((article) => ({
      url: `${baseUrl}/knowledge-center/${article.slug}`,
      lastModified: new Date(article.updatedAt),
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    }))

  } catch (error) {
    console.error('Sitemap generation error:', error)
  }

  return [...staticPages, ...categoryPages, ...productPages, ...articlePages]
}