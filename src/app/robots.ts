import type { MetadataRoute } from 'next'

const SITE_URL = process.env.NEXT_PUBLIC_SERVER_URL || 'https://machrio.com'

const DISALLOW_PATHS = [
  '/admin',
  '/admin/*',
  '/api/*',
  '/account',
  '/account/*',
  '/cart',
  '/cart/*',
  '/checkout',
  '/checkout/*',
  '/order/*',
  '/search',
  '/search/*',
  '/search?*',
]

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: DISALLOW_PATHS,
      },
      {
        userAgent: 'GPTBot',
        allow: '/',
        disallow: DISALLOW_PATHS,
      },
      {
        userAgent: 'ChatGPT-User',
        allow: '/',
        disallow: DISALLOW_PATHS,
      },
      {
        userAgent: 'anthropic-ai',
        allow: '/',
        disallow: DISALLOW_PATHS,
      },
      {
        userAgent: 'Claude-Web',
        allow: '/',
        disallow: DISALLOW_PATHS,
      },
      {
        userAgent: 'Google-Extended',
        allow: '/',
        disallow: DISALLOW_PATHS,
      },
      {
        userAgent: 'PerplexityBot',
        allow: '/',
        disallow: DISALLOW_PATHS,
      },
      {
        userAgent: 'Amazonbot',
        allow: '/',
        disallow: DISALLOW_PATHS,
      },
      {
        userAgent: 'cohere-ai',
        allow: '/',
        disallow: DISALLOW_PATHS,
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  }
}
