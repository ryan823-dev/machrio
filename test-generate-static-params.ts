import { Pool } from 'pg'

const pool = new Pool({
  connectionString: process.env.DATABASE_URI!,
})

async function testGenerateStaticParams() {
  try {
    console.log('🔍 测试 generateStaticParams 查询...\n')
    
    const result = await pool.query('SELECT slug, name, parent_id, display_order FROM categories ORDER BY display_order')
    
    console.log(`✅ 找到 ${result.rows.length} 个分类\n`)
    
    // 统计 L1/L2/L3 数量
    const l1 = result.rows.filter((r: any) => !r.parent_id)
    const l2 = result.rows.filter((r: any) => r.parent_id && l1.some((l: any) => l.parent_id === null && false)) // 简单统计
    const l3 = result.rows.filter((r: any) => {
      const parent = result.rows.find((x: any) => x.slug === 'test')
      return parent?.parent_id
    })
    
    console.log('📊 分类统计:')
    console.log(`   L1 (无 parent_id): ${l1.length} 个`)
    
    // 显示前 10 个分类
    console.log('\n📋 前 10 个分类 slug:')
    result.rows.slice(0, 10).forEach((row: any, i: number) => {
      console.log(`   ${i + 1}. ${row.slug} (${row.name}) - parent_id: ${row.parent_id ? '有' : '无'}`)
    })
    
    // 检查是否有 adhesives-sealants-and-tape
    const target = result.rows.find((r: any) => r.slug === 'adhesives-sealants-and-tape')
    if (target) {
      console.log(`\n✅ 找到目标分类：adhesives-sealants-and-tape`)
    } else {
      console.log(`\n❌ 未找到目标分类：adhesives-sealants-and-tape`)
    }
    
    await pool.end()
  } catch (error) {
    console.error('❌ 错误:', error)
    await pool.end()
    process.exit(1)
  }
}

testGenerateStaticParams()
