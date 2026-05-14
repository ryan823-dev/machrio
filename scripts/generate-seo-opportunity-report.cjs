#!/usr/bin/env node

const fs = require('fs')
const path = require('path')
const { execFileSync } = require('child_process')
const { Client } = require('pg')

try {
  require('dotenv').config({ path: path.join(process.cwd(), '.env.local') })
} catch {
  // dotenv is a dev dependency in this project; keep a fallback for CI shells.
}

const DEFAULT_PERFORMANCE_ZIP = '/Users/lianchuan/Downloads/machrio.com-Performance-on-Search-2026-04-15.zip'
const OUTPUT_DIR = path.join(process.cwd(), 'reports')
const CSV_OUTPUT = path.join(OUTPUT_DIR, 'seo-category-opportunities-2026-05-14.csv')
const MD_OUTPUT = path.join(OUTPUT_DIR, 'seo-opportunity-plan-2026-05-14.md')

const STRATEGIC_TERMS = [
  'lockout',
  'tagout',
  'respirator',
  'respiratory',
  'safety',
  'fire',
  'electrical',
  'cable',
  'connector',
  'adhesive',
  'sealant',
  'packaging',
  'shipping',
  'cleanroom',
  'filter',
  'caster',
  'bearing',
  'data',
  'esd',
  'explosion',
  'waterproof',
  'emergency',
]

const CATEGORY_REDIRECT_SOURCES = extractCategoryRedirectSources()

function parsePercent(value) {
  const clean = String(value || '').replace('%', '').trim()
  const parsed = Number.parseFloat(clean)
  return Number.isFinite(parsed) ? parsed / 100 : 0
}

function parseNumber(value) {
  const parsed = Number.parseFloat(String(value || '').replace(/,/g, '').trim())
  return Number.isFinite(parsed) ? parsed : 0
}

function csvEscape(value) {
  const text = String(value ?? '')
  if (/[",\n]/.test(text)) return `"${text.replace(/"/g, '""')}"`
  return text
}

function normalizeSlug(value) {
  return String(value || '').toLowerCase().replace(/^\/+|\/+$/g, '')
}

function extractCategoryRedirectSources() {
  const configPath = path.join(process.cwd(), 'next.config.mjs')
  const text = fs.existsSync(configPath) ? fs.readFileSync(configPath, 'utf8') : ''
  return new Set(
    Array.from(text.matchAll(/source:\s*'\/category\/([^']+)'/g))
      .map((match) => match[1].replace(/\/$/, ''))
      .filter((slug) => slug && !slug.includes(':') && !slug.includes('*')),
  )
}

function extractSeoSignals() {
  const seoPath = path.join(process.cwd(), 'src/lib/seo.ts')
  const text = fs.existsSync(seoPath) ? fs.readFileSync(seoPath, 'utf8') : ''
  const overrideSlugs = new Set()
  const guideSlugs = new Set()
  const roadmapSlugs = new Set()

  const overrideSection = text.match(/const CATEGORY_OVERRIDES:[\s\S]*?const ARTICLE_TOPIC_CLUSTERS/)
  for (const match of (overrideSection?.[0] || '').matchAll(/'([^']+)':\s*\{/g)) {
    overrideSlugs.add(match[1])
  }

  const guideSection = text.match(/const CATEGORY_GUIDES:[\s\S]*?const CATEGORY_OVERRIDES/)
  for (const match of (guideSection?.[0] || '').matchAll(/'([^']+)':\s*\[/g)) {
    guideSlugs.add(match[1])
  }

  const roadmapSection = text.match(/export const SEO_CATEGORY_ROADMAP[\s\S]*?\]\s*$/m)
  for (const match of (roadmapSection?.[0] || '').matchAll(/slug:\s*'([^']+)'/g)) {
    roadmapSlugs.add(match[1])
  }

  return { overrideSlugs, guideSlugs, roadmapSlugs }
}

function readZipEntries(zipPath) {
  const script = `
import base64, json, sys, zipfile
with zipfile.ZipFile(sys.argv[1]) as archive:
    rows = []
    for info in archive.infolist():
        if info.filename.lower().endswith('.csv'):
            rows.append({
                "name": info.filename,
                "text": base64.b64encode(archive.read(info.filename)).decode("ascii"),
            })
    print(json.dumps(rows, ensure_ascii=False))
`
  const output = execFileSync('python3', ['-c', script, zipPath], {
    encoding: 'utf8',
    maxBuffer: 20 * 1024 * 1024,
  })

  return JSON.parse(output).map((entry) => ({
    name: entry.name,
    text: Buffer.from(entry.text, 'base64').toString('utf8').replace(/^\uFEFF/, ''),
  }))
}

function parseCsv(text) {
  const rows = []
  let row = []
  let field = ''
  let quoted = false

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i]
    const next = text[i + 1]
    if (quoted) {
      if (char === '"' && next === '"') {
        field += '"'
        i += 1
      } else if (char === '"') {
        quoted = false
      } else {
        field += char
      }
    } else if (char === '"') {
      quoted = true
    } else if (char === ',') {
      row.push(field)
      field = ''
    } else if (char === '\n') {
      row.push(field)
      rows.push(row)
      row = []
      field = ''
    } else if (char !== '\r') {
      field += char
    }
  }
  if (field || row.length) {
    row.push(field)
    rows.push(row)
  }

  const [headers, ...dataRows] = rows
  return dataRows
    .filter((items) => items.some((item) => item.trim()))
    .map((items) => Object.fromEntries(headers.map((header, index) => [header, items[index] || ''])))
}

async function loadPerformance(zipPath) {
  const pageMetrics = new Map()
  const queryMetrics = []

  if (!zipPath || !fs.existsSync(zipPath)) {
    return { pageMetrics, queryMetrics }
  }

  const entries = readZipEntries(zipPath)
  for (const entry of entries) {
    const rows = parseCsv(entry.text)
    if (rows[0]?.['排名靠前的网页']) {
      for (const row of rows) {
        const url = row['排名靠前的网页']
        if (!url) continue
        pageMetrics.set(url.replace(/\/$/, ''), {
          clicks: parseNumber(row['点击次数']),
          impressions: parseNumber(row['展示']),
          ctr: parsePercent(row['点击率']),
          position: parseNumber(row['排名']),
        })
      }
    }

    if (rows[0]?.['热门查询']) {
      for (const row of rows) {
        queryMetrics.push({
          query: row['热门查询'],
          clicks: parseNumber(row['点击次数']),
          impressions: parseNumber(row['展示']),
          ctr: parsePercent(row['点击率']),
          position: parseNumber(row['排名']),
        })
      }
    }
  }

  return { pageMetrics, queryMetrics }
}

function getPerformanceForCategory(pageMetrics, slug) {
  const direct = pageMetrics.get(`https://machrio.com/category/${slug}`)
  if (direct) return direct
  return { clicks: 0, impressions: 0, ctr: 0, position: 0 }
}

function textLength(value) {
  if (!value) return 0
  if (typeof value === 'string') return value.length
  return JSON.stringify(value).length
}

function hasFaq(value) {
  return Array.isArray(value) ? value.length > 0 : textLength(value) > 20
}

function scoreCategory(row, perf, signals) {
  let score = 0
  const slug = row.slug
  const haystack = `${row.name} ${slug}`.toLowerCase()

  score += Math.min(30, Math.log10(row.subtree_product_count + 1) * 12)
  score += Math.min(25, perf.impressions / 5)
  score += perf.position >= 8 && perf.position <= 30 ? 16 : 0
  score += perf.impressions > 0 && perf.ctr < 0.01 ? 8 : 0
  score += signals.overrideSlugs.has(slug) ? 10 : 0
  score += signals.guideSlugs.has(slug) ? 8 : 0
  score += signals.roadmapSlugs.has(slug) ? 12 : 0
  score += STRATEGIC_TERMS.some((term) => haystack.includes(term)) ? 10 : 0
  score += row.has_intro ? 0 : 6
  score += row.has_buying_guide ? 0 : 4
  score += row.has_faq ? 0 : 4
  score += row.child_count > 0 ? 4 : 0
  score -= CATEGORY_REDIRECT_SOURCES.has(slug) ? 999 : 0

  return Math.round(score)
}

function actionFor(row, perf, signals) {
  if (CATEGORY_REDIRECT_SOURCES.has(row.slug)) return 'exclude_redirect_source'
  if (!row.is_indexable) return 'remove_from_sitemap_or_publish'
  if (perf.impressions >= 10 && perf.ctr < 0.01) return 'improve_ctr_title_meta'
  if (perf.impressions > 0 && row.subtree_product_count > 0) return 'strengthen_conversion'
  if (row.subtree_product_count === 0) return 'seed_demand_capture_page'
  if (!row.has_intro || !row.has_buying_guide || !row.has_faq) return 'fill_category_content'
  if (!signals.guideSlugs.has(row.slug) && !signals.overrideSlugs.has(row.slug)) return 'add_content_cluster'
  return 'monitor'
}

async function loadCategories() {
  const client = new Client({ connectionString: process.env.DATABASE_URI })
  await client.connect()
  try {
    const result = await client.query(`
      WITH RECURSIVE category_tree AS (
        SELECT c.id AS root_id, c.id
        FROM categories c
        WHERE c.slug IS NOT NULL AND btrim(c.slug) <> ''
        UNION ALL
        SELECT ct.root_id, child.id
        FROM category_tree ct
        INNER JOIN categories child ON child.parent_id = ct.id
      ),
      product_counts AS (
        SELECT
          ct.root_id,
          COUNT(p.id) FILTER (WHERE p.status = 'published')::int AS subtree_product_count,
          COUNT(p.id) FILTER (WHERE p.status = 'published' AND p.pricing IS NOT NULL)::int AS priced_product_count,
          COUNT(p.id) FILTER (
            WHERE p.status = 'published'
              AND (
                p.purchase_mode IS NULL
                OR LOWER(TRIM(p.purchase_mode)) IN ('both', 'rfq-only', 'rfq only', 'quote-only', 'quote only', 'rfq', 'quote')
                OR LOWER(p.purchase_mode) LIKE '%rfq%'
                OR LOWER(p.purchase_mode) LIKE '%quote%'
                OR LOWER(p.purchase_mode) LIKE '%contact%'
                OR LOWER(p.purchase_mode) LIKE '%inquiry%'
                OR LOWER(p.purchase_mode) LIKE '%enquiry%'
                OR LOWER(p.purchase_mode) LIKE '%custom%'
              )
          )::int AS rfq_enabled_count
        FROM category_tree ct
        LEFT JOIN products p ON p.primary_category_id = ct.id
        GROUP BY ct.root_id
      ),
      child_counts AS (
        SELECT parent_id, COUNT(*)::int AS child_count
        FROM categories
        WHERE parent_id IS NOT NULL
        GROUP BY parent_id
      )
      SELECT
        c.id,
        c.name,
        c.slug,
        c.status,
        c.parent_id,
        COALESCE(pc.subtree_product_count, 0)::int AS subtree_product_count,
        COALESCE(pc.priced_product_count, 0)::int AS priced_product_count,
        COALESCE(pc.rfq_enabled_count, 0)::int AS rfq_enabled_count,
        COALESCE(cc.child_count, 0)::int AS child_count,
        c.short_description,
        c.intro_content,
        c.description,
        c.buying_guide,
        c.faq,
        c.seo_content,
        c.updated_at
      FROM categories c
      LEFT JOIN product_counts pc ON pc.root_id = c.id
      LEFT JOIN child_counts cc ON cc.parent_id = c.id
      WHERE c.slug IS NOT NULL AND btrim(c.slug) <> ''
      ORDER BY c.name
    `)

    return result.rows.map((row) => ({
      ...row,
      has_short_description: textLength(row.short_description) > 60,
      has_intro: textLength(row.intro_content) > 180,
      has_description: textLength(row.description) > 250,
      has_buying_guide: textLength(row.buying_guide) > 250,
      has_faq: hasFaq(row.faq),
      has_seo_content: textLength(row.seo_content) > 250,
      has_seo_framework:
        textLength(row.intro_content) > 180 ||
        textLength(row.buying_guide) > 250 ||
        hasFaq(row.faq) ||
        textLength(row.seo_content) > 250,
    }))
  } finally {
    await client.end()
  }
}

function writeCsv(rows) {
  const headers = [
    'rank',
    'score',
    'action',
    'name',
    'slug',
    'url',
    'clicks',
    'impressions',
    'ctr',
    'position',
    'subtree_product_count',
    'priced_product_count',
    'has_products',
    'rfq_enabled_count',
    'is_rfq_suitable',
    'child_count',
    'is_in_sitemap',
    'is_indexable',
    'has_intro',
    'has_buying_guide',
    'has_faq',
    'has_seo_framework',
    'has_seo_override',
    'has_guide_cluster',
    'has_related_knowledge_article',
    'is_redirect_source',
  ]
  const lines = [headers.join(',')]
  rows.forEach((row, index) => {
    lines.push(headers.map((header) => csvEscape(header === 'rank' ? index + 1 : row[header])).join(','))
  })
  fs.writeFileSync(CSV_OUTPUT, `${lines.join('\n')}\n`)
}

function writeMarkdown(rows, queryMetrics) {
  const topRows = rows.slice(0, 30)
  const seedRows = rows.filter((row) => row.action === 'seed_demand_capture_page').slice(0, 15)
  const ctrRows = rows.filter((row) => row.action === 'improve_ctr_title_meta').slice(0, 15)
  const trendQueries = queryMetrics
    .filter((row) => row.impressions >= 5 && row.clicks === 0)
    .sort((a, b) => b.impressions - a.impressions)
    .slice(0, 20)

  const table = (items) => [
    '| Rank | Score | Action | Category | Products | Impr. | CTR | Pos. |',
    '|---:|---:|---|---|---:|---:|---:|---:|',
    ...items.map((row, index) =>
      `| ${index + 1} | ${row.score} | ${row.action} | [${row.name}](https://machrio.com/category/${row.slug}) | ${row.subtree_product_count} | ${row.impressions} | ${(row.ctr * 100).toFixed(2)}% | ${row.position || ''} |`,
    ),
  ].join('\n')

  const markdown = `# SEO Opportunity Plan - 2026-05-14

## What This Report Uses

- Database categories: ${rows.length}
- GSC performance export: ${fs.existsSync(DEFAULT_PERFORMANCE_ZIP) ? DEFAULT_PERFORMANCE_ZIP : 'not found'}
- Signals: impressions, clicks, CTR, average position, product coverage, content gaps, existing SEO overrides, guide clusters, strategic terms, redirect-source exclusion.
- CSV fields include: category URL, product coverage, product count, sitemap inclusion, indexability, SEO copy/FAQ/framework coverage, related knowledge cluster, RFQ suitability, and priority score.

## Top 30 Category Opportunities

${table(topRows)}

## CTR Rescue Queue

Pages here already have search impressions but need better title/meta/intent matching.

${ctrRows.length ? table(ctrRows) : 'No category pages in the current export crossed the CTR rescue threshold.'}

## Seed Page Queue

These are categories with little or no product coverage that can be used as demand-capture pages before supplier development.

${seedRows.length ? table(seedRows) : 'No zero-product categories reached the current scoring threshold.'}

## Query Signals To Investigate

${trendQueries.map((row) => `- ${row.query}: ${row.impressions} impressions, position ${row.position}`).join('\n') || '- No query-only opportunities found in the current export.'}

## Today Execution Rules

1. Strengthen pages that already have impressions and product coverage before creating many new pages.
2. For no-product categories, publish only demand-capture pages: buying criteria, applications, substitute routes, related categories, and RFQ.
3. Do not put redirect sources, noindex pages, search pages, cart, checkout, account, or order URLs in sitemap.
4. Every priority category needs either a product grid, RFQ route, or supplier-development task.
`
  fs.writeFileSync(MD_OUTPUT, markdown)
}

async function main() {
  if (!process.env.DATABASE_URI) {
    throw new Error('DATABASE_URI is required. Load .env.local before running this script.')
  }

  fs.mkdirSync(OUTPUT_DIR, { recursive: true })
  const performanceZip = process.argv[2] || DEFAULT_PERFORMANCE_ZIP
  const [{ pageMetrics, queryMetrics }, categories] = await Promise.all([
    loadPerformance(performanceZip),
    loadCategories(),
  ])
  const signals = extractSeoSignals()

  const rows = categories
    .map((category) => {
      const perf = getPerformanceForCategory(pageMetrics, category.slug)
      const score = scoreCategory(category, perf, signals)
      const row = {
        ...category,
        url: `https://machrio.com/category/${category.slug}`,
        clicks: perf.clicks,
        impressions: perf.impressions,
        ctr: perf.ctr,
        position: perf.position,
        score,
        has_products: category.subtree_product_count > 0,
        is_in_sitemap:
          category.status === 'published' &&
          category.subtree_product_count > 0 &&
          !CATEGORY_REDIRECT_SOURCES.has(category.slug),
        is_indexable:
          category.status === 'published' &&
          !CATEGORY_REDIRECT_SOURCES.has(category.slug),
        is_rfq_suitable:
          category.rfq_enabled_count > 0 ||
          category.subtree_product_count === 0 ||
          STRATEGIC_TERMS.some((term) => `${category.name} ${category.slug}`.toLowerCase().includes(term)),
        has_seo_override: signals.overrideSlugs.has(category.slug),
        has_guide_cluster: signals.guideSlugs.has(category.slug),
        has_related_knowledge_article: signals.guideSlugs.has(category.slug),
        is_redirect_source: CATEGORY_REDIRECT_SOURCES.has(category.slug),
      }
      row.action = actionFor(row, perf, signals)
      return row
    })
    .filter((row) => !row.is_redirect_source)
    .sort((a, b) => b.score - a.score)

  writeCsv(rows)
  writeMarkdown(rows, queryMetrics)

  console.log(`Wrote ${CSV_OUTPUT}`)
  console.log(`Wrote ${MD_OUTPUT}`)
  console.log('Top 10:')
  rows.slice(0, 10).forEach((row, index) => {
    console.log(`${index + 1}. ${row.slug} score=${row.score} action=${row.action}`)
  })
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
