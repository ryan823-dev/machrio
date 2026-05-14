import type { MetadataRoute } from 'next'
import { getGlossaryTerms, safeQuery } from '@/lib/db'
import { getArticles } from '@/lib/db/articles'
import { getCanonicalProductCategory } from '@/lib/seo'

type SitemapEntry = MetadataRoute.Sitemap[number]

export type SitemapSection = 'pages' | 'categories' | 'knowledge' | 'glossary' | 'products'
export const PRODUCT_SITEMAP_PAGE_SIZE = 2000

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

const CATEGORY_REDIRECT_SOURCE_SLUGS = [
  'adhesives-sealants-tape',
  'water-filtration-and-purification-systems',
  'shaft-couplings-and-universal-joints',
  'sinks-wash-fountains-and-repair-parts',
  'welding-protection',
  'platform-trucks',
  'quick-coupler',
  'hand-truck-accessories-replacement-parts',
  'rolling-tool-cart',
  'metal-workbenches',
  'temperature-controlled-packaging',
  'general-purpose-boots',
  'cable-tag-wire-marker',
  'cryogenic-gloves',
  'fire-extinguishers',
  'gears-gear-drives',
  'air-hose-connector',
  'snakebite-protective-gaiters',
  'brooms',
  'label-dispenser',
  'tire-sealants',
  'lab-workbenches',
  'safety-padlock',
  'adhesives-glues',
  'cut-resistant-gloves',
  'wire-clip-mount',
  'hvac-filter-panel',
  'hepa-filter-pad',
  'hoists-cranes',
  'hot-melt-applicator-guns',
  'mechanical-seals',
  'tool-storage-workbenches',
  'bulk-webbing',
  'hand-and-arm-protection',
  'air-purifier-cartridge',
  'slings-rigging',
  'hard-hats-and-helmets',
  'corrosion-inhibiting-vci-packaging',
  'packaging-shipping',
  'lockout-hasp',
  'flashlights',
  'cold-condition-insulated-gloves',
  'waders',
  'barcode-label-roll',
  'transporting',
  'caster-wheels',
  'moisture-absorbent-packaging',
  'inspection-gloves',
  'foot-protection',
  'adhesives-glue',
  'labels-identification-supplies',
  'standard-packing-tape',
  'trash-recycling-containers',
  'lifting-pulling-positioning',
  'belts-pulleys',
  'general-purpose-glues',
  'modular-tool-case',
  'workbenches-shop-desks',
  'gaskets',
  'jacks-lifts',
  'direct-thermal-labels',
  'plastic-films-rolls',
  'black-masking-tape',
  'cleaning-rags',
  'blue-masking-tape',
  'label-holder-plastic-pouch',
  'drainage-mats',
  'chain-slings',
  'first-aid-medical',
  'traction-floor-mats',
  'lab-brushes',
  'polyurethane-caulks-sealants',
  'welding-aprons',
  'parts-bin-drawer-organizer',
  'lockout-tagout-kits',
  'circuit-breaker-lockout',
  'seals-gaskets',
  'carts-trucks',
  'nylon-cable-tie',
  'plug-lockout',
  'pipe-thread-sealants',
  'sealing-foam-tape',
  'welding-gloves',
  'heat-shrink-tubing',
  'floor-marking-tape',
  'high-visibility-vests',
  'plumbing-pumps',
  'general-purpose-safety-goggles',
  'first-aid-kits',
  'replacement-parts-for-jobsite-lights',
  'task-jobsite-lighting',
  'linen-carts',
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

function getIndexableProductWhereClause(): string {
  return `
    p.status = 'published'
    AND p.slug IS NOT NULL
    AND btrim(p.slug) <> ''
    AND p.primary_category_id IS NOT NULL
    AND c.id IS NOT NULL
    AND c.status = 'published'
    AND c.slug IS NOT NULL
    AND btrim(c.slug) <> ''
  `
}

export async function getProductSitemapPageCount(pageSize = PRODUCT_SITEMAP_PAGE_SIZE): Promise<number> {
  if (!process.env.DATABASE_URI) return 0

  try {
    const result = await Promise.race([
      safeQuery<{ count: string }>(`
        SELECT COUNT(*)::text AS count
        FROM products p
        INNER JOIN categories c ON p.primary_category_id = c.id
        WHERE ${getIndexableProductWhereClause()}
      `),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Product sitemap count query timeout')), 5000),
      ),
    ])

    const count = Number.parseInt(result.rows[0]?.count || '0', 10)
    return Number.isFinite(count) && count > 0 ? Math.ceil(count / pageSize) : 0
  } catch (error) {
    console.error('[sitemaps] Failed to count product sitemap pages:', error)
    return 0
  }
}

export async function getProductSitemapIndexEntries(): Promise<Array<{ loc: string; lastModified?: Date }>> {
  const baseUrl = getPublicBaseUrl()
  const pageCount = await getProductSitemapPageCount()
  const now = new Date()

  return Array.from({ length: pageCount }, (_, index) => ({
    loc: `${baseUrl}/product-sitemaps/${index + 1}.xml`,
    lastModified: now,
  }))
}

export async function getSitemapIndexEntries(): Promise<Array<{ loc: string; lastModified?: Date }>> {
  const baseUrl = getPublicBaseUrl()
  const now = new Date()

  const [pages, categories, knowledge, glossary, productSitemaps] = await Promise.all([
    getSitemapEntries('pages'),
    getSitemapEntries('categories'),
    getSitemapEntries('knowledge'),
    getSitemapEntries('glossary'),
    getProductSitemapIndexEntries(),
  ])

  return [
    pages.length > 0 ? { loc: `${baseUrl}/page-sitemap.xml`, lastModified: now } : null,
    categories.length > 0 ? { loc: `${baseUrl}/category-sitemap.xml`, lastModified: now } : null,
    knowledge.length > 0 ? { loc: `${baseUrl}/knowledge-sitemap.xml`, lastModified: now } : null,
    glossary.length > 0 ? { loc: `${baseUrl}/glossary-sitemap.xml`, lastModified: now } : null,
    ...productSitemaps,
  ].filter((entry): entry is { loc: string; lastModified?: Date } => entry !== null)
}

export async function getProductSitemapEntries(page = 1): Promise<MetadataRoute.Sitemap> {
  if (!process.env.DATABASE_URI) return []

  const baseUrl = getPublicBaseUrl()
  const now = new Date()
  const safePage = Number.isFinite(page) && page > 0 ? Math.floor(page) : 1
  const offset = (safePage - 1) * PRODUCT_SITEMAP_PAGE_SIZE

  try {
    const productsResult = await Promise.race([
      safeQuery<{
        name: string
        slug: string
        updated_at: string | null
        category_slug: string
        category_name: string
      }>(`
        SELECT
          p.name,
          p.slug,
          p.updated_at,
          c.slug AS category_slug,
          c.name AS category_name
        FROM products p
        INNER JOIN categories c ON p.primary_category_id = c.id
        WHERE ${getIndexableProductWhereClause()}
        ORDER BY p.updated_at DESC NULLS LAST, p.created_at DESC NULLS LAST, p.id
        LIMIT $1 OFFSET $2
      `, [PRODUCT_SITEMAP_PAGE_SIZE, offset]),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Products sitemap page query timeout')), 5000),
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
  } catch (error) {
    console.error(`[sitemaps] Failed to build products sitemap page ${safePage}:`, error)
    return []
  }
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

  try {
    if (section === 'categories') {
      const categoriesResult = await Promise.race([
        safeQuery<{ slug: string; updated_at: string | null }>(
          `WITH RECURSIVE published_categories AS (
             SELECT id, parent_id, slug, updated_at, display_order, name
             FROM categories
             WHERE status = 'published'
               AND slug IS NOT NULL
               AND btrim(slug) <> ''
               AND slug <> ALL($1::text[])
           ),
           category_tree AS (
             SELECT id AS root_id, id
             FROM published_categories
             UNION ALL
             SELECT ct.root_id, child.id
             FROM category_tree ct
             INNER JOIN published_categories child ON child.parent_id = ct.id
           ),
           category_product_counts AS (
             SELECT
               ct.root_id,
               COUNT(p.id) AS published_product_count,
               MAX(p.updated_at) AS latest_product_update
             FROM category_tree ct
             INNER JOIN products p ON p.primary_category_id = ct.id
             WHERE p.status = 'published'
               AND p.slug IS NOT NULL
               AND btrim(p.slug) <> ''
             GROUP BY ct.root_id
           )
           SELECT
             c.slug,
             GREATEST(c.updated_at, category_product_counts.latest_product_update) AS updated_at
           FROM published_categories c
           INNER JOIN category_product_counts ON category_product_counts.root_id = c.id
           WHERE category_product_counts.published_product_count > 0
           ORDER BY c.display_order NULLS LAST, c.name`,
          [CATEGORY_REDIRECT_SOURCE_SLUGS],
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
      return getProductSitemapEntries(1)
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
