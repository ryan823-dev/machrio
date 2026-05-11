import { config as loadEnv } from 'dotenv'
import { getPool } from '../src/lib/db'
import { builtinKnowledgeArticles } from '../src/content/knowledge-articles'

loadEnv({ path: '.env.local' })
loadEnv()

type MissingIntroRow = {
  slug: string
  name: string
  published_products: string | number
}

type DuplicateDescriptionRow = {
  normalized_description: string
  duplicate_count: string | number
  slugs: string[]
}

type LongProductDescriptionRow = {
  slug: string
  sku: string | null
  name: string
  description_length: string | number
}

type KnowledgeArticleAuditRow = {
  slug: string
  title: string
  quick_answer: string | null
}

function formatCount(value: string | number): string {
  return Number(value).toLocaleString('en-US')
}

function truncate(value: string, maxLength = 120): string {
  const normalized = value.replace(/\s+/g, ' ').trim()
  if (normalized.length <= maxLength) return normalized
  return `${normalized.slice(0, maxLength - 3).trim()}...`
}

async function auditCategoryIntros() {
  const pool = getPool()
  const result = await pool.query<MissingIntroRow>(
    `WITH RECURSIVE category_tree AS (
       SELECT id, slug, name, id AS root_id
       FROM categories
       UNION ALL
       SELECT c.id, c.slug, c.name, ct.root_id
       FROM categories c
       INNER JOIN category_tree ct ON c.parent_id = ct.id
     )
     SELECT
       root.slug,
       root.name,
       COUNT(p.id) FILTER (WHERE p.status = 'published')::int AS published_products
     FROM categories root
     LEFT JOIN category_tree ct ON ct.root_id = root.id
     LEFT JOIN products p ON p.primary_category_id = ct.id
     WHERE COALESCE(NULLIF(TRIM(root.intro_content), ''), NULL) IS NULL
     GROUP BY root.id, root.slug, root.name
     ORDER BY published_products DESC, root.name
     LIMIT 20`,
  )

  console.log('\n[1] Categories Missing intro_content (top 20 by catalog size)')
  for (const row of result.rows) {
    console.log(`- ${row.slug} (${formatCount(row.published_products)} published SKUs)`)
  }
}

async function auditDuplicateCategoryDescriptions() {
  const pool = getPool()
  const result = await pool.query<DuplicateDescriptionRow>(
    `SELECT
       LOWER(REGEXP_REPLACE(TRIM(short_description), '\s+', ' ', 'g')) AS normalized_description,
       COUNT(*)::int AS duplicate_count,
       ARRAY_AGG(slug ORDER BY slug) AS slugs
     FROM categories
     WHERE COALESCE(NULLIF(TRIM(short_description), ''), NULL) IS NOT NULL
     GROUP BY LOWER(REGEXP_REPLACE(TRIM(short_description), '\s+', ' ', 'g'))
     HAVING COUNT(*) > 1
     ORDER BY duplicate_count DESC, normalized_description
     LIMIT 15`,
  )

  console.log('\n[2] Duplicate Category short_description Groups')
  for (const row of result.rows) {
    console.log(`- ${formatCount(row.duplicate_count)} categories share: "${truncate(row.normalized_description)}"`)
    console.log(`  slugs: ${row.slugs.slice(0, 8).join(', ')}${row.slugs.length > 8 ? ', ...' : ''}`)
  }
}

async function auditLongProductDescriptions() {
  const pool = getPool()
  const countResult = await pool.query<{
    over_300: string | number
    over_500: string | number
    average_length: string | number
  }>(
    `SELECT
       COUNT(*) FILTER (WHERE status = 'published' AND LENGTH(COALESCE(short_description, '')) > 300)::int AS over_300,
       COUNT(*) FILTER (WHERE status = 'published' AND LENGTH(COALESCE(short_description, '')) > 500)::int AS over_500,
       COALESCE(ROUND(AVG(CASE WHEN status = 'published' THEN LENGTH(COALESCE(short_description, '')) END), 0)::int, 0) AS average_length
     FROM products`,
  )

  const longestResult = await pool.query<LongProductDescriptionRow>(
    `SELECT slug, sku, name, LENGTH(COALESCE(short_description, ''))::int AS description_length
     FROM products
     WHERE status = 'published'
     ORDER BY description_length DESC, slug
     LIMIT 15`,
  )

  const counts = countResult.rows[0]
  console.log('\n[3] Product short_description Length Audit')
  console.log(`- Published products over 300 chars: ${formatCount(counts.over_300)}`)
  console.log(`- Published products over 500 chars: ${formatCount(counts.over_500)}`)
  console.log(`- Average published short_description length: ${formatCount(counts.average_length)} chars`)
  console.log('- Longest current examples:')

  for (const row of longestResult.rows) {
    console.log(`  - ${row.slug} (${row.sku || 'no-sku'}): ${formatCount(row.description_length)} chars`)
  }
}

function hasTemplatedKnowledgeTitle(title: string): boolean {
  return (
    /\bBuy Online\b/i.test(title) ||
    /\|\s*Machrio\b.*\|\s*Machrio\b/i.test(title) ||
    /Industry Insight\s*\|\s*Machrio/i.test(title) ||
    /Buying Guide\s*\|\s*Machrio/i.test(title)
  )
}

async function auditKnowledgeArticles() {
  const pool = getPool()
  const databaseArticles = await Promise.race([
    pool.query<KnowledgeArticleAuditRow>(
      `SELECT
         slug,
         title,
         "quickAnswer" AS quick_answer
       FROM articles
       WHERE status = 'published'`,
    ),
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Knowledge article audit query timeout')), 10000),
    ),
  ])

  const mergedArticles = [
    ...builtinKnowledgeArticles.map((article) => ({
      slug: article.slug,
      title: article.title,
      quickAnswer: article.quickAnswer || null,
    })),
    ...databaseArticles.rows.map((article) => ({
      slug: article.slug,
      title: article.title,
      quickAnswer: article.quick_answer,
    })),
  ]

  const templatedTitles = mergedArticles.filter((article) => hasTemplatedKnowledgeTitle(article.title))
  const missingQuickAnswer = mergedArticles.filter((article) => !article.quickAnswer?.trim())

  console.log('\n[4] Knowledge Center Quality Signals')
  console.log(`- Total merged articles reviewed: ${mergedArticles.length}`)
  console.log(`- Titles matching templated-risk patterns: ${templatedTitles.length}`)
  console.log(`- Articles missing quickAnswer: ${missingQuickAnswer.length}`)

  if (templatedTitles.length > 0) {
    console.log('- Sample templated-risk titles:')
    for (const article of templatedTitles.slice(0, 12)) {
      console.log(`  - ${article.slug}: ${article.title}`)
    }
  }

  if (missingQuickAnswer.length > 0) {
    console.log('- Sample articles missing quickAnswer:')
    for (const article of missingQuickAnswer.slice(0, 12)) {
      console.log(`  - ${article.slug}: ${article.title}`)
    }
  }
}

async function main() {
  if (!process.env.DATABASE_URI) {
    console.error('DATABASE_URI is required to run the content quality audit.')
    process.exit(1)
  }

  console.log('Machrio Content Quality Audit')
  console.log('============================')

  await auditCategoryIntros()
  await auditDuplicateCategoryDescriptions()
  await auditLongProductDescriptions()
  await auditKnowledgeArticles()
}

main()
  .catch((error) => {
    console.error('\nAudit failed:', error)
    process.exit(1)
  })
