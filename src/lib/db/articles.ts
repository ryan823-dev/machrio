import { getPool } from '@/lib/db'

// Article 类型定义
export interface Article {
  id: string
  title: string
  slug: string
  description: string | null
  excerpt: string | null
  content: any | null
  category: string | null
  tags: string[] | null
  featured_image: string | null
  hero_image_id: string | null
  author: string | null
  status: string
  published_at: string | null
  meta_title: string | null
  meta_description: string | null
  created_at: string
  updated_at: string
  reading_time?: number
}

// 获取 articles 列表
export async function getArticles(options: {
  category?: string
  page?: number
  limit?: number
}): Promise<{
  docs: Article[]
  totalDocs: number
  totalPages: number
  page: number
  hasNextPage: boolean
  hasPrevPage: boolean
}> {
  const { category, page = 1, limit = 12 } = options
  const offset = (page - 1) * limit
  const pool = getPool()

  try {
    // 构建 WHERE 条件
    let whereClause = 'WHERE status = $1'
    const params: any[] = ['published']
    let paramIndex = 2

    if (category) {
      whereClause += ` AND category = $${paramIndex}`
      params.push(category)
      paramIndex++
    }

    // 查询总数
    const countResult = await pool.query(
      `SELECT COUNT(*) as total FROM articles ${whereClause}`,
      params
    )
    const totalDocs = parseInt(countResult.rows[0]?.total || '0', 10)

    // 查询数据
    const dataResult = await pool.query(
      `SELECT
        id, title, slug, description, excerpt, category, tags,
        featured_image, hero_image_id, author, status, published_at,
        meta_title, meta_description, created_at, updated_at
       FROM articles
       ${whereClause}
       ORDER BY published_at DESC NULLS LAST, created_at DESC
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...params, limit, offset]
    )

    const totalPages = Math.ceil(totalDocs / limit) || 1

    return {
      docs: dataResult.rows.map(row => ({
        ...row,
        excerpt: row.description || row.excerpt,
        featuredImage: row.featured_image,
        publishedAt: row.published_at,
        readingTime: estimateReadingTime(row.content),
      })),
      totalDocs,
      totalPages,
      page,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    }
  } catch (error) {
    console.error('getArticles error:', error)
    return {
      docs: [],
      totalDocs: 0,
      totalPages: 0,
      page: 1,
      hasNextPage: false,
      hasPrevPage: false,
    }
  }
}

// 获取单篇 article
export async function getArticleBySlug(slug: string): Promise<Article | null> {
  const pool = getPool()
  try {
    const result = await pool.query(
      `SELECT * FROM articles WHERE slug = $1 AND status = 'published'`,
      [slug]
    )

    if (result.rows.length === 0) {
      return null
    }

    const row = result.rows[0]
    return {
      ...row,
      excerpt: row.description || row.excerpt,
      featuredImage: row.featured_image,
      publishedAt: row.published_at,
      readingTime: estimateReadingTime(row.content),
    }
  } catch (error) {
    console.error('getArticleBySlug error:', error)
    return null
  }
}

// 估算阅读时间
function estimateReadingTime(content: any): number {
  if (!content) return 3

  let text = ''
  if (typeof content === 'string') {
    text = content
  } else if (content?.root?.children) {
    // Lexical 格式
    text = extractTextFromLexical(content.root)
  }

  const wordCount = text.split(/\s+/).filter(Boolean).length
  return Math.max(1, Math.ceil(wordCount / 200))
}

// 从 Lexical 结构提取文本
function extractTextFromLexical(node: any): string {
  if (!node) return ''

  if (node.text) {
    return node.text
  }

  if (node.children && Array.isArray(node.children)) {
    return node.children.map(extractTextFromLexical).join(' ')
  }

  return ''
}

// 注意：不要导出 closePool() 函数，在 serverless 环境中连接池应该被复用