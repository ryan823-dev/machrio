/**
 * 迁移所有产品的分类关系
 * 从 MongoDB 迁移 primaryCategory 到 PostgreSQL 的 primary_category_id
 */

const mongoose = require('mongoose');
const { Pool } = require('pg');

// MongoDB Atlas 连接
const MONGODB_URI = 'mongodb+srv://mroworks_db_user:moore1982@mroworks-dev.gbqxebq.mongodb.net/machrio'

// PostgreSQL 连接
const POOL_CONFIG = {
  connectionString: 'postgresql://postgres.yderhgkjcsaqrsfntpqm:Machrio%402026@aws-1-ap-northeast-1.pooler.supabase.com:5432/postgres',
  max: 2,
  idleTimeoutMillis: 5000,
}

async function migrateAllProductCategories() {
  console.log('🚀 开始迁移所有产品分类关系...\n')
  
  // 连接 MongoDB
  await mongoose.connect(MONGODB_URI)
  console.log('✅ 已连接 MongoDB Atlas')
  
  const db = mongoose.connection
  const mongoProducts = db.collection('products')
  const mongoCategories = db.collection('categories')
  
  // 连接 PostgreSQL
  const pool = new Pool(POOL_CONFIG)
  console.log('✅ 已连接 PostgreSQL (Supabase)\n')
  
  try {
    // 1. 获取 MongoDB 所有分类 (ID -> slug)
    console.log('📊 获取 MongoDB 分类...')
    const mongoCats = await mongoCategories.find({}, {
      projection: { _id: 1, slug: 1 }
    }).toArray()
    
    const mongoCatMap = new Map()
    mongoCats.forEach(cat => {
      mongoCatMap.set(cat._id.toString(), cat.slug)
    })
    console.log(`   MongoDB 分类：${mongoCatMap.size} 个\n`)
    
    // 2. 获取 PostgreSQL 所有分类 (slug -> ID)
    console.log('📊 获取 PostgreSQL 分类...')
    const pgCatsResult = await pool.query('SELECT id, slug FROM categories')
    const pgCatMap = new Map()
    pgCatsResult.rows.forEach(cat => {
      pgCatMap.set(cat.slug, cat.id)
    })
    console.log(`   PostgreSQL 分类：${pgCatMap.size} 个\n`)
    
    // 3. 获取 MongoDB 所有有 primaryCategory 的产品
    console.log('📊 获取 MongoDB 产品...')
    const mongoProds = await mongoProducts.find({
      primaryCategory: { $exists: true, $ne: null }
    }, {
      projection: { _id: 1, slug: 1, primaryCategory: 1, sku: 1 }
    }).toArray()
    console.log(`   有分类的产品：${mongoProds.length} 个\n`)
    
    // 4. 迁移关系
    console.log('🔄 迁移分类关系...')
    let success = 0
    let notFound = 0
    let errors = 0
    const errorDetails = []
    
    for (const prod of mongoProds) {
      const mongoCatId = prod.primaryCategory?.toString()
      if (!mongoCatId) continue
      
      const catSlug = mongoCatMap.get(mongoCatId)
      if (!catSlug) {
        notFound++
        errorDetails.push({ sku: prod.sku, slug: prod.slug, reason: 'MongoDB category not found' })
        continue
      }
      
      const pgCatId = pgCatMap.get(catSlug)
      if (!pgCatId) {
        notFound++
        errorDetails.push({ sku: prod.sku, slug: prod.slug, reason: `PostgreSQL category not found: ${catSlug}` })
        continue
      }
      
      try {
        await pool.query(
          'UPDATE products SET primary_category_id = $1 WHERE slug = $2',
          [pgCatId, prod.slug]
        )
        success++
        
        if (success % 200 === 0) {
          console.log(`   已迁移 ${success}/${mongoProds.length} 个...`)
        }
      } catch (err) {
        console.error(`   ❌ ${prod.slug}: ${err.message}`)
        errors++
        errorDetails.push({ sku: prod.sku, slug: prod.slug, reason: err.message })
      }
    }
    
    console.log('\n✅ 迁移完成！\n')
    console.log('📊 结果统计:')
    console.log(`   成功：${success} 个产品`)
    console.log(`   未找到分类：${notFound} 个产品 (${((notFound/mongoProds.length)*100).toFixed(1)}%)`)
    console.log(`   错误：${errors} 个产品\n`)
    
    if (errorDetails.length > 0 && errorDetails.length <= 20) {
      console.log('📋 错误详情 (前 20 个):')
      errorDetails.forEach((err, i) => {
        console.log(`   ${i+1}. ${err.sku} (${err.slug}): ${err.reason}`)
      })
      console.log('')
    }
    
    // 5. 验证
    console.log('📊 验证结果...')
    const verifyResult = await pool.query(`
      SELECT COUNT(*) as total, COUNT(primary_category_id) as with_category 
      FROM products
    `)
    console.log(`   PostgreSQL 总产品数：${verifyResult.rows[0].total}`)
    console.log(`   有分类的产品数：${verifyResult.rows[0].with_category}`)
    console.log(`   迁移覆盖率：${((verifyResult.rows[0].with_category / verifyResult.rows[0].total) * 100).toFixed(1)}%\n`)
    
    // 6. 抽样验证
    console.log('🔍 抽样验证 (前 5 个产品)...')
    const sampleResult = await pool.query(`
      SELECT p.slug, p.sku, c.slug as category_slug, c.name as category_name
      FROM products p
      LEFT JOIN categories c ON p.primary_category_id = c.id
      WHERE p.primary_category_id IS NOT NULL
      LIMIT 5
    `)
    sampleResult.rows.forEach(row => {
      console.log(`   - ${row.sku}: ${row.slug} → ${row.category_name} (${row.category_slug})`)
    })
    
  } catch (err) {
    console.error('❌ 迁移失败:', err)
    throw err
  } finally {
    await mongoose.disconnect()
    await pool.end()
    console.log('\n✅ 已断开所有连接')
  }
}

migrateAllProductCategories().catch(console.error)
