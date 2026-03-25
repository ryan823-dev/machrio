import { Pool } from 'pg'

const pool = new Pool({
  connectionString: process.env.DATABASE_URI!,
})

async function testL1Children() {
  try {
    console.log('🔍 查询 L1 分类：adhesives-sealants-and-tape\n')
    
    // 获取 L1 分类
    const l1Result = await pool.query(
      "SELECT id, name, slug FROM categories WHERE slug = 'adhesives-sealants-and-tape'"
    )
    
    if (l1Result.rows.length === 0) {
      console.log('❌ 找不到 L1 分类')
      await pool.end()
      return
    }
    
    const l1 = l1Result.rows[0]
    console.log('✅ L1 分类:', l1.name)
    console.log('   ID:', l1.id)
    console.log('   Slug:', l1.slug)
    
    // 查询 L2 子分类
    const l2Result = await pool.query(
      'SELECT id, name, slug, parent_id, display_order FROM categories WHERE parent_id = $1 ORDER BY display_order LIMIT 20',
      [l1.id]
    )
    
    console.log(`\n📊 找到 ${l2Result.rows.length} 个 L2 子分类:`)
    
    if (l2Result.rows.length === 0) {
      console.log('⚠️  没有找到子分类！')
      
      // 检查是否有其他 L1 分类有子分类
      const checkOtherL1 = await pool.query(
        'SELECT c1.slug, c1.name, COUNT(c2.id) as child_count FROM categories c1 LEFT JOIN categories c2 ON c1.id = c2.parent_id WHERE c1.parent_id IS NULL GROUP BY c1.id, c1.name, c1.slug ORDER BY child_count DESC LIMIT 5'
      )
      console.log('\n📋 其他 L1 分类的子分类数量:')
      checkOtherL1.rows.forEach((row) => {
        console.log(`   - ${row.name} (${row.slug}): ${row.child_count} 个子分类`)
      })
    } else {
      l2Result.rows.forEach((l2, i) => {
        console.log(`   ${i + 1}. ${l2.name}`)
        console.log(`      Slug: ${l2.slug}`)
        console.log(`      ID: ${l2.id}`)
        console.log(`      Parent ID: ${l2.parent_id}`)
        console.log(`      Display Order: ${l2.display_order}`)
      })
    }
    
    await pool.end()
  } catch (error) {
    console.error('❌ 错误:', error)
    await pool.end()
    process.exit(1)
  }
}

testL1Children()
