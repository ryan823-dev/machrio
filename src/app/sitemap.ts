import type { MetadataRoute } from 'next'
import { getGlossaryTerms, getPool } from '@/lib/db'
import { getArticles } from '@/lib/db/articles'
import { getCanonicalProductCategory } from '@/lib/seo'

export const dynamic = 'force-static'
export const revalidate = 3600

type SitemapEntry = MetadataRoute.Sitemap[number]

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

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SERVER_URL || 'https://machrio.com'
  const now = new Date()

  const [articleResults, glossaryTerms] = await Promise.all([
    getArticles({ page: 1, limit: 2000 }),
    process.env.DATABASE_URI ? getGlossaryTerms(2000) : Promise.resolve([]),
  ])

  const staticPages: MetadataRoute.Sitemap = STATIC_PAGE_RULES.map((page) => ({
    url: `${baseUrl}${page.path}`,
    lastModified: now,
    changeFrequency: page.changeFrequency,
    priority: page.priority,
  }))

  const articlePages: MetadataRoute.Sitemap = articleResults.docs.map((article) => ({
    url: `${baseUrl}/knowledge-center/${article.slug}`,
    lastModified: new Date(article.updatedAt || article.publishedAt || now),
    changeFrequency: 'monthly',
    priority: 0.7,
  }))

  const glossaryPages: MetadataRoute.Sitemap = glossaryTerms.map((term) => ({
    url: `${baseUrl}/glossary/${term.slug}`,
    lastModified: new Date(term.updated_at || now),
    changeFrequency: 'monthly',
    priority: 0.5,
  }))

  const entries: MetadataRoute.Sitemap = [
    ...staticPages,
    ...articlePages,
    ...glossaryPages,
  ]

  if (!process.env.DATABASE_URI) {
    return dedupeEntries(entries)
  }

  const pool = getPool()

  try {
    const [categoriesResult, productsResult] = await Promise.all([
      Promise.race([
        pool.query('SELECT slug, updated_at FROM categories ORDER BY display_order NULLS LAST, name'),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Categories query timeout')), 5000),
        ),
      ]),
      Promise.race([
        pool.query(`
          SELECT p.name, p.slug, p.updated_at, c.slug as category_slug, c.name as category_name
          FROM products p
          LEFT JOIN categories c ON p.primary_category_id = c.id
          WHERE p.status = 'published'
          ORDER BY p.created_at DESC
        `),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Products query timeout')), 10000),
        ),
      ]),
    ])

    const categoryPages: MetadataRoute.Sitemap = categoriesResult.rows.map((cat: {
      slug: string
      updated_at: string | null
    }) => ({
      url: `${baseUrl}/category/${cat.slug}`,
      lastModified: cat.updated_at ? new Date(cat.updated_at) : now,
      changeFrequency: 'weekly',
      priority: 0.7,
    }))

    const productPages: MetadataRoute.Sitemap = productsResult.rows.map((product: {
      name: string
      slug: string
      updated_at: string | null
      category_slug: string | null
      category_name: string | null
    }) => {
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

    return dedupeEntries([
      ...entries,
      ...categoryPages,
      ...productPages,
    ])
  } catch (error) {
    console.error('Sitemap database query failed, returning partial sitemap:', error)
    return dedupeEntries(entries)
  }
}
