/**
 * 自动修复数据库 schema - 在构建时运行
 * 这个脚本会在 Vercel 部署时自动执行
 */

const { Pool } = require('pg');

async function autoFixDB() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URI,
    max: 1,
    idleTimeoutMillis: 10000,
  });
  
  try {
    console.log('🔧 Auto-fixing database schema...');
    
    // Fix users table
    await pool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS role text DEFAULT \'editor\'');
    await pool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS name text');
    
    // Initialize globals
    await pool.query(`
      INSERT INTO homepage (id, _created_at, _updated_at) 
      SELECT gen_random_uuid(), NOW(), NOW()
      WHERE NOT EXISTS (SELECT 1 FROM homepage)
    `);
    
    await pool.query(`
      INSERT INTO site_settings (id, _created_at, _updated_at) 
      SELECT gen_random_uuid(), NOW(), NOW()
      WHERE NOT EXISTS (SELECT 1 FROM site_settings)
    `);
    
    await pool.query(`
      INSERT INTO navigation (id, _created_at, _updated_at) 
      SELECT gen_random_uuid(), NOW(), NOW()
      WHERE NOT EXISTS (SELECT 1 FROM navigation)
    `);
    
    console.log('✅ Database schema fixed!');
    
  } catch (err) {
    console.error('⚠️  Auto-fix skipped (will run on first request):', err.message);
  } finally {
    await pool.end();
  }
}

// Run if executed directly
if (require.main === module) {
  autoFixDB().catch(console.error);
}

module.exports = { autoFixDB };
