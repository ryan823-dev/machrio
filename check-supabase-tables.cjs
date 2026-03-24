const { Pool } = require('pg');

async function checkTables() {
  const pool = new Pool({
    connectionString: 'postgresql://postgres.yderhgkjcsaqrsfntpqm:Machrio%402026@aws-1-ap-northeast-1.pooler.supabase.com:6543/postgres',
    max: 5,
    idleTimeoutMillis: 30000,
  });

  try {
    console.log('检查 Supabase 数据库表...\n');
    
    // 获取所有表
    const result = await pool.query(`
      SELECT table_name, table_schema 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    
    console.log('数据库中的表:');
    result.rows.forEach(row => {
      console.log(`  - ${row.table_schema}.${row.table_name}`);
    });
    
    // 检查是否缺少 categories_faq 表
    const hasCategoriesFaq = result.rows.some(r => r.table_name === 'categories_faq');
    console.log(`\ncategories_faq 表：${hasCategoriesFaq ? '✅ 存在' : '❌ 不存在'}`);
    
    // 检查 categories 表
    const hasCategories = result.rows.some(r => r.table_name === 'categories');
    console.log(`categories 表：${hasCategories ? '✅ 存在' : '❌ 不存在'}`);
    
    // 检查 products 表
    const hasProducts = result.rows.some(r => r.table_name === 'products');
    console.log(`products 表：${hasProducts ? '✅ 存在' : '❌ 不存在'}`);
    
  } catch (error) {
    console.error('错误:', error.message);
  } finally {
    await pool.end();
  }
}

checkTables();
