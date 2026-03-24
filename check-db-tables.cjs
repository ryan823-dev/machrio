const { Pool } = require('pg')

async function checkTables() {
  const pool = new Pool({
    connectionString: 'postgresql://postgres.yderhgkjcsaqrsfntpqm:Machrio%402026@aws-1-ap-northeast-1.pooler.supabase.com:6543/postgres',
    max: 2,
    idleTimeoutMillis: 5000,
  })

  try {
    // 检查所有表
    const tables = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `)
    
    console.log('=== 数据库表列表 ===')
    tables.rows.forEach(row => console.log(row.table_name))
    
    // 检查 categories 表结构
    const columns = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'categories' 
      ORDER BY ordinal_position
    `)
    
    console.log('\n=== categories 表结构 ===')
    columns.rows.forEach(row => console.log(`${row.column_name}: ${row.data_type}`))
    
    // 检查 categories_faq 表是否存在
    const faqTable = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'categories_faq'
      )
    `)
    
    console.log('\n=== categories_faq 表是否存在 ===')
    console.log(faqTable.rows[0].exists ? '存在' : '不存在')
    
    // 检查分类数量
    const count = await pool.query('SELECT COUNT(*) FROM categories')
    console.log('\n=== 分类数量 ===')
    console.log(count.rows[0].count)
    
  } catch (error) {
    console.error('错误:', error.message)
  } finally {
    await pool.end()
  }
}

checkTables()
