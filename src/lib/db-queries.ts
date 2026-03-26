/**
 * Supabase 数据库查询模块
 * 用于 SSR 模式从数据库实时获取数据
 * 使用全局连接池避免每次创建新连接
 */

import pg from 'pg'

const { Pool } = pg

// 全局连接池 - Vercel Serverless 环境使用 globalThis 持久化
let globalPool: Pool | null = null

function getGlobalPool(): Pool {
  // 在开发环境使用普通全局变量
  if (process.env.NODE_ENV === 'development') {
    if (!globalPool) {
      globalPool = createPool()
    }
    return globalPool
  }

  // 在生产环境使用 globalThis 跨请求持久化
  if (!(globalThis as Record<string, unknown>).__pgPool) {
    (globalThis as Record<string, unknown>).__pgPool = createPool()
  }
  return (globalThis as Record<string, unknown>).__pgPool as Pool
}

// 创建连接池 - 带超时配置
function createPool(): Pool {
  const connectionString = process.env.DATABASE_URI
  if (!connectionString) {
    throw new Error('DATABASE_URI environment variable is not set')
  }
  return new Pool({
    connectionString,
    max: 5,  // 增加到 5 个连接（每个 Vercel 实例）
    connectionTimeoutMillis: 10000, // 10秒超时
    idleTimeoutMillis: 30000, // 30秒空闲超时
  })
}

export interface DbCategory {
  id: string
  name: string
  slug: string
  parent_id: string | null
  display_order: number | null
  // Payload CMS 可能使用 camelCase 或 snake_case
  short_description: string | null
  shortDescription: string | null
  description: unknown | null
  intro_content: string | null
  introContent: string | null
  buying_guide: unknown | null
  buyingGuide: unknown | null
  faq: Array<{ question: string; answer: string }> | null
  seo_content: unknown | null
  seoContent: unknown | null
}

export interface DbProduct {
  id: string
  name: string
  slug: string
  sku: string
  short_description: string | null
  primary_category_id: string | null
  pricing: { basePrice: number; currency: string } | null
  status: string
  images: Array<{ url: string }> | null
}

/**
 * 获取分类及其子分类的所有 ID
 */
async function getCategoryAndDescendantIds(categoryId: string): Promise<string[]> {
  const pool = getGlobalPool()
  // 递归获取所有子分类 ID
  const allIds: string[] = [categoryId]
  
  // 获取 L2 子分类
  const l2Result = await pool.query<{ id: string }>(
    'SELECT id FROM categories WHERE parent_id = $1',
    [categoryId]
  )
  
  for (const l2 of l2Result.rows) {
    allIds.push(l2.id)
    
    // 获取 L3 子分类
    const l3Result = await pool.query<{ id: string }>(
      'SELECT id FROM categories WHERE parent_id = $1',
      [l2.id]
    )
    
    for (const l3 of l3Result.rows) {
      allIds.push(l3.id)
    }
  }
  
  return allIds
}

/**
 * 根据 slug 获取分类信息
 */
export async function getCategoryBySlug(slug: string): Promise<{
  category: DbCategory
  parent: DbCategory | null
  grandparent: DbCategory | null
  children: DbCategory[]
  productCount: number
} | null> {
  const pool = getGlobalPool()
  
  // 1. 获取当前分类（包含 SEO 字段）
  // Payload CMS 可能使用 camelCase 或 snake_case 列名
  const catResult = await pool.query<DbCategory>(
    `SELECT id, name, slug, parent_id, display_order,
            short_description, shortDescription,
            description,
            intro_content, introContent,
            buying_guide, buyingGuide,
            faq,
            seo_content, seoContent
     FROM categories WHERE slug = $1`,
    [slug]
  )
  
  if (catResult.rows.length === 0) {
    return null
  }
  
  const category = catResult.rows[0]
  
  // 2. 确定层级并获取相关信息
  let parent: DbCategory | null = null
  let grandparent: DbCategory | null = null
  let children: DbCategory[] = []
  let productCount = 0
  
  if (category.parent_id === null) {
    // L1 分类：获取 L2 子分类和产品总数
    const childrenResult = await pool.query<DbCategory>(
      'SELECT * FROM categories WHERE parent_id = $1 ORDER BY display_order NULLS LAST, name',
      [category.id]
    )
    children = childrenResult.rows
    
    // 获取该 L1 下所有产品的总数
    const childIds = await getCategoryAndDescendantIds(category.id)
    if (childIds.length > 0) {
      const countResult = await pool.query<{ count: string }>(
        `SELECT COUNT(*) as count FROM products 
         WHERE primary_category_id = ANY($1) AND status = 'published'`,
        [childIds]
      )
      productCount = parseInt(countResult.rows[0].count)
    }
  } else {
    // L2 或 L3 分类
    // 获取父分类
    const parentResult = await pool.query<DbCategory>(
      'SELECT * FROM categories WHERE id = $1',
      [category.parent_id]
    )
    
    if (parentResult.rows.length > 0) {
      parent = parentResult.rows[0]
      
      // 如果有祖父分类（L2 的情况）
      if (parent.parent_id !== null) {
        const gpResult = await pool.query<DbCategory>(
          'SELECT * FROM categories WHERE id = $1',
          [parent.parent_id]
        )
        if (gpResult.rows.length > 0) {
          grandparent = gpResult.rows[0]
        }
      }
      
      // 获取同级的兄弟分类
      const siblingsResult = await pool.query<DbCategory>(
        'SELECT * FROM categories WHERE parent_id = $1 AND id != $2 ORDER BY display_order NULLS LAST, name',
        [category.parent_id, category.id]
      )
      children = siblingsResult.rows
      
      // 获取该分类下的产品数量
      if (category.parent_id !== null) {
        // 如果是 L2，获取所有 L3 子分类的 ID
        const descendantIds = await getCategoryAndDescendantIds(category.id)
        if (descendantIds.length > 0) {
          const countResult = await pool.query<{ count: string }>(
            `SELECT COUNT(*) as count FROM products 
             WHERE primary_category_id = ANY($1) AND status = 'published'`,
            [descendantIds]
          )
          productCount = parseInt(countResult.rows[0].count)
        }
      }
    }
  }
  
  return { category, parent, grandparent, children, productCount }
}

/**
 * 获取 L1 分类列表（带产品数量）
 */
export async function getL1CategoriesWithCounts(): Promise<Array<{
  id: string
  name: string
  slug: string
  productCount: number
}>> {
  const pool = getGlobalPool()
  
  // 获取所有 L1 分类
  const l1Result = await pool.query<DbCategory>(
    'SELECT * FROM categories WHERE parent_id IS NULL ORDER BY display_order NULLS LAST, name'
  )
  
  const result: Array<{
    id: string
    name: string
    slug: string
    productCount: number
  }> = []
  
  for (const cat of l1Result.rows) {
    // 获取该 L1 下所有产品的总数
    const childIds = await getCategoryAndDescendantIds(cat.id)
    let count = 0
    
    if (childIds.length > 0) {
      const countResult = await pool.query<{ count: string }>(
        `SELECT COUNT(*) as count FROM products 
         WHERE primary_category_id = ANY($1) AND status = 'published'`,
        [childIds]
      )
      count = parseInt(countResult.rows[0].count)
    }
    
    result.push({
      id: cat.id,
      name: cat.name,
      slug: cat.slug,
      productCount: count,
    })
  }
  
  return result
}

/**
 * 根据 slug 获取单个产品信息
 */
export async function getProductBySlug(slug: string): Promise<{
  product: {
    id: string
    name: string
    slug: string
    sku: string | null
    short_description: string | null
    full_description: unknown | null
    pricing: unknown | null
    images: unknown | null
    specifications: unknown | null
    status: string
    availability: string | null
    lead_time: string | null
    min_order_quantity: number | null
    package_qty: number | null
    package_unit: string | null
    external_image_url: string | null
    category_id: string | null
    category_slug: string | null
    category_name: string | null
    parent_category_slug: string | null
    parent_category_name: string | null
    grandparent_category_slug: string | null
  } | null
}> {
  const pool = getGlobalPool()

  // 查询产品及其分类信息
  const result = await pool.query<{
    id: string
    name: string
    slug: string
    sku: string | null
    short_description: string | null
    full_description: unknown | null
    pricing: unknown | null
    images: unknown | null
    specifications: unknown | null
    status: string
    availability: string | null
    lead_time: string | null
    min_order_quantity: number | null
    package_qty: number | null
    package_unit: string | null
    external_image_url: string | null
    category_id: string | null
    category_slug: string | null
    category_name: string | null
    parent_category_slug: string | null
    parent_category_name: string | null
    grandparent_category_slug: string | null
    brand_name: string | null
  }>(
    `SELECT
      p.id, p.name, p.slug, p.sku, p.short_description, p.full_description,
      p.pricing, p.images, p.specifications, p.status,
      p.availability, p.lead_time, p.min_order_quantity,
      p.package_qty, p.package_unit, p.external_image_url,
      c.id as category_id, c.slug as category_slug, c.name as category_name,
      pc.slug as parent_category_slug, pc.name as parent_category_name,
      gc.slug as grandparent_category_slug
     FROM products p
     LEFT JOIN categories c ON p.primary_category_id = c.id
     LEFT JOIN categories pc ON c.parent_id = pc.id
     LEFT JOIN categories gc ON pc.parent_id = gc.id
     WHERE p.slug = $1 AND p.status = 'published'
     LIMIT 1`,
    [slug]
  )

  if (result.rows.length === 0) {
    return { product: null }
  }

  return { product: result.rows[0] }
}

/**
 * 获取分类下的产品列表
 */
export async function getProductsByCategorySlug(
  slug: string,
  page: number = 1,
  limit: number = 24
): Promise<{
  products: DbProduct[]
  totalCount: number
  page: number
  totalPages: number
}> {
  const pool = getGlobalPool()
  
  // 获取分类及其所有子分类 ID
  const categoryResult = await pool.query<{ id: string }>(
    'SELECT id FROM categories WHERE slug = $1',
    [slug]
  )
  
  if (categoryResult.rows.length === 0) {
    return { products: [], totalCount: 0, page: 1, totalPages: 1 }
  }
  
  const categoryId = categoryResult.rows[0].id
  const descendantIds = await getCategoryAndDescendantIds(categoryId)
  
  if (descendantIds.length === 0) {
    return { products: [], totalCount: 0, page: 1, totalPages: 1 }
  }
  
  // 获取总数
  const countResult = await pool.query<{ count: string }>(
    `SELECT COUNT(*) as count FROM products 
     WHERE primary_category_id = ANY($1) AND status = 'published'`,
    [descendantIds]
  )
  const totalCount = parseInt(countResult.rows[0].count)
  const totalPages = Math.ceil(totalCount / limit)
  
  // 获取产品列表
  const offset = (page - 1) * limit
  const productsResult = await pool.query<DbProduct>(
    `SELECT id, name, slug, sku, short_description, primary_category_id, pricing, status, images
     FROM products
     WHERE primary_category_id = ANY($1) AND status = 'published'
     ORDER BY name
     LIMIT $2 OFFSET $3`,
    [descendantIds, limit, offset]
  )
  
  return {
    products: productsResult.rows,
    totalCount,
    page,
    totalPages,
  }
}
