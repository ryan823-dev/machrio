import type { MetadataRoute } from 'next'
import { getPayload } from 'payload'
import config from '@payload-config'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SERVER_URL || 'https://www.machrio.com'
  
  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${baseUrl}/category`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/rfq`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/deals`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/knowledge-center`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/faq`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/how-to-order`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/payment-methods`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/shipping-policy`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/return-refund`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/clearance-duties`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/terms`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.3,
    },
    {
      url: `${baseUrl}/privacy`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.3,
    },
    // Industry pages
    {
      url: `${baseUrl}/industry/manufacturing`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${baseUrl}/industry/construction`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${baseUrl}/industry/automotive`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${baseUrl}/industry/healthcare`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${baseUrl}/industry/food-beverage`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${baseUrl}/industry/warehouse`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
  ]

  // Dynamic pages from Payload CMS
  let categoryPages: MetadataRoute.Sitemap = []
  let productPages: MetadataRoute.Sitemap = []
  let articlePages: MetadataRoute.Sitemap = []

  try {
    const payload = await getPayload({ config })

    // Fetch all categories
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

    // Fetch products in batches to handle large catalogs
    // Build a category slug map for URL construction
    const categorySlugMap = new Map<string, string>()
    for (const cat of categories.docs) {
      categorySlugMap.set(cat.id, cat.slug)
    }

    // Fetch products with pagination to avoid memory issues
    const BATCH_SIZE = 500
    let hasMore = true
    let page = 1
    
    while (hasMore && page <= 20) { // Max 10,000 products (20 pages * 500)
      const products = await payload.find({
        collection: 'products',
        limit: BATCH_SIZE,
        page,
        where: {
          status: { equals: 'published' },
        },
        depth: 1, // Include category relationship
      })
      
      for (const product of products.docs) {
        // Resolve category slug for product URL
        let categorySlug = 'products'
        const primaryCategory = product.primaryCategory
        if (primaryCategory && typeof primaryCategory === 'object') {
          const cat = primaryCategory as unknown as Record<string, unknown>
          // If category has a parent, use parent slug; otherwise use category slug
          const parentRef = cat.parent
          if (parentRef && typeof parentRef === 'object') {
            categorySlug = (parentRef as Record<string, unknown>).slug as string || 'products'
          } else if (parentRef && typeof parentRef === 'string') {
            categorySlug = categorySlugMap.get(parentRef) || cat.slug as string || 'products'
          } else {
            categorySlug = cat.slug as string || 'products'
          }
        }
        
        productPages.push({
          url: `${baseUrl}/product/${categorySlug}/${product.slug}`,
          lastModified: new Date(product.updatedAt),
          changeFrequency: 'weekly' as const,
          priority: 0.7,
        })
      }
      
      hasMore = products.hasNextPage
      page++
    }

    // Fetch all published articles
    const articles = await payload.find({
      collection: 'articles',
      limit: 1000,
      where: { status: { equals: 'published' } },
    })
    articlePages = articles.docs.map((article) => ({
      url: `${baseUrl}/knowledge-center/${article.slug}`,
      lastModified: new Date(article.updatedAt),
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    }))

  } catch (error) {
    // Log error for debugging but continue with static pages
    console.error('Sitemap generation error:', error)
  }

  return [
    ...staticPages,
    ...categoryPages,
    ...productPages,
    ...articlePages,
  ]
}
