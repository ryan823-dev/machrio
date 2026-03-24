const { Pool } = require('pg');

const POOL_CONFIG = {
  connectionString: 'postgresql://postgres.yderhgkjcsaqrsfntpqm:Machrio%402026@aws-1-ap-northeast-1.pooler.supabase.com:5432/postgres',
  max: 2,
  idleTimeoutMillis: 5000,
}

async function fixUsersTable() {
  const pool = new Pool(POOL_CONFIG)
  
  try {
    console.log('🔧 修复 users 表...\n')
    
    // 添加 role 列
    console.log('📝 添加 role 列...')
    await pool.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS role text DEFAULT 'editor'
    `)
    console.log('   ✅\n')
    
    // 添加 name 列（如果不存在）
    console.log('📝 添加 name 列...')
    await pool.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS name text
    `)
    console.log('   ✅\n')
    
    console.log('✅ users 表修复完成！')
    
  } catch (err) {
    console.error('❌ 错误:', err.message)
    throw err
  } finally {
    await pool.end()
  }
}

fixUsersTable().catch(console.error)
