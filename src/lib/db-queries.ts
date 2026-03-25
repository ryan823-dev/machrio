/**
 * Supabase 数据库查询模块
 * 用于 SSR 模式从数据库实时获取数据
 */

import pg from 'pg'

const { Pool } = pg

// 创建连接池 - 带超时配置
function createPool() {
  const connectionString = process.env.DATABASE_URI
  if (!connectionString) {
    throw new Error('DATABASE_URI environment variable is not set')
  }
  return new Pool({
    connectionString,
    max: 1,
    connectionTimeoutMillis: 5000, // 5秒超时
    idleTimeoutMillis: 10000,
  })
}

export interface DbCategory {
  id: string
  name: string
  slug: string
  parent_id: string | null
  display_order: number | null
}

export interface DbProduct {
  id: string
  name: string
  slug: string
  sku: string
  short_description: string | null
  primary_category_id: string | null
  pricing: Record<string, unknown> | null
  status: string
}

/**
 * 获取分类及其子分类的所有 ID
 */
async function getCategoryAndDescendantIds(categoryId: string): Promise<string[]> {
  const pool = await createPool()
  try {
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
  } finally {
    await pool.end()
  }
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
  const pool = await createPool()
  
  try {
    // 1. 获取当前分类
    const catResult = await pool.query<DbCategory>(
      'SELECT * FROM categories WHERE slug = $1',
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
  } finally {
    await pool.end()
  }
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
  const pool = await createPool()
  
  try {
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
  } finally {
    await pool.end()
  }
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
  const pool = await createPool()
  
  try {
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
      `SELECT id, name, slug, sku, short_description, primary_category_id, pricing, status 
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
  } finally {
    await pool.end()
  }
}
