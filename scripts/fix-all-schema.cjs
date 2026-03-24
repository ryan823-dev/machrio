const { Pool } = require('pg');

const POOL_CONFIG = {
  connectionString: 'postgresql://postgres.yderhgkjcsaqrsfntpqm:Machrio%402026@aws-1-ap-northeast-1.pooler.supabase.com:5432/postgres',
  max: 1,
  idleTimeoutMillis: 30000,
}

async function fixAllSchema() {
  const pool = new Pool(POOL_CONFIG)
  const client = await pool.connect()
  
  try {
    console.log('🔧 开始修复数据库 schema...\n')
    
    // 1. users 表
    console.log('📝 修复 users 表...')
    await client.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS role text DEFAULT \\'editor\\'')
    await client.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS name text')
    console.log('   ✅ users\n')
    
    // 2. 确保所有 Global 表有数据
    console.log('📝 初始化 Global 表数据...')
    await client.query(`INSERT INTO homepage (id, _created_at, _updated_at) SELECT gen_random_uuid(), NOW(), NOW() WHERE NOT EXISTS (SELECT 1 FROM homepage)`)
    await client.query(`INSERT INTO site_settings (id, _created_at, _updated_at) SELECT gen_random_uuid(), NOW(), NOW() WHERE NOT EXISTS (SELECT 1 FROM site_settings)`)
    await client.query(`INSERT INTO navigation (id, _created_at, _updated_at) SELECT gen_random_uuid(), NOW(), NOW() WHERE NOT EXISTS (SELECT 1 FROM navigation)`)
    console.log('   ✅ Globals\n')
    
    // 3. 检查 categories 表的关键列
    console.log('📝 检查 categories 表...')
    await client.query('ALTER TABLE categories ADD COLUMN IF NOT EXISTS display_order integer DEFAULT 0')
    console.log('   ✅ categories\n')
    
    console.log('✅ 所有修复完成！')
    
  } catch (err) {
    console.error('❌ 错误:', err.message)
    console.error(err)
    throw err
  } finally {
    client.release()
    await pool.end()
  }
}

fixAllSchema().catch(console.error)
