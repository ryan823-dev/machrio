const { Pool } = require('pg')

const pool = new Pool({
  connectionString: process.env.DATABASE_URI,
})

async function checkL1Children() {
  try {
    // 获取 L1 分类
    const l1Result = await pool.query(
      "SELECT id, name, slug FROM categories WHERE slug = 'adhesives-sealants-and-tape'"
    )
    
    if (l1Result.rows.length === 0) {
      console.log('❌ 找不到 L1 分类：adhesives-sealants-and-tape')
      return
    }
    
    const l1 = l1Result.rows[0]
    console.log('✅ L1 分类:', l1.name, '(ID:', l1.id, ')')
    
    // 查询 L2 子分类
    const l2Result = await pool.query(
      'SELECT id, name, slug, parent_id FROM categories WHERE parent_id = $1 ORDER BY display_order LIMIT 10',
      [l1.id]
    )
    
    console.log(`\n📊 找到 ${l2Result.rows.length} 个 L2 子分类:`)
    l2Result.rows.forEach((l2, i) => {
      console.log(`  ${i + 1}. ${l2.name} (slug: ${l2.slug}, parent_id: ${l2.parent_id})`)
    })
    
    // 检查是否有 L2 分类的 parent_id 为 NULL
    const nullParentCheck = await pool.query(
      "SELECT id, name, slug FROM categories WHERE parent_id IS NULL LIMIT 5"
    )
    console.log(`\n❓ parent_id 为 NULL 的分类（可能是 L1）: ${nullParentCheck.rows.length} 个`)
    
    await pool.end()
  } catch (error) {
    console.error('❌ 错误:', error.message)
    await pool.end()
    process.exit(1)
  }
}

checkL1Children()
