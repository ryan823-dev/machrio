const { Pool } = require('pg')
const fs = require('fs')
const path = require('path')

async function executeFix() {
  const pool = new Pool({
    connectionString: 'postgresql://postgres.yderhgkjcsaqrsfntpqm:Machrio%402026@aws-1-ap-northeast-1.pooler.supabase.com:6543/postgres',
    max: 2,
    idleTimeoutMillis: 5000,
  })

  try {
    // 读取 SQL 文件
    const sqlPath = path.join(__dirname, 'fix-categories-faq.sql')
    const sql = fs.readFileSync(sqlPath, 'utf-8')
    
    console.log('正在执行 SQL 修复...')
    
    // 执行 SQL
    await pool.query(sql)
    
    console.log('✅ 修复完成！')
    
    // 验证表是否创建成功
    const result = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'categories_faq'
      )
    `)
    
    console.log('categories_faq 表是否存在:', result.rows[0].exists ? '是' : '否')
    
  } catch (error) {
    console.error('❌ 错误:', error.message)
  } finally {
    await pool.end()
  }
}

executeFix()
