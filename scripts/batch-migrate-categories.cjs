/**
 * 分批迁移产品分类关系
 * 每批 500 个产品，避免超时和内存问题
 */

const mongoose = require('mongoose');
const { Pool } = require('pg');

const MONGODB_URI = 'mongodb+srv://mroworks_db_user:moore1982@mroworks-dev.gbqxebq.mongodb.net/machrio'
const POOL_CONFIG = {
  connectionString: 'postgresql://postgres.yderhgkjcsaqrsfntpqm:Machrio%402026@aws-1-ap-northeast-1.pooler.supabase.com:5432/postgres',
  max: 2,
  idleTimeoutMillis: 5000,
}

async function batchMigrate(batchSize = 500) {
  console.log('🚀 开始分批迁移产品分类...\n')
  
  await mongoose.connect(MONGODB_URI)
  const db = mongoose.connection
  const mongoProducts = db.collection('products')
  const mongoCategories = db.collection('categories')
  
  const pool = new Pool(POOL_CONFIG)
  
  try {
    // 1. 获取分类映射
    console.log('📊 加载分类映射...')
    const mongoCats = await mongoCategories.find({}, { projection: { _id: 1, slug: 1 } }).toArray()
    const mongoCatMap = new Map()
    mongoCats.forEach(cat => mongoCatMap.set(cat._id.toString(), cat.slug))
    
    const pgCatsResult = await pool.query('SELECT id, slug FROM categories')
    const pgCatMap = new Map()
    pgCatsResult.rows.forEach(cat => pgCatMap.set(cat.slug, cat.id))
    console.log(`   MongoDB 分类：${mongoCatMap.size} 个`)
    console.log(`   PostgreSQL 分类：${pgCatMap.size} 个\n`)
    
    // 2. 获取所有需要迁移的产品
    console.log('📊 获取产品列表...')
    const mongoProds = await mongoProducts.find({
      primaryCategory: { $exists: true, $ne: null }
    }, {
      projection: { _id: 1, slug: 1, primaryCategory: 1, sku: 1 }
    }).toArray()
    console.log(`   待迁移产品：${mongoProds.length} 个\n`)
    
    // 3. 检查已迁移的产品
    const pgResult = await pool.query('SELECT slug FROM products WHERE primary_category_id IS NOT NULL')
    const migratedSlugs = new Set(pgResult.rows.map(r => r.slug))
    console.log(`   已迁移：${migratedSlugs.size} 个`)
    console.log(`   待迁移：${mongoProds.length - migratedSlugs.size} 个\n`)
    
    // 4. 分批迁移
    let totalSuccess = 0
    let totalNotFound = 0
    let totalErrors = 0
    let batchNum = 1
    
    for (let i = 0; i < mongoProds.length; i += batchSize) {
      const batch = mongoProds.slice(i, i + batchSize)
      console.log(`🔄 批次 ${batchNum} (${i + 1}-${Math.min(i + batchSize, mongoProds.length)})...`)
      
      let batchSuccess = 0
      let batchNotFound = 0
      let batchErrors = 0
      
      for (const prod of batch) {
        // 跳过已迁移的
        if (migratedSlugs.has(prod.slug)) continue
        
        const mongoCatId = prod.primaryCategory?.toString()
        if (!mongoCatId) {
          batchNotFound++
          continue
        }
        
        const catSlug = mongoCatMap.get(mongoCatId)
        if (!catSlug) {
          batchNotFound++
          continue
        }
        
        const pgCatId = pgCatMap.get(catSlug)
        if (!pgCatId) {
          batchNotFound++
          continue
        }
        
        try {
          await pool.query(
            'UPDATE products SET primary_category_id = $1 WHERE slug = $2',
            [pgCatId, prod.slug]
          )
          batchSuccess++
          migratedSlugs.add(prod.slug)
        } catch (err) {
          batchErrors++
          console.error(`     ❌ ${prod.slug}: ${err.message}`)
        }
      }
      
      console.log(`   ✓ 成功：${batchSuccess}, 未找到：${batchNotFound}, 错误：${batchErrors}`)
      
      totalSuccess += batchSuccess
      totalNotFound += batchNotFound
      totalErrors += batchErrors
      batchNum++
      
      // 每批之间暂停一下
      await new Promise(resolve => setTimeout(resolve, 100))
    }
    
    console.log('\n✅ 迁移完成！\n')
    console.log('📊 总计:')
    console.log(`   成功：${totalSuccess} 个产品`)
    console.log(`   未找到分类：${totalNotFound} 个产品`)
    console.log(`   错误：${totalErrors} 个产品\n`)
    
    // 5. 最终验证
    const verifyResult = await pool.query(`
      SELECT COUNT(*) as total, COUNT(primary_category_id) as with_category 
      FROM products
    `)
    console.log('📊 验证结果:')
    console.log(`   总产品数：${verifyResult.rows[0].total}`)
    console.log(`   有分类的产品：${verifyResult.rows[0].with_category}`)
    console.log(`   覆盖率：${((verifyResult.rows[0].with_category / verifyResult.rows[0].total) * 100).toFixed(1)}%\n`)
    
  } catch (err) {
    console.error('❌ 错误:', err)
    throw err
  } finally {
    await mongoose.disconnect()
    await pool.end()
    console.log('✅ 完成')
  }
}

batchMigrate(500).catch(console.error)
