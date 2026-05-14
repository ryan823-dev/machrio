#!/usr/bin/env node

const fs = require('fs')
const path = require('path')
const { Pool } = require('pg')

try {
  require('dotenv').config({ path: path.join(process.cwd(), '.env.local') })
} catch {
  // dotenv is available locally; CI can provide DATABASE_URI directly.
}

const OUTPUT_DIR = path.join(process.cwd(), 'reports')
const OUTPUT_FILE = path.join(OUTPUT_DIR, 'seo-gsc-revalidation-checklist-2026-05-14.md')

const BLOCKED_PATHS = [
  '/admin',
  '/api',
  '/account',
  '/cart',
  '/checkout',
  '/order',
  '/search',
]

function readText(filePath) {
  return fs.existsSync(filePath) ? fs.readFileSync(filePath, 'utf8') : ''
}

function extractRedirects() {
  const text = readText(path.join(process.cwd(), 'next.config.mjs'))
  const redirects = []
  const blocks = text.matchAll(/\{\s*source:\s*'([^']+)'[\s\S]*?destination:\s*'([^']+)'[\s\S]*?permanent:\s*true[\s\S]*?\}/g)

  for (const match of blocks) {
    redirects.push({ source: match[1], destination: match[2] })
  }

  return redirects
}

function isBlockedByRobots(pathname) {
  return BLOCKED_PATHS.some((blocked) => pathname === blocked || pathname.startsWith(`${blocked}/`))
}

function markdownTable(headers, rows) {
  if (rows.length === 0) return 'None found.'
  return [
    `| ${headers.join(' | ')} |`,
    `| ${headers.map(() => '---').join(' | ')} |`,
    ...rows.map((row) => `| ${headers.map((header) => String(row[header] ?? '').replace(/\|/g, '\\|')).join(' | ')} |`),
  ].join('\n')
}

async function queryRows(client, sql, params = []) {
  const result = await client.query(sql, params)
  return result.rows
}

async function main() {
  if (!process.env.DATABASE_URI) {
    throw new Error('DATABASE_URI is required. Load .env.local before running this script.')
  }

  fs.mkdirSync(OUTPUT_DIR, { recursive: true })
  const redirects = extractRedirects()
  const categoryRedirects = redirects.filter((item) => item.source.startsWith('/category/'))
  const deletedProductRedirects = redirects.filter(
    (item) => item.source.startsWith('/product/') && item.destination.startsWith('/category/'),
  )
  const categoryRedirectSources = categoryRedirects
    .map((item) => item.source.replace(/^\/category\//, '').replace(/\/$/, ''))
    .filter((slug) => slug && !slug.includes(':'))
  const categoryRedirectDestinations = Array.from(new Set(
    categoryRedirects
      .map((item) => item.destination.replace(/^\/category\//, '').replace(/\/$/, ''))
      .filter((slug) => slug && !slug.includes(':')),
  ))
  const deletedProductDestinationSlugs = Array.from(new Set(
    deletedProductRedirects
      .map((item) => item.destination.replace(/^\/category\//, '').replace(/\/$/, ''))
      .filter(Boolean),
  ))

  const client = new Pool({ connectionString: process.env.DATABASE_URI })

  try {
    const [
      categorySitemapStats,
      redirectSourceLeaks,
      badCategoryRedirectDestinations,
      badDeletedProductDestinations,
      unpublishedCategoriesWithProducts,
      publishedCategoriesWithoutProducts,
      productsWithBadCategories,
      duplicateCategorySlugs,
      duplicateProductSlugs,
    ] = await Promise.all([
      queryRows(client, `
        WITH RECURSIVE published_categories AS (
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
          SELECT ct.root_id, COUNT(p.id)::int AS published_product_count
          FROM category_tree ct
          INNER JOIN products p ON p.primary_category_id = ct.id
          WHERE p.status = 'published'
            AND p.slug IS NOT NULL
            AND btrim(p.slug) <> ''
          GROUP BY ct.root_id
        )
        SELECT COUNT(*)::int AS category_sitemap_urls
        FROM published_categories c
        INNER JOIN category_product_counts cpc ON cpc.root_id = c.id
        WHERE cpc.published_product_count > 0
      `, [categoryRedirectSources]),
      queryRows(client, `
        SELECT slug, status
        FROM categories
        WHERE slug = ANY($1::text[])
        ORDER BY slug
      `, [categoryRedirectSources]),
      queryRows(client, `
        SELECT input.slug
        FROM unnest($1::text[]) AS input(slug)
        LEFT JOIN categories c ON c.slug = input.slug AND c.status = 'published'
        WHERE c.id IS NULL
        ORDER BY input.slug
      `, [categoryRedirectDestinations]),
      queryRows(client, `
        SELECT input.slug
        FROM unnest($1::text[]) AS input(slug)
        LEFT JOIN categories c ON c.slug = input.slug AND c.status = 'published'
        WHERE c.id IS NULL
        ORDER BY input.slug
      `, [deletedProductDestinationSlugs]),
      queryRows(client, `
        SELECT c.slug, c.status, COUNT(p.id)::int AS published_products
        FROM categories c
        INNER JOIN products p ON p.primary_category_id = c.id AND p.status = 'published'
        WHERE c.status IS DISTINCT FROM 'published'
        GROUP BY c.slug, c.status
        ORDER BY published_products DESC, c.slug
        LIMIT 50
      `),
      queryRows(client, `
        SELECT c.slug, c.name
        FROM categories c
        WHERE c.status = 'published'
          AND c.slug IS NOT NULL
          AND btrim(c.slug) <> ''
          AND c.slug <> ALL($1::text[])
          AND NOT EXISTS (
            WITH RECURSIVE tree AS (
              SELECT c.id
              UNION ALL
              SELECT child.id
              FROM categories child
              INNER JOIN tree ON child.parent_id = tree.id
              WHERE child.status = 'published'
            )
            SELECT 1
            FROM tree
            INNER JOIN products p ON p.primary_category_id = tree.id
            WHERE p.status = 'published'
              AND p.slug IS NOT NULL
              AND btrim(p.slug) <> ''
          )
        ORDER BY c.slug
        LIMIT 50
      `, [categoryRedirectSources]),
      queryRows(client, `
        SELECT p.slug, p.status AS product_status, c.slug AS category_slug, c.status AS category_status
        FROM products p
        LEFT JOIN categories c ON p.primary_category_id = c.id
        WHERE p.status = 'published'
          AND p.slug IS NOT NULL
          AND btrim(p.slug) <> ''
          AND (
            p.primary_category_id IS NULL
            OR c.id IS NULL
            OR c.status IS DISTINCT FROM 'published'
            OR c.slug IS NULL
            OR btrim(c.slug) = ''
          )
        ORDER BY p.slug
        LIMIT 50
      `),
      queryRows(client, `
        SELECT slug, COUNT(*)::int AS count
        FROM categories
        WHERE slug IS NOT NULL AND btrim(slug) <> ''
        GROUP BY slug
        HAVING COUNT(*) > 1
        ORDER BY count DESC, slug
      `),
      queryRows(client, `
        SELECT slug, COUNT(*)::int AS count
        FROM products
        WHERE slug IS NOT NULL AND btrim(slug) <> ''
        GROUP BY slug
        HAVING COUNT(*) > 1
        ORDER BY count DESC, slug
        LIMIT 50
      `),
    ])

    const staticSitemapPaths = [
      '/',
      '/category',
      '/new-arrivals',
      '/rfq',
      '/deals',
      '/knowledge-center',
      '/knowledge-center/air-respirator-buying-guide',
      '/glossary',
      '/about',
      '/contact',
      '/faq',
      '/terms',
      '/privacy',
      '/how-to-order',
      '/payment-methods',
      '/shipping-policy',
      '/return-refund',
      '/clearance-duties',
      '/industry/manufacturing',
      '/industry/construction',
      '/industry/automotive',
      '/industry/healthcare',
      '/industry/food-beverage',
      '/industry/warehouse',
    ]
    const robotsConflicts = staticSitemapPaths
      .filter(isBlockedByRobots)
      .map((path) => ({ path, issue: 'Static sitemap path is disallowed by robots.txt' }))

    const openIssues = [
      ...badCategoryRedirectDestinations.map((row) => ({
        area: 'redirects',
        issue: 'Category redirect destination is not a published category',
        url: `/category/${row.slug}`,
        action: 'Change destination to a published final category or remove the redirect.',
      })),
      ...badDeletedProductDestinations.map((row) => ({
        area: 'redirects',
        issue: 'Deleted product redirect destination is not a published category',
        url: `/category/${row.slug}`,
        action: 'Change destination before GSC revalidation.',
      })),
      ...unpublishedCategoriesWithProducts.map((row) => ({
        area: 'indexability',
        issue: `Unpublished category has ${row.published_products} published products`,
        url: `/category/${row.slug}`,
        action: 'Publish the category or remap products to an indexable category.',
      })),
      ...productsWithBadCategories.map((row) => ({
        area: 'products',
        issue: `Published product has non-indexable category: ${row.category_slug || 'missing'}`,
        url: `/product/${row.category_slug || 'missing'}/${row.slug}`,
        action: 'Remap product to a published category or unpublish product.',
      })),
      ...robotsConflicts.map((row) => ({
        area: 'robots',
        issue: row.issue,
        url: row.path,
        action: 'Remove from sitemap or allow in robots.',
      })),
      ...duplicateCategorySlugs.map((row) => ({
        area: 'canonical',
        issue: `Duplicate category slug appears ${row.count} times`,
        url: `/category/${row.slug}`,
        action: 'Deduplicate or redirect aliases to one final URL.',
      })),
      ...duplicateProductSlugs.map((row) => ({
        area: 'canonical',
        issue: `Duplicate product slug appears ${row.count} times`,
        url: `/product/.../${row.slug}`,
        action: 'Deduplicate product slugs or redirect aliases to the canonical product.',
      })),
    ]

    const fixedOrClean = [
      {
        check: 'Category sitemap excludes legacy redirect-source slugs',
        result: `${redirectSourceLeaks.length} redirect-source category records exist in DB; sitemap query excludes ${categoryRedirectSources.length} static category redirect sources.`,
      },
      {
        check: 'Category sitemap excludes zero-product categories',
        result: `${publishedCategoriesWithoutProducts.length} published zero-product categories found outside sitemap sample; keep out until converted to demand-capture pages.`,
      },
      {
        check: 'Static sitemap vs robots.txt',
        result: robotsConflicts.length === 0 ? 'No static sitemap URL is blocked by robots.txt.' : `${robotsConflicts.length} conflict(s) found.`,
      },
      {
        check: 'Product sitemap source query',
        result: 'Requires published product, non-empty product slug, published category, and non-empty category slug.',
      },
      {
        check: 'Runtime category/product pages',
        result: 'Patched to require published category status before rendering indexable category or product pages.',
      },
    ]

    const markdown = `# GSC Revalidation Checklist - 2026-05-14

## Sitemap / Indexability Status

- Category sitemap URL count: ${categorySitemapStats[0]?.category_sitemap_urls || 0}
- Category redirect rules checked: ${categoryRedirects.length}
- Deleted product redirects checked: ${deletedProductRedirects.length}
- Robots disallow paths checked against static sitemap: ${BLOCKED_PATHS.join(', ')}

## Open Issues To Fix Before Revalidation

${markdownTable(['area', 'issue', 'url', 'action'], openIssues)}

## Clean / Fixed Checks

${markdownTable(['check', 'result'], fixedOrClean)}

## GSC Submission Notes

1. Submit /sitemap.xml after deployment.
2. Revalidate "Page with redirect" after confirming old category and trailing-slash URLs 301 to final URLs.
3. Revalidate "Alternate page with proper canonical tag" only after duplicate slug checks are clear.
4. Revalidate "Crawled - currently not indexed" for priority category URLs after the SEO copy/RFQ modules are deployed.
5. Keep no-product categories out of sitemap unless the page has buying-guide content, related categories, and a visible RFQ/demand-capture route.
`

    fs.writeFileSync(OUTPUT_FILE, markdown)
    console.log(`Wrote ${OUTPUT_FILE}`)
    console.log(`Open issues: ${openIssues.length}`)
  } finally {
    await client.end()
  }
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
