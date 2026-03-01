import type { MetadataRoute } from 'next'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://machrio.com'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/admin',
          '/admin/*',
          '/api/*',
          '/account',
          '/account/*',
          '/cart',
          '/checkout',
          '/checkout/*',
          '/order/*',
          // SEO: Exclude search results and filtered/sorted pages from crawling
          '/search',
          '/search?*',
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  }
}
