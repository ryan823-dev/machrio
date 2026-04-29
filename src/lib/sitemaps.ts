import type { MetadataRoute } from 'next'
import { getGlossaryTerms, getPool } from '@/lib/db'
import { getArticles } from '@/lib/db/articles'
import { getCanonicalProductCategory } from '@/lib/seo'

type SitemapEntry = MetadataRoute.Sitemap[number]

export type SitemapSection = 'pages' | 'categories' | 'knowledge' | 'glossary' | 'products'

const STATIC_PAGE_RULES: Array<{
  path: string
  changeFrequency: NonNullable<SitemapEntry['changeFrequency']>
  priority: number
}> = [
  { path: '', changeFrequency: 'daily', priority: 1 },
  { path: '/category', changeFrequency: 'daily', priority: 0.9 },
  { path: '/new-arrivals', changeFrequency: 'daily', priority: 0.8 },
  { path: '/rfq', changeFrequency: 'monthly', priority: 0.8 },
  { path: '/deals', changeFrequency: 'weekly', priority: 0.7 },
  { path: '/knowledge-center', changeFrequency: 'weekly', priority: 0.7 },
  { path: '/knowledge-center/air-respirator-buying-guide', changeFrequency: 'weekly', priority: 0.7 },
  { path: '/glossary', changeFrequency: 'weekly', priority: 0.6 },
  { path: '/about', changeFrequency: 'monthly', priority: 0.5 },
  { path: '/contact', changeFrequency: 'monthly', priority: 0.5 },
  { path: '/faq', changeFrequency: 'monthly', priority: 0.5 },
  { path: '/terms', changeFrequency: 'monthly', priority: 0.3 },
  { path: '/privacy', changeFrequency: 'monthly', priority: 0.3 },
  { path: '/how-to-order', changeFrequency: 'monthly', priority: 0.4 },
  { path: '/payment-methods', changeFrequency: 'monthly', priority: 0.4 },
  { path: '/shipping-policy', changeFrequency: 'monthly', priority: 0.4 },
  { path: '/return-refund', changeFrequency: 'monthly', priority: 0.4 },
  { path: '/clearance-duties', changeFrequency: 'monthly', priority: 0.4 },
  { path: '/industry/manufacturing', changeFrequency: 'monthly', priority: 0.6 },
  { path: '/industry/construction', changeFrequency: 'monthly', priority: 0.6 },
  { path: '/industry/automotive', changeFrequency: 'monthly', priority: 0.6 },
  { path: '/industry/healthcare', changeFrequency: 'monthly', priority: 0.6 },
  { path: '/industry/food-beverage', changeFrequency: 'monthly', priority: 0.6 },
  { path: '/industry/warehouse', changeFrequency: 'monthly', priority: 0.6 },
]

function dedupeEntries(entries: MetadataRoute.Sitemap): MetadataRoute.Sitemap {
  const unique = new Map<string, SitemapEntry>()

  for (const entry of entries) {
    unique.set(entry.url, entry)
  }

  return Array.from(unique.values())
}

export function getPublicBaseUrl(): string {
  return process.env.NEXT_PUBLIC_SERVER_URL || 'https://machrio.com'
}

export async function getSitemapEntries(section: SitemapSection): Promise<MetadataRoute.Sitemap> {
  const baseUrl = getPublicBaseUrl()
  const now = new Date()

  if (section === 'pages') {
    return STATIC_PAGE_RULES.map((page) => ({
      url: `${baseUrl}${page.path}`,
      lastModified: now,
      changeFrequency: page.changeFrequency,
      priority: page.priority,
    }))
  }

  if (section === 'knowledge') {
    try {
      const articleResults = await Promise.race([
        getArticles({ page: 1, limit: 2000 }),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Knowledge sitemap query timeout')), 10000),
        ),
      ])

      return articleResults.docs.map((article) => ({
        url: `${baseUrl}/knowledge-center/${article.slug}`,
        lastModified: new Date(article.updatedAt || article.publishedAt || now),
        changeFrequency: 'monthly',
        priority: 0.7,
      }))
    } catch (error) {
      console.error('[sitemaps] Failed to build knowledge sitemap:', error)
      return []
    }
  }

  if (section === 'glossary') {
    const glossaryTerms = await getGlossaryTerms(2000)
    return glossaryTerms.map((term) => ({
      url: `${baseUrl}/glossary/${term.slug}`,
      lastModified: new Date(term.updated_at || now),
      changeFrequency: 'monthly',
      priority: 0.5,
    }))
  }

  if (!process.env.DATABASE_URI) {
    return []
  }

  const pool = getPool()

  try {
    if (section === 'categories') {
      const categoriesResult = await Promise.race([
        pool.query<{ slug: string; updated_at: string | null }>(
          'SELECT slug, updated_at FROM categories ORDER BY display_order NULLS LAST, name',
        ),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Categories sitemap query timeout')), 5000),
        ),
      ])

      return categoriesResult.rows.map((category) => ({
        url: `${baseUrl}/category/${category.slug}`,
        lastModified: category.updated_at ? new Date(category.updated_at) : now,
        changeFrequency: 'weekly',
        priority: 0.7,
      }))
    }

    if (section === 'products') {
      const productsResult = await Promise.race([
        pool.query<{
          name: string
          slug: string
          updated_at: string | null
          category_slug: string | null
          category_name: string | null
        }>(`
          SELECT
            p.name,
            p.slug,
            p.updated_at,
            c.slug AS category_slug,
            c.name AS category_name
          FROM products p
          LEFT JOIN categories c ON p.primary_category_id = c.id
          WHERE p.status = 'published'
          ORDER BY p.created_at DESC
        `),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Products sitemap query timeout')), 10000),
        ),
      ])

      return productsResult.rows.map((product) => {
        const canonicalCategory = getCanonicalProductCategory({
          name: product.name,
          slug: product.slug,
          categorySlug: product.category_slug,
          categoryName: product.category_name,
        })

        return {
          url: `${baseUrl}/product/${canonicalCategory.slug}/${product.slug}`,
          lastModified: product.updated_at ? new Date(product.updated_at) : now,
          changeFrequency: 'weekly',
          priority: 0.6,
        }
      })
    }
  } catch (error) {
    console.error(`[sitemaps] Failed to build ${section} sitemap:`, error)
  }

  return []
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

function formatDate(value: string | Date | undefined): string | null {
  if (!value) return null
  const date = value instanceof Date ? value : new Date(value)
  return Number.isNaN(date.getTime()) ? null : date.toISOString()
}

export function buildSitemapXml(entries: MetadataRoute.Sitemap): string {
  const uniqueEntries = dedupeEntries(entries)
  const body = uniqueEntries
    .map((entry) => {
      const parts = [`<loc>${escapeXml(entry.url)}</loc>`]
      const lastModified = formatDate(entry.lastModified)

      if (lastModified) parts.push(`<lastmod>${lastModified}</lastmod>`)
      if (entry.changeFrequency) parts.push(`<changefreq>${entry.changeFrequency}</changefreq>`)
      if (typeof entry.priority === 'number') parts.push(`<priority>${entry.priority.toFixed(1)}</priority>`)

      return `<url>${parts.join('')}</url>`
    })
    .join('')

  return `<?xml version="1.0" encoding="UTF-8"?>` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${body}</urlset>`
}

export function buildSitemapIndexXml(
  entries: Array<{ loc: string; lastModified?: string | Date }>,
): string {
  const body = entries
    .map((entry) => {
      const parts = [`<loc>${escapeXml(entry.loc)}</loc>`]
      const lastModified = formatDate(entry.lastModified)
      if (lastModified) parts.push(`<lastmod>${lastModified}</lastmod>`)
      return `<sitemap>${parts.join('')}</sitemap>`
    })
    .join('')

  return `<?xml version="1.0" encoding="UTF-8"?>` +
    `<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${body}</sitemapindex>`
}
