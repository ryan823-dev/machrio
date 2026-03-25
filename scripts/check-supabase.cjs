const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres:Machrio%402026@db.yderhgkjcsaqrsfntpqm.supabase.co:5432/postgres',
  max: 1,
});

async function checkDatabase() {
  const client = await pool.connect();
  try {
    console.log('检查 Supabase 数据库...\n');

    // L1 分类
    const l1Result = await client.query(`
      SELECT id, name, slug, display_order
      FROM categories
      WHERE parent_id IS NULL
      ORDER BY display_order NULLS LAST, name
    `);
    console.log(`L1 分类 (${l1Result.rows.length} 个):`);
    l1Result.rows.forEach((cat, idx) => {
      console.log(`  ${idx + 1}. ${cat.name} (slug: ${cat.slug})`);
    });

    // Products 统计
    const totalProducts = await client.query('SELECT COUNT(*) as count FROM products');
    console.log(`\n产品总数: ${totalProducts.rows[0].count}`);

    const withCategory = await client.query('SELECT COUNT(*) as count FROM products WHERE primary_category_id IS NOT NULL');
    console.log(`有主分类的产品: ${withCategory.rows[0].count}`);

  } catch (err) {
    console.error('错误:', err.message);
  } finally {
    client.release();
    await pool.end();
  }
}

checkDatabase();
