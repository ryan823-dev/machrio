/**
 * 检查数据库中实际存在的分类
 */

import { Pool } from 'pg'

async function checkCategories() {
  // 创建数据库连接池
  const pool = new Pool({
    connectionString: process.env.DATABASE_URI,
    max: 2,
    idleTimeoutMillis: 3000,
    connectionTimeoutMillis: 3000,
  })

  try {
    console.log('🔍 查询数据库中的分类...\n')

    // 查询所有已发布的分类
    const result = await pool.query(`
      SELECT id, name, slug, is_published, display_order, parent_id
      FROM categories
      WHERE is_published = true
      ORDER BY display_order
    `)

    console.log(`✅ 找到 ${result.rows.length} 个已发布的分类:\n`)
    
    const slugs: string[] = []
    result.rows.forEach((row, index) => {
      console.log(`${(index + 1).toString().padStart(2)}. ${row.name.padEnd(40)} -> ${row.slug}`)
      slugs.push(row.slug)
    })

    console.log(`\n📋 所有分类 slug 列表:`)
    console.log(JSON.stringify(slugs, null, 2))

    // 检查 Industry 页面中使用的分类 slug
    const industrySlugs = [
      'safety',
      'cleaning-janitorial',
      'packaging-shipping',
      'adhesives-sealants-tape',
      'power-transmission',
      'material-handling',
      'tool-storage-workbenches',
      'fasteners',
      'electrical',
    ]

    console.log(`\n🔍 检查 Industry 页面中使用的分类:`)
    industrySlugs.forEach(slug => {
      const exists = slugs.includes(slug)
      console.log(`${exists ? '✅' : '❌'} ${slug.padEnd(30)} ${exists ? '' : '(不存在)'}`)
    })

  } catch (error) {
    console.error('❌ 查询失败:', error)
  } finally {
    await pool.end()
  }
}

checkCategories()
