import { NextResponse } from 'next/server'
import { Pool } from 'pg'

export const dynamic = 'force-dynamic'

export async function GET() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URI,
    max: 1,
  })

  try {
    // 测试连接
    const testResult = await pool.query('SELECT COUNT(*) FROM products')
    const totalProducts = testResult.rows[0].count

    // 测试特定分类
    const catResult = await pool.query(`
      SELECT COUNT(*) FROM products
      WHERE primary_category_id = 'c32990b6-6dd3-4091-ba60-032d4d0eb987'::uuid
    `)
    const catProducts = catResult.rows[0].count

    await pool.end()

    return NextResponse.json({
      success: true,
      totalProducts,
      surfaceProtectionTapeProducts: catProducts,
      databaseUriExists: !!process.env.DATABASE_URI,
      usePostgres: process.env.USE_POSTGRES,
    })
  } catch (error) {
    await pool.end()
    return NextResponse.json({
      success: false,
      error: String(error),
      databaseUriExists: !!process.env.DATABASE_URI,
    }, { status: 500 })
  }
}