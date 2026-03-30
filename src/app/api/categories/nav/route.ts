import { NextResponse } from 'next/server'
import { getPool } from '@/lib/db'

// 从数据库获取导航分类数据（实时数据）
export async function GET() {
  try {
    const pool = getPool()

    // 获取所有分类，按层级组织
    const result = await pool.query(`
      SELECT id, name, slug, parent_id, display_order
      FROM categories
      ORDER BY display_order, name
    `)

    // 构建树形结构
    const categoriesMap = new Map()
    const rootCategories: any[] = []

    for (const row of result.rows) {
      categoriesMap.set(row.id, {
        id: row.id,
        name: row.name,
        slug: row.slug,
        children: []
      })
    }

    for (const row of result.rows) {
      const node = categoriesMap.get(row.id)
      if (row.parent_id) {
        const parent = categoriesMap.get(row.parent_id)
        if (parent) {
          parent.children.push(node)
        }
      } else {
        rootCategories.push(node)
      }
    }

    return NextResponse.json({ categories: rootCategories }, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
      },
    })
  } catch (error) {
    console.error('Nav categories error:', error)
    return NextResponse.json({ categories: [] })
  }
}