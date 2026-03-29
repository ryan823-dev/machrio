import { Pool } from 'pg'

// 全局连接池 - Vercel Serverless 环境使用 globalThis 持久化
let globalPool: Pool | null = null

export function getPool(): Pool {
  // 在开发环境使用普通全局变量
  if (process.env.NODE_ENV === 'development') {
    if (!globalPool) {
      globalPool = createPool()
    }
    return globalPool
  }

  // 在生产环境使用 globalThis 跨请求持久化
  if (!(globalThis as Record<string, unknown>).__dbPool) {
    (globalThis as Record<string, unknown>).__dbPool = createPool()
  }
  return (globalThis as Record<string, unknown>).__dbPool as Pool
}

function createPool(): Pool {
  return new Pool({
    connectionString: process.env.DATABASE_URI,
    max: 5,
    min: 1,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
  })
}

// ============================================
// Products 查询
// ============================================

export interface ProductRow {
  id: string
  name: string
  slug: string
  sku: string
  short_description: string | null
  full_description: string | null
  primary_category_id: string | null
  brand_id: string | null
  status: string
  availability: string | null
  purchase_mode: string | null
  package_qty: number | null
  external_image_url: string | null
  primary_image_id: string | null
  created_at: string
  updated_at: string
}

export async function getProducts(options: {
  limit?: number
  page?: number
  sort?: string
  categoryId?: string
  brandId?: string
  status?: string
}): Promise<{
  docs: ProductRow[]
  totalDocs: number
  totalPages: number
  page: number
  hasNextPage: boolean
  hasPrevPage: boolean
}> {
  const pool = getPool()
  const { limit = 24, page = 1, sort = '-created_at', categoryId, brandId, status = 'published' } = options
  const offset = (page - 1) * limit

  try {
    // 构建 WHERE 条件
    const conditions: string[] = ['status = $1']
    const params: any[] = [status]
    let paramIndex = 2

    if (categoryId) {
      conditions.push(`primary_category_id::text = $${paramIndex}`)
      params.push(categoryId)
      paramIndex++
    }

    if (brandId) {
      conditions.push(`brand_id::text = $${paramIndex}`)
      params.push(brandId)
      paramIndex++
    }

    const whereClause = conditions.join(' AND ')

    // 排序
    let orderClause = 'created_at DESC'
    if (sort === 'name') orderClause = 'name ASC'
    else if (sort === '-name') orderClause = 'name DESC'
    else if (sort === 'created_at') orderClause = 'created_at ASC'
    else if (sort === '-created_at') orderClause = 'created_at DESC'

    // 查询总数
    const countResult = await pool.query(
      `SELECT COUNT(*) as total FROM products WHERE ${whereClause}`,
      params
    )
    const totalDocs = parseInt(countResult.rows[0]?.total || '0', 10)

    // 查询数据
    const dataResult = await pool.query(
      `SELECT * FROM products WHERE ${whereClause} ORDER BY ${orderClause} LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...params, limit, offset]
    )

    const totalPages = Math.ceil(totalDocs / limit) || 1

    return {
      docs: dataResult.rows,
      totalDocs,
      totalPages,
      page,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    }
  } catch (error) {
    console.error('getProducts error:', error)
    return { docs: [], totalDocs: 0, totalPages: 0, page: 1, hasNextPage: false, hasPrevPage: false }
  }
}

export async function getProductBySlug(slug: string): Promise<ProductRow | null> {
  const pool = getPool()
  try {
    const result = await pool.query(
      `SELECT * FROM products WHERE slug = $1 AND status = 'published'`,
      [slug]
    )
    return result.rows[0] || null
  } catch {
    return null
  }
}

export async function searchProducts(query: string, options?: {
  limit?: number
  brandId?: string
  categoryId?: string
}): Promise<{
  docs: ProductRow[]
  totalDocs: number
}> {
  const pool = getPool()
  const { limit = 24 } = options || {}

  try {
    const searchTerm = `%${query.toLowerCase()}%`
    const result = await pool.query(
      `SELECT * FROM products
       WHERE status = 'published'
       AND (LOWER(name) LIKE $1 OR LOWER(short_description) LIKE $1 OR LOWER(sku) LIKE $1)
       ORDER BY created_at DESC
       LIMIT $2`,
      [searchTerm, limit]
    )

    return {
      docs: result.rows,
      totalDocs: result.rows.length,
    }
  } catch (error) {
    console.error('searchProducts error:', error)
    return { docs: [], totalDocs: 0 }
  }
}

// ============================================
// Categories 查询
// ============================================

export interface CategoryRow {
  id: string
  name: string
  slug: string
  description: string | null
  short_description: string | null
  parent_id: string | null
  level: number
  icon: string | null
  icon_emoji: string | null
  featured: boolean
  display_order: number
  meta_title: string | null
  meta_description: string | null
  created_at: string
  updated_at: string
}

export async function getCategories(options?: {
  parentId?: string
  featured?: boolean
  limit?: number
}): Promise<CategoryRow[]> {
  const pool = getPool()
  const { parentId, featured, limit = 100 } = options || {}

  try {
    let query = 'SELECT * FROM categories WHERE 1=1'
    const params: any[] = []
    let paramIndex = 1

    if (parentId === null) {
      query += ` AND parent_id IS NULL`
    } else if (parentId) {
      query += ` AND parent_id::text = $${paramIndex}`
      params.push(parentId)
      paramIndex++
    }

    if (featured) {
      query += ` AND featured = true`
    }

    query += ` ORDER BY display_order, name LIMIT $${paramIndex}`
    params.push(limit)

    const result = await pool.query(query, params)
    return result.rows
  } catch (error) {
    console.error('getCategories error:', error)
    return []
  }
}

export async function getCategoryBySlug(slug: string): Promise<CategoryRow | null> {
  const pool = getPool()
  try {
    const result = await pool.query(
      `SELECT * FROM categories WHERE slug = $1`,
      [slug]
    )
    return result.rows[0] || null
  } catch {
    return null
  }
}

export async function getCategoryChildren(parentId: string): Promise<CategoryRow[]> {
  const pool = getPool()
  try {
    const result = await pool.query(
      `SELECT * FROM categories WHERE parent_id::text = $1 ORDER BY display_order, name`,
      [parentId]
    )
    return result.rows
  } catch {
    return []
  }
}

// ============================================
// Brands 查询
// ============================================

export interface BrandRow {
  id: string
  name: string
  slug: string
  description: string | null
  logo: string | null
  website: string | null
  featured: boolean
  created_at: string
  updated_at: string
}

export async function getBrands(limit?: number): Promise<BrandRow[]> {
  const pool = getPool()
  try {
    const result = await pool.query(
      `SELECT * FROM brands ORDER BY name LIMIT $1`,
      [limit || 100]
    )
    return result.rows
  } catch {
    return []
  }
}

export async function getBrandBySlug(slug: string): Promise<BrandRow | null> {
  const pool = getPool()
  try {
    const result = await pool.query(
      `SELECT * FROM brands WHERE slug = $1`,
      [slug]
    )
    return result.rows[0] || null
  } catch {
    return null
  }
}

// ============================================
// Articles 查询
// ============================================

export interface ArticleRow {
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
}

export async function getArticles(options?: {
  category?: string
  page?: number
  limit?: number
}): Promise<{
  docs: ArticleRow[]
  totalDocs: number
  totalPages: number
  page: number
  hasNextPage: boolean
  hasPrevPage: boolean
}> {
  const pool = getPool()
  const { category, page = 1, limit = 12 } = options || {}
  const offset = (page - 1) * limit

  try {
    let whereClause = 'WHERE status = $1'
    const params: any[] = ['published']
    let paramIndex = 2

    if (category) {
      whereClause += ` AND category = $${paramIndex}`
      params.push(category)
      paramIndex++
    }

    const countResult = await pool.query(
      `SELECT COUNT(*) as total FROM articles ${whereClause}`,
      params
    )
    const totalDocs = parseInt(countResult.rows[0]?.total || '0', 10)

    const dataResult = await pool.query(
      `SELECT * FROM articles ${whereClause} ORDER BY published_at DESC NULLS LAST, created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...params, limit, offset]
    )

    const totalPages = Math.ceil(totalDocs / limit) || 1

    return {
      docs: dataResult.rows,
      totalDocs,
      totalPages,
      page,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    }
  } catch (error) {
    console.error('getArticles error:', error)
    return { docs: [], totalDocs: 0, totalPages: 0, page: 1, hasNextPage: false, hasPrevPage: false }
  }
}

export async function getArticleBySlug(slug: string): Promise<ArticleRow | null> {
  const pool = getPool()
  try {
    const result = await pool.query(
      `SELECT * FROM articles WHERE slug = $1 AND status = 'published'`,
      [slug]
    )
    return result.rows[0] || null
  } catch {
    return null
  }
}

// ============================================
// Glossary Terms 查询
// ============================================

export interface GlossaryTermRow {
  id: string
  term: string
  slug: string
  full_name: string | null
  definition: string
  category: string | null
  status: string
  created_at: string
  updated_at: string
}

export async function getGlossaryTerms(limit?: number): Promise<GlossaryTermRow[]> {
  const pool = getPool()
  try {
    const result = await pool.query(
      `SELECT * FROM glossary_terms WHERE status = 'published' ORDER BY term LIMIT $1`,
      [limit || 500]
    )
    return result.rows
  } catch {
    return []
  }
}

export async function getGlossaryTermBySlug(slug: string): Promise<GlossaryTermRow | null> {
  const pool = getPool()
  try {
    const result = await pool.query(
      `SELECT * FROM glossary_terms WHERE slug = $1 AND status = 'published'`,
      [slug]
    )
    return result.rows[0] || null
  } catch {
    return null
  }
}

// ============================================
// Orders 查询
// ============================================

export interface OrderRow {
  id: string
  order_number: string
  customer_email: string
  customer_name: string
  customer_phone: string | null
  customer_company: string | null
  status: string
  payment_status: string
  payment_method: string | null
  subtotal: number
  shipping_cost: number
  tax: number
  total: number
  shipping_address: any
  billing_address: any
  items: any
  notes: string | null
  created_at: string
  updated_at: string
}

export async function getOrderByNumber(orderNumber: string): Promise<OrderRow | null> {
  const pool = getPool()
  try {
    const result = await pool.query(
      `SELECT * FROM orders WHERE order_number = $1`,
      [orderNumber]
    )
    return result.rows[0] || null
  } catch {
    return null
  }
}

export async function createOrder(data: {
  orderNumber: string
  customerEmail: string
  customerName: string
  customerPhone?: string
  customerCompany?: string
  status: string
  paymentStatus: string
  paymentMethod?: string
  subtotal: number
  shippingCost: number
  tax: number
  total: number
  shippingAddress: any
  billingAddress: any
  items: any
  notes?: string
}): Promise<OrderRow | null> {
  const pool = getPool()
  try {
    const result = await pool.query(
      `INSERT INTO orders (
        order_number, customer_email, customer_name, customer_phone, customer_company,
        status, payment_status, payment_method, subtotal, shipping_cost, tax, total,
        shipping_address, billing_address, items, notes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
      RETURNING *`,
      [
        data.orderNumber, data.customerEmail, data.customerName, data.customerPhone || null,
        data.customerCompany || null, data.status, data.paymentStatus, data.paymentMethod || null,
        data.subtotal, data.shippingCost, data.tax, data.total,
        JSON.stringify(data.shippingAddress), JSON.stringify(data.billingAddress),
        JSON.stringify(data.items), data.notes || null
      ]
    )
    return result.rows[0] || null
  } catch (error) {
    console.error('createOrder error:', error)
    throw error  // Re-throw to let caller handle it
  }
}

// ============================================
// RFQ Submissions 查询
// ============================================

export async function createRFQSubmission(data: {
  customerName: string
  customerEmail: string
  customerPhone?: string
  customerCompany: string
  message: string
  sourcePage?: string
}): Promise<boolean> {
  const pool = getPool()
  try {
    await pool.query(
      `INSERT INTO rfq_submissions (
        customer_name, customer_email, customer_phone, customer_company,
        message, source_page, status, submitted_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        data.customerName, data.customerEmail, data.customerPhone || null,
        data.customerCompany, data.message, data.sourcePage || '/rfq',
        'new', new Date().toISOString()
      ]
    )
    return true
  } catch (error) {
    console.error('createRFQSubmission error:', error)
    return false
  }
}

// ============================================
// Contact Submissions 查询
// ============================================

export async function createContactSubmission(data: {
  name: string
  email: string
  phone?: string
  company?: string
  subject: string
  message: string
}): Promise<boolean> {
  const pool = getPool()
  try {
    await pool.query(
      `INSERT INTO contact_submissions (
        name, email, phone, company, subject, message, status, submitted_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        data.name, data.email, data.phone || null, data.company || null,
        data.subject, data.message, 'new', new Date().toISOString()
      ]
    )
    return true
  } catch (error) {
    console.error('createContactSubmission error:', error)
    return false
  }
}

// ============================================
// Product Views 统计
// ============================================

export async function incrementProductViews(productId: string): Promise<void> {
  const pool = getPool()
  try {
    await pool.query(
      `INSERT INTO product_views (product_id, view_count, last_viewed_at)
       VALUES ($1, 1, NOW())
       ON CONFLICT (product_id)
       DO UPDATE SET view_count = product_views.view_count + 1, last_viewed_at = NOW()`,
      [productId]
    )
  } catch (error) {
    console.error('incrementProductViews error:', error)
  }
}

export async function getProductViews(productId: string): Promise<number> {
  const pool = getPool()
  try {
    const result = await pool.query(
      `SELECT view_count FROM product_views WHERE product_id::text = $1`,
      [productId]
    )
    return result.rows[0]?.view_count || 0
  } catch {
    return 0
  }
}

// ============================================
// Account Sessions 查询
// ============================================

export async function createAccountSession(email: string, code: string): Promise<string | null> {
  const pool = getPool()
  try {
    const sessionId = crypto.randomUUID()
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString() // 15 minutes

    await pool.query(
      `INSERT INTO account_sessions (id, email, verification_code, expires_at, created_at)
       VALUES ($1, $2, $3, $4, NOW())`,
      [sessionId, email, code, expiresAt]
    )
    return sessionId
  } catch (error) {
    console.error('createAccountSession error:', error)
    return null
  }
}

export async function verifyAccountSession(sessionId: string, code: string): Promise<{ email: string } | null> {
  const pool = getPool()
  try {
    const result = await pool.query(
      `SELECT email FROM account_sessions
       WHERE id::text = $1 AND verification_code = $2 AND expires_at > NOW()`,
      [sessionId, code]
    )
    return result.rows[0] || null
  } catch {
    return null
  }
}

export async function deleteAccountSession(sessionId: string): Promise<void> {
  const pool = getPool()
  try {
    await pool.query(
      `DELETE FROM account_sessions WHERE id::text = $1`,
      [sessionId]
    )
  } catch {
    // Ignore
  }
}

// ============================================
// 搜索建议
// ============================================

export async function getProductSuggestions(query: string, limit?: number): Promise<{ name: string; slug: string }[]> {
  const pool = getPool()
  try {
    const searchTerm = `%${query.toLowerCase()}%`
    const result = await pool.query(
      `SELECT name, slug FROM products
       WHERE status = 'published'
       AND (LOWER(name) LIKE $1 OR LOWER(sku) LIKE $1)
       ORDER BY name
       LIMIT $2`,
      [searchTerm, limit || 10]
    )
    return result.rows
  } catch {
    return []
  }
}

// ============================================
// Industry Pages 查询
// ============================================

export interface IndustryRow {
  id: string
  name: string
  slug: string
  description: string | null
  hero_image: string | null
  featured_categories: string[] | null
  meta_title: string | null
  meta_description: string | null
  status: string
  created_at: string
  updated_at: string
}

export async function getIndustryBySlug(slug: string): Promise<IndustryRow | null> {
  const pool = getPool()
  try {
    const result = await pool.query(
      `SELECT * FROM industries WHERE slug = $1 AND status = 'published'`,
      [slug]
    )
    return result.rows[0] || null
  } catch {
    return null
  }
}

export async function getIndustries(limit?: number): Promise<IndustryRow[]> {
  const pool = getPool()
  try {
    const result = await pool.query(
      `SELECT * FROM industries WHERE status = 'published' ORDER BY name LIMIT $1`,
      [limit || 50]
    )
    return result.rows
  } catch {
    return []
  }
}

// ============================================
// Count 查询
// ============================================

export async function countProducts(options?: { categoryId?: string; status?: string }): Promise<number> {
  const pool = getPool()
  const { categoryId, status = 'published' } = options || {}

  try {
    let query = 'SELECT COUNT(*) as total FROM products WHERE status = $1'
    const params: any[] = [status]

    if (categoryId) {
      // 包含子分类的产品计数
      query = `
        SELECT COUNT(*) as total FROM products p
        WHERE p.status = $1
        AND p.primary_category_id::text IN (
          SELECT c.id::text FROM categories c
          WHERE c.id::text = $2
          OR c.parent_id::text = $2
          OR c.parent_id::text IN (
            SELECT cc.id::text FROM categories cc WHERE cc.parent_id::text = $2
          )
        )
      `
      params.push(categoryId)
    }

    const result = await pool.query(query, params)
    return parseInt(result.rows[0]?.total || '0', 10)
  } catch {
    return 0
  }
}

// ============================================
// Bank Accounts 查询
// ============================================

export interface BankAccountRow {
  id: string
  account_name: string
  bank_name: string
  beneficiary_name: string
  account_number: string
  currency: string
  swift_code: string | null
  local_bank_code: string | null
  local_bank_code_label: string | null
  bank_address: string | null
  additional_info: string | null
  flag: string | null
  sort_order: number
  is_active: boolean
}

export async function getBankAccounts(currency?: string): Promise<BankAccountRow[]> {
  const pool = getPool()
  try {
    let query = 'SELECT * FROM bank_accounts WHERE is_active = true'
    const params: any[] = []

    if (currency) {
      query += ' AND currency = $1'
      params.push(currency)
    }

    query += ' ORDER BY sort_order'

    const result = await pool.query(query, params)
    return result.rows
  } catch {
    return []
  }
}

// ============================================
// Shipping 查询
// ============================================

export interface ShippingMethodRow {
  id: string
  code: string
  name: string
  transit_days: number
  sort_order: number
  is_active: boolean
}

export interface ShippingRateRow {
  id: string
  shipping_method_id: string
  country_code: string
  base_weight: number
  base_rate: number
  additional_rate: number
  handling_fee: number
  is_active: boolean
}

export interface FreeShippingRuleRow {
  id: string
  shipping_method_id: string
  country_code: string | null
  minimum_amount: number
  is_active: boolean
}

export async function getShippingMethods(): Promise<ShippingMethodRow[]> {
  const pool = getPool()
  try {
    const result = await pool.query(
      `SELECT * FROM shipping_methods WHERE is_active = true ORDER BY sort_order`
    )
    return result.rows
  } catch {
    return []
  }
}

export async function getShippingRates(methodId?: string, countryCode?: string): Promise<ShippingRateRow[]> {
  const pool = getPool()
  try {
    let query = 'SELECT * FROM shipping_rates WHERE is_active = true'
    const params: any[] = []
    let paramIndex = 1

    if (methodId) {
      query += ` AND shipping_method_id::text = $${paramIndex}`
      params.push(methodId)
      paramIndex++
    }

    if (countryCode) {
      query += ` AND (country_code = $${paramIndex} OR country_code = 'OTHER')`
      params.push(countryCode)
    }

    const result = await pool.query(query, params)
    return result.rows
  } catch {
    return []
  }
}

export async function getFreeShippingRules(): Promise<FreeShippingRuleRow[]> {
  const pool = getPool()
  try {
    const result = await pool.query(
      `SELECT * FROM free_shipping_rules WHERE is_active = true`
    )
    return result.rows
  } catch {
    return []
  }
}

export async function getProductShippingInfo(productId: string): Promise<{
  weight: number
  processingTime: number
} | null> {
  const pool = getPool()
  try {
    const result = await pool.query(
      `SELECT shipping_info FROM products WHERE id::text = $1 OR sku = $1 LIMIT 1`,
      [productId]
    )
    if (result.rows.length > 0 && result.rows[0].shipping_info) {
      const info = result.rows[0].shipping_info as any
      return {
        weight: info?.weight || 0,
        processingTime: info?.processingTime ?? 3,
      }
    }
    return { weight: 0, processingTime: 3 }
  } catch {
    return { weight: 0, processingTime: 3 }
  }
}

// ============================================
// 产品推荐查询
// ============================================

export interface ProductRecommendRow {
  id: string
  name: string
  slug: string
  sku: string
  short_description: string | null
  primary_category_id: string | null
  brand_id: string | null
  industries: string[] | null
  pricing: any | null
  external_image_url: string | null
  primary_image_id: string | null
  status: string
}

export async function getProductById(productId: string): Promise<ProductRecommendRow | null> {
  const pool = getPool()
  try {
    const result = await pool.query(
      `SELECT id, name, slug, sku, short_description, primary_category_id, brand_id,
              industries, pricing, external_image_url, primary_image_id, status
       FROM products
       WHERE (id::text = $1 OR sku = $1) AND status = 'published'
       LIMIT 1`,
      [productId]
    )
    return result.rows[0] || null
  } catch {
    return null
  }
}

export async function getProductsByIndustries(
  industries: string[],
  excludeIds: string[],
  excludeCategoryId?: string,
  limit?: number
): Promise<ProductRecommendRow[]> {
  const pool = getPool()
  try {
    const params: any[] = ['published', industries]
    let paramIndex = 3

    let whereClause = `status = $1 AND industries && $2::text[]`
    if (excludeIds.length > 0) {
      whereClause += ` AND id::text NOT IN ($${paramIndex}::text[])`
      params.push(excludeIds)
      paramIndex++
    }
    if (excludeCategoryId) {
      whereClause += ` AND primary_category_id::text != $${paramIndex}`
      params.push(excludeCategoryId)
      paramIndex++
    }

    const result = await pool.query(
      `SELECT id, name, slug, sku, short_description, primary_category_id, brand_id,
              industries, pricing, external_image_url, primary_image_id, status
       FROM products
       WHERE ${whereClause}
       ORDER BY created_at DESC
       LIMIT $${paramIndex}`,
      [...params, limit || 20]
    )
    return result.rows
  } catch {
    return []
  }
}

export async function getProductsByCategory(
  categoryId: string,
  excludeIds: string[],
  limit?: number
): Promise<ProductRecommendRow[]> {
  const pool = getPool()
  try {
    const params: any[] = ['published', categoryId]
    let paramIndex = 3

    let whereClause = `status = $1 AND primary_category_id::text = $2`
    if (excludeIds.length > 0) {
      whereClause += ` AND id::text NOT IN ($${paramIndex}::text[])`
      params.push(excludeIds)
      paramIndex++
    }

    const result = await pool.query(
      `SELECT id, name, slug, sku, short_description, primary_category_id, brand_id,
              industries, pricing, external_image_url, primary_image_id, status
       FROM products
       WHERE ${whereClause}
       ORDER BY created_at DESC
       LIMIT $${paramIndex}`,
      [...params, limit || 10]
    )
    return result.rows
  } catch {
    return []
  }
}

export async function getProductsByIds(ids: string[]): Promise<ProductRecommendRow[]> {
  const pool = getPool()
  try {
    if (ids.length === 0) return []
    const result = await pool.query(
      `SELECT id, name, slug, sku, short_description, primary_category_id, brand_id,
              industries, pricing, external_image_url, primary_image_id, status
       FROM products
       WHERE id::text IN ($1::text[]) AND status = 'published'`,
      [ids]
    )
    return result.rows
  } catch {
    return []
  }
}

// ============================================
// 订单产品关联查询 (用于 bought-together)
// ============================================

export async function getOrdersContainingProduct(productId: string, limit?: number): Promise<{
  order_id: string
  items: any[]
}[]> {
  const pool = getPool()
  try {
    // 查询包含指定产品的订单（排除已取消/已退款）
    const result = await pool.query(
      `SELECT id as order_id, items, status
       FROM orders
       WHERE status NOT IN ('cancelled', 'refunded')
       AND items::text LIKE $1
       ORDER BY created_at DESC
       LIMIT $2`,
      [`%"product"%${productId}%`, limit || 200]
    )

    // 过滤实际包含该产品的订单
    const filtered = result.rows.filter(row => {
      try {
        const items = row.items as any[] || []
        return items.some(item => {
          const prodId = typeof item.product === 'object' ? item.product?.id : item.product
          return prodId === productId || String(prodId) === productId
        })
      } catch {
        return false
      }
    })

    return filtered.map(row => ({
      order_id: row.order_id,
      items: row.items
    }))
  } catch {
    return []
  }
}

// ============================================
// 分类信息查询 (用于推荐理由)
// ============================================

export async function getCategoryById(categoryId: string): Promise<{ id: string; name: string; slug: string } | null> {
  const pool = getPool()
  try {
    const result = await pool.query(
      `SELECT id, name, slug FROM categories WHERE id::text = $1 LIMIT 1`,
      [categoryId]
    )
    return result.rows[0] || null
  } catch {
    return null
  }
}

export async function getCategoryByProductId(productId: string): Promise<{ id: string; name: string; slug: string } | null> {
  const pool = getPool()
  try {
    const result = await pool.query(
      `SELECT c.id, c.name, c.slug
       FROM categories c
       JOIN products p ON p.primary_category_id::text = c.id::text
       WHERE p.id::text = $1 OR p.sku = $1
       LIMIT 1`,
      [productId]
    )
    return result.rows[0] || null
  } catch {
    return null
  }
}