import type { MetadataRoute } from 'next'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://machrio.com'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      // Default rules for all crawlers
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
      // AI crawlers - explicitly allow for AEO (Answer Engine Optimization)
      {
        userAgent: 'GPTBot',
        allow: '/',
        disallow: ['/admin', '/api/*', '/account', '/cart', '/checkout', '/order/*'],
      },
      {
        userAgent: 'ChatGPT-User',
        allow: '/',
        disallow: ['/admin', '/api/*', '/account', '/cart', '/checkout', '/order/*'],
      },
      {
        userAgent: 'anthropic-ai',
        allow: '/',
        disallow: ['/admin', '/api/*', '/account', '/cart', '/checkout', '/order/*'],
      },
      {
        userAgent: 'Claude-Web',
        allow: '/',
        disallow: ['/admin', '/api/*', '/account', '/cart', '/checkout', '/order/*'],
      },
      {
        userAgent: 'Google-Extended',
        allow: '/',
        disallow: ['/admin', '/api/*', '/account', '/cart', '/checkout', '/order/*'],
      },
      {
        userAgent: 'PerplexityBot',
        allow: '/',
        disallow: ['/admin', '/api/*', '/account', '/cart', '/checkout', '/order/*'],
      },
      {
        userAgent: 'Amazonbot',
        allow: '/',
        disallow: ['/admin', '/api/*', '/account', '/cart', '/checkout', '/order/*'],
      },
      {
        userAgent: 'cohere-ai',
        allow: '/',
        disallow: ['/admin', '/api/*', '/account', '/cart', '/checkout', '/order/*'],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  }
}
