/**
 * 最终方案：使用 SKU 匹配迁移产品分类
 */

const mongoose = require('mongoose');
const { Pool } = require('pg');

const MONGODB_URI = 'mongodb+srv://mroworks_db_user:moore1982@mroworks-dev.gbqxebq.mongodb.net/machrio'
const POOL_CONFIG = {
  connectionString: 'postgresql://postgres.yderhgkjcsaqrsfntpqm:Machrio%402026@aws-1-ap-northeast-1.pooler.supabase.com:5432/postgres',
  max: 1,
  idleTimeoutMillis: 30000,
}

async function finalMigrate() {
  console.log('🚀 使用 SKU 匹配迁移产品分类...\n')
  
  await mongoose.connect(MONGODB_URI)
  const db = mongoose.connection
  const mongoProducts = db.collection('products')
  const mongoCategories = db.collection('categories')
  
  const pool = new Pool(POOL_CONFIG)
  const client = await pool.connect()
  
  try {
    // 1. 获取分类映射
    console.log('📊 加载分类映射...')
    const mongoCats = await mongoCategories.find({}, { projection: { _id: 1, slug: 1 } }).toArray()
    const mongoCatMap = new Map()
    mongoCats.forEach(cat => mongoCatMap.set(cat._id.toString(), cat.slug))
    
    const pgCatsResult = await client.query('SELECT id, slug FROM categories')
    const pgCatMap = new Map()
    pgCatsResult.rows.forEach(cat => pgCatMap.set(cat.slug, cat.id))
    console.log(`   MongoDB: ${mongoCatMap.size}, PostgreSQL: ${pgCatMap.size}\n`)
    
    // 2. 获取 MongoDB 产品（按 SKU 匹配）
    console.log('📊 加载 MongoDB 产品...')
    const mongoProds = await mongoProducts.find({
      primaryCategory: { $exists: true, $ne: null }
    }, { projection: { sku: 1, primaryCategory: 1 } }).toArray()
    console.log(`   ${mongoProds.length} 个产品\n`)
    
    // 3. 准备数据
    console.log('🔄 准备更新数据...')
    const updates = []
    for (const prod of mongoProds) {
      const catSlug = mongoCatMap.get(prod.primaryCategory.toString())
      if (!catSlug) continue
      const pgCatId = pgCatMap.get(catSlug)
      if (!pgCatId) continue
      updates.push({ sku: prod.sku, categoryId: pgCatId })
    }
    console.log(`   可迁移：${updates.length} 个\n`)
    
    // 4. 分批执行
    const BATCH_SIZE = 1000
    let totalUpdated = 0
    
    console.log('📝 开始批量更新...')
    for (let i = 0; i < updates.length; i += BATCH_SIZE) {
      const batch = updates.slice(i, i + BATCH_SIZE)
      const values = batch.map((u, idx) => `($${idx * 2 + 1}, $${idx * 2 + 2})`).join(', ')
      const params = batch.flatMap(u => [u.sku, u.categoryId])
      
      const result = await client.query(`
        UPDATE products p
        SET primary_category_id = v.category_id::uuid
        FROM (VALUES ${values}) AS v(sku, category_id)
        WHERE p.sku = v.sku
      `, params)
      
      totalUpdated += result.rowCount
      console.log(`   批次 ${Math.floor(i/BATCH_SIZE)+1}: 更新 ${result.rowCount} 个产品 (累计：${totalUpdated})`)
    }
    
    console.log(`\n✅ 总共更新：${totalUpdated} 个产品\n`)
    
    // 5. 验证
    console.log('📊 验证结果...')
    const verify = await client.query(`
      SELECT COUNT(*) as total, COUNT(primary_category_id) as with_category 
      FROM products
    `)
    console.log(`   总产品：${verify.rows[0].total}`)
    console.log(`   有分类：${verify.rows[0].with_category}`)
    console.log(`   覆盖率：${((verify.rows[0].with_category / verify.rows[0].total) * 100).toFixed(1)}%\n`)
    
    // 6. 抽样
    console.log('🔍 抽样验证...')
    const sample = await client.query(`
      SELECT p.sku, p.slug, c.name as category_name
      FROM products p
      INNER JOIN categories c ON p.primary_category_id = c.id
      LIMIT 5
    `)
    sample.rows.forEach(row => {
      console.log(`   - ${row.sku}: ${row.category_name}`)
    })
    
  } catch (err) {
    console.error('❌ 错误:', err)
    throw err
  } finally {
    client.release()
    await mongoose.disconnect()
    await pool.end()
    console.log('\n✅ 完成')
  }
}

finalMigrate().catch(console.error)
