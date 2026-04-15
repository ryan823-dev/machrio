import { getPool } from '@/lib/db'
import { builtinKnowledgeArticles, type KnowledgeArticle } from '@/content/knowledge-articles'
import { normalizeRichTextContent } from '@/lib/lexical-utils'

type ArticleRow = Record<string, any>

const BUILTIN_BY_SLUG = new Map(
  builtinKnowledgeArticles.map((article) => [article.slug, article]),
)

function asString(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value : null
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
}

function extractExcerpt(row: ArticleRow): string {
  return (
    asString(row.excerpt) ||
    asString(row.shortDescription) ||
    asString(row.short_description) ||
    asString(row.description) ||
    ''
  )
}

function extractFeaturedImage(row: ArticleRow): string | null {
  const directValue =
    asString(row.featuredImage) ||
    asString(row.featured_image) ||
    asString(row.featuredImage_id) ||
    asString(row.featured_image_id) ||
    asString(row.hero_image_id)

  if (directValue) return directValue

  const featuredImage = row.featuredImage as Record<string, unknown> | undefined
  if (featuredImage && typeof featuredImage === 'object') {
    return (
      asString(featuredImage.url) ||
      asString(featuredImage.thumbnailURL) ||
      asString(featuredImage.filename)
    )
  }

  return null
}

function normalizeSeoField(
  row: ArticleRow,
  field: 'metaTitle' | 'metaDescription',
): string | null {
  const snakeField = field === 'metaTitle' ? 'meta_title' : 'meta_description'
  const flatSeoField = field === 'metaTitle' ? 'seo_metaTitle' : 'seo_metaDescription'
  const groupedValue = row.seo as Record<string, unknown> | undefined

  return (
    asString(row[field]) ||
    asString(row[snakeField]) ||
    asString(row[flatSeoField]) ||
    (groupedValue ? asString(groupedValue[field]) : null)
  )
}

function estimateReadingTime(content: unknown): number {
  const normalizedContent = normalizeRichTextContent(content)
  if (!normalizedContent) return 3

  const text = extractText(normalizedContent)
  const wordCount = text.split(/\s+/).filter(Boolean).length

  return Math.max(1, Math.ceil(wordCount / 200)) || 3
}

function extractText(node: unknown): string {
  if (!node) return ''

  if (typeof node === 'string') return node

  if (Array.isArray(node)) {
    return node.map(extractText).join(' ')
  }

  if (typeof node === 'object') {
    const record = node as Record<string, unknown>
    if (typeof record.text === 'string') return record.text
    if (Array.isArray(record.children)) return record.children.map(extractText).join(' ')
    if (record.root) return extractText(record.root)
  }

  return ''
}

function normalizeArticle(row: ArticleRow): KnowledgeArticle | null {
  const title = asString(row.title)
  const slug = asString(row.slug)

  if (!title || !slug) return null

  const publishedAt =
    asString(row.publishedAt) ||
    asString(row.published_at) ||
    asString(row.createdAt) ||
    asString(row.created_at) ||
    new Date().toISOString()

  const createdAt =
    asString(row.createdAt) ||
    asString(row.created_at) ||
    publishedAt

  const updatedAt =
    asString(row.updatedAt) ||
    asString(row.updated_at) ||
    publishedAt

  const category =
    asString(row.category) as KnowledgeArticle['category'] | null

  const article: KnowledgeArticle = {
    id: asString(row.id) || `db-${slug}`,
    title,
    slug,
    excerpt: extractExcerpt(row),
    content: normalizeRichTextContent(row.content ?? null),
    category: category || 'buying-guide',
    tags: asStringArray(row.tags),
    author: asString(row.author) || 'Machrio Team',
    status: 'published',
    publishedAt,
    metaTitle: normalizeSeoField(row, 'metaTitle'),
    metaDescription: normalizeSeoField(row, 'metaDescription'),
    createdAt,
    updatedAt,
    quickAnswer: asString(row.quickAnswer),
    faq: Array.isArray(row.faq) ? row.faq : [],
    featuredImage: extractFeaturedImage(row),
    source: 'database',
  }

  article.readingTime = estimateReadingTime(article.content)

  return article
}

function sortArticles(articles: KnowledgeArticle[]): KnowledgeArticle[] {
  return [...articles].sort((a, b) => {
    const bTime = new Date(b.publishedAt || b.createdAt).getTime()
    const aTime = new Date(a.publishedAt || a.createdAt).getTime()

    if (bTime !== aTime) return bTime - aTime

    return a.title.localeCompare(b.title)
  })
}

function mergeArticles(databaseArticles: KnowledgeArticle[]): KnowledgeArticle[] {
  const merged = new Map<string, KnowledgeArticle>()

  for (const article of builtinKnowledgeArticles) {
    merged.set(article.slug, {
      ...article,
      readingTime: article.readingTime || estimateReadingTime(article.content),
      source: 'builtin',
    })
  }

  for (const article of databaseArticles) {
    const builtinArticle = merged.get(article.slug)
    merged.set(article.slug, {
      ...(builtinArticle || {}),
      ...article,
      source: 'database',
    })
  }

  return sortArticles(Array.from(merged.values()))
}

async function fetchDatabaseArticles(category?: string): Promise<KnowledgeArticle[]> {
  if (!process.env.DATABASE_URI) {
    return []
  }

  const pool = getPool()
  const params: any[] = ['published']
  const conditions = ['status = $1']

  if (category) {
    params.push(category)
    conditions.push(`category = $${params.length}`)
  }

  try {
    const result = await pool.query<ArticleRow>(
      `SELECT * FROM articles WHERE ${conditions.join(' AND ')}`,
      params,
    )

    return result.rows
      .map(normalizeArticle)
      .filter((article): article is KnowledgeArticle => article !== null)
  } catch (error) {
    console.error('getArticles error:', error)
    return []
  }
}

async function getMergedArticles(category?: string): Promise<KnowledgeArticle[]> {
  const [databaseArticles] = await Promise.all([
    fetchDatabaseArticles(category),
  ])

  const merged = mergeArticles(databaseArticles)

  if (!category) return merged

  return merged.filter((article) => article.category === category)
}

export type { KnowledgeArticle as Article }

export async function getArticles(options: {
  category?: string
  page?: number
  limit?: number
}): Promise<{
  docs: KnowledgeArticle[]
  totalDocs: number
  totalPages: number
  page: number
  hasNextPage: boolean
  hasPrevPage: boolean
}> {
  const { category, page = 1, limit = 12 } = options
  const articles = await getMergedArticles(category)
  const totalDocs = articles.length
  const totalPages = Math.ceil(totalDocs / limit) || 1
  const offset = (page - 1) * limit

  return {
    docs: articles.slice(offset, offset + limit),
    totalDocs,
    totalPages,
    page,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
  }
}

export async function getArticleBySlug(slug: string): Promise<KnowledgeArticle | null> {
  if (BUILTIN_BY_SLUG.has(slug) || process.env.DATABASE_URI) {
    const articles = await getMergedArticles()
    return articles.find((article) => article.slug === slug) || null
  }

  return BUILTIN_BY_SLUG.get(slug) || null
}

export async function getAdjacentArticles(
  slug: string,
): Promise<{ prev: KnowledgeArticle | null; next: KnowledgeArticle | null }> {
  const articles = await getMergedArticles()
  const index = articles.findIndex((article) => article.slug === slug)

  if (index === -1) {
    return { prev: null, next: null }
  }

  return {
    prev: articles[index + 1] || null,
    next: articles[index - 1] || null,
  }
}
