/**
 * 快速批量迁移产品分类
 * 使用 SQL 批量更新而不是逐个更新
 */

const mongoose = require('mongoose');
const { Pool } = require('pg');

const MONGODB_URI = 'mongodb+srv://mroworks_db_user:moore1982@mroworks-dev.gbqxebq.mongodb.net/machrio'
const POOL_CONFIG = {
  connectionString: 'postgresql://postgres.yderhgkjcsaqrsfntpqm:Machrio%402026@aws-1-ap-northeast-1.pooler.supabase.com:5432/postgres',
  max: 5,
  idleTimeoutMillis: 10000,
}

async function fastMigrate() {
  console.log('🚀 快速迁移产品分类...\n')
  
  await mongoose.connect(MONGODB_URI)
  const db = mongoose.connection
  const mongoProducts = db.collection('products')
  const mongoCategories = db.collection('categories')
  
  const pool = new Pool(POOL_CONFIG)
  
  try {
    // 1. 获取 MongoDB 分类映射
    console.log('📊 获取 MongoDB 分类...')
    const mongoCats = await mongoCategories.find({}, { projection: { _id: 1, slug: 1 } }).toArray()
    const mongoCatMap = new Map()
    mongoCats.forEach(cat => mongoCatMap.set(cat._id.toString(), cat.slug))
    console.log(`   ${mongoCatMap.size} 个分类\n`)
    
    // 2. 获取 PostgreSQL 分类映射
    console.log('📊 获取 PostgreSQL 分类...')
    const pgCatsResult = await pool.query('SELECT id, slug FROM categories')
    const pgCatMap = new Map()
    pgCatsResult.rows.forEach(cat => pgCatMap.set(cat.slug, cat.id))
    console.log(`   ${pgCatMap.size} 个分类\n`)
    
    // 3. 获取 MongoDB 所有产品
    console.log('📊 获取 MongoDB 产品...')
    const mongoProds = await mongoProducts.find({
      primaryCategory: { $exists: true, $ne: null }
    }, {
      projection: { slug: 1, primaryCategory: 1 }
    }).toArray()
    console.log(`   ${mongoProds.length} 个产品\n`)
    
    // 4. 构建批量更新数据
    console.log('🔄 准备更新数据...')
    const updates = []
    
    for (const prod of mongoProds) {
      const mongoCatId = prod.primaryCategory.toString()
      const catSlug = mongoCatMap.get(mongoCatId)
      if (!catSlug) continue
      
      const pgCatId = pgCatMap.get(catSlug)
      if (!pgCatId) continue
      
      updates.push({ slug: prod.slug, categoryId: pgCatId })
    }
    
    console.log(`   可迁移：${updates.length} 个产品\n`)
    
    // 5. 使用 SQL 批量更新
    console.log('📝 执行批量更新...')
    
    // 创建临时表
    await pool.query(`
      CREATE TEMP TABLE temp_product_categories (
        slug text,
        category_id uuid
      ) ON COMMIT DROP
    `)
    console.log('   ✓ 创建临时表')
    
    // 批量插入临时表
    const insertValues = updates.map((u, i) => `($${i * 2 + 1}, $${i * 2 + 2})`).join(', ')
    const insertParams = updates.flatMap(u => [u.slug, u.categoryId])
    
    await pool.query(`INSERT INTO temp_product_categories (slug, category_id) VALUES ${insertValues}`, insertParams)
    console.log(`   ✓ 插入 ${updates.length} 条记录到临时表`)
    
    // 批量更新主表
    const updateResult = await pool.query(`
      UPDATE products p
      SET primary_category_id = t.category_id
      FROM temp_product_categories t
      WHERE p.slug = t.slug
    `)
    console.log(`   ✓ 更新了 ${updateResult.rowCount} 个产品\n`)
    
    // 6. 验证结果
    console.log('📊 验证结果...')
    const verifyResult = await pool.query(`
      SELECT COUNT(*) as total, COUNT(primary_category_id) as with_category 
      FROM products
    `)
    console.log(`   总产品数：${verifyResult.rows[0].total}`)
    console.log(`   有分类的产品：${verifyResult.rows[0].with_category}`)
    console.log(`   覆盖率：${((verifyResult.rows[0].with_category / verifyResult.rows[0].total) * 100).toFixed(1)}%\n`)
    
    // 7. 抽样检查
    console.log('🔍 抽样验证...')
    const sampleResult = await pool.query(`
      SELECT p.slug, p.sku, c.name as category_name
      FROM products p
      INNER JOIN categories c ON p.primary_category_id = c.id
      LIMIT 5
    `)
    sampleResult.rows.forEach(row => {
      console.log(`   - ${row.sku}: ${row.category_name}`)
    })
    
  } catch (err) {
    console.error('❌ 错误:', err)
    throw err
  } finally {
    await mongoose.disconnect()
    await pool.end()
    console.log('\n✅ 完成')
  }
}

fastMigrate().catch(console.error)
