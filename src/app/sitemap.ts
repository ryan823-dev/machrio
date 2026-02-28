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
  let brandPages: MetadataRoute.Sitemap = []
  let articlePages: MetadataRoute.Sitemap = []

  try {
    const payload = await getPayload({ config })

    // Fetch all published categories
    const categories = await payload.find({
      collection: 'categories',
      limit: 500,
      where: {
        // Only include categories that should be indexed
      },
    })

    categoryPages = categories.docs.map((category) => ({
      url: `${baseUrl}/category/${category.slug}`,
      lastModified: new Date(category.updatedAt),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    }))

    // Fetch all published products
    const products = await payload.find({
      collection: 'products',
      limit: 5000,
      where: {
        status: { equals: 'published' },
      },
      depth: 1, // Include category relationship
    })

    productPages = products.docs.map((product) => {
      const categorySlug = typeof product.primaryCategory === 'object' 
        ? product.primaryCategory?.slug 
        : 'products'
      return {
        url: `${baseUrl}/product/${categorySlug}/${product.slug}`,
        lastModified: new Date(product.updatedAt),
        changeFrequency: 'weekly' as const,
        priority: 0.7,
      }
    })

    // Fetch all brands
    const brands = await payload.find({
      collection: 'brands',
      limit: 500,
    })

    brandPages = brands.docs.map((brand) => ({
      url: `${baseUrl}/brand/${brand.slug}`,
      lastModified: new Date(brand.updatedAt),
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    }))

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
    console.error('Sitemap generation error:', error)
    // Return static pages only if CMS is unavailable
  }

  return [
    ...staticPages,
    ...categoryPages,
    ...productPages,
    ...brandPages,
    ...articlePages,
  ]
}
