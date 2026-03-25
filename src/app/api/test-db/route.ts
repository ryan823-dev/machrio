import { NextResponse } from 'next/server'
import { Pool } from 'pg'

export const dynamic = 'force-dynamic'

export async function GET() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URI,
    max: 1,
  })

  try {
    // 测试1：总产品数
    const testResult = await pool.query('SELECT COUNT(*) FROM products')
    const totalProducts = testResult.rows[0].count

    // 测试2：检查 products 表结构
    const columnsResult = await pool.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'products'
      ORDER BY ordinal_position
    `)

    // 测试3：检查是否有 primary_category_id 列
    const hasPrimaryCategoryId = columnsResult.rows.some(
      (row) => row.column_name === 'primary_category_id'
    )

    // 测试4：检查该分类的产品（多种方式）
    const categoryId = 'c32990b6-6dd3-4091-ba60-032d4d0eb987'

    // 方式A：使用 ::uuid
    const countA = await pool.query(
      'SELECT COUNT(*) FROM products WHERE primary_category_id = $1::uuid',
      [categoryId]
    )

    // 方式B：不使用 ::uuid
    const countB = await pool.query(
      'SELECT COUNT(*) FROM products WHERE primary_category_id = $1',
      [categoryId]
    )

    // 方式C：字符串插值
    const countC = await pool.query(
      `SELECT COUNT(*) FROM products WHERE primary_category_id = '${categoryId}'::uuid`
    )

    // 测试5：检查该分类是否存在
    const categoryResult = await pool.query(
      `SELECT id::text, name, slug FROM categories WHERE id = $1::uuid`,
      [categoryId]
    )

    // 测试6：获取该分类的前 5 个产品
    const sampleProducts = await pool.query(`
      SELECT id::text, name, slug, primary_category_id::text
      FROM products
      WHERE primary_category_id = $1::uuid
      LIMIT 5
    `, [categoryId])

    // 测试7：检查所有不同的 primary_category_id 值
    const distinctCategories = await pool.query(`
      SELECT DISTINCT primary_category_id::text, COUNT(*) as count
      FROM products
      GROUP BY primary_category_id
      ORDER BY count DESC
      LIMIT 10
    `)

    // 测试8：检查 categories 表结构
    const categoryColumns = await pool.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'categories'
      ORDER BY ordinal_position
    `)

    // 测试9：获取一个分类的 SEO 字段
    const seoTest = await pool.query(`
      SELECT id::text, name, slug,
             short_description, shortdescription,
             intro_content, introcontent,
             description,
             buying_guide, buyingguide,
             seo_content, seocontent,
             faq
      FROM categories
      WHERE slug = 'adhesives-sealants-and-tape'
      LIMIT 1
    `)

    await pool.end()

    return NextResponse.json({
      success: true,
      tests: {
        totalProducts,
        hasPrimaryCategoryId,
        countWithUuidCast: countA.rows[0].count,
        countWithoutCast: countB.rows[0].count,
        countStringInterpolation: countC.rows[0].count,
      },
      category: categoryResult.rows[0] || null,
      sampleProducts: sampleProducts.rows,
      distinctCategories: distinctCategories.rows,
      columns: columnsResult.rows.map(r => `${r.column_name} (${r.data_type})`),
    })
  } catch (error) {
    await pool.end()
    return NextResponse.json({
      success: false,
      error: String(error),
      stack: error instanceof Error ? error.stack : undefined,
    }, { status: 500 })
  }
}