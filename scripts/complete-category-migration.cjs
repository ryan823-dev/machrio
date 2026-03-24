/**
 * 完整迁移产品分类关系
 * 从 MongoDB 迁移所有产品的 primaryCategory 到 PostgreSQL
 */

const mongoose = require('mongoose');
const { Pool } = require('pg');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/machrio'
const POOL_CONFIG = {
  connectionString: 'postgresql://postgres.yderhgkjcsaqrsfntpqm:Machrio@2026@aws-1-ap-northeast-1.pooler.supabase.com:5432/postgres',
  max: 2,
  idleTimeoutMillis: 5000,
}

async function completeCategoryMigration() {
  console.log('🚀 开始完整迁移产品分类关系...\n')
  
  // 连接 MongoDB
  await mongoose.connect(MONGODB_URI)
  console.log('✅ 已连接 MongoDB')
  
  const db = mongoose.connection
  const mongoProducts = db.collection('products')
  const mongoCategories = db.collection('categories')
  
  // 连接 PostgreSQL
  const pool = new Pool(POOL_CONFIG)
  console.log('✅ 已连接 PostgreSQL\n')
  
  try {
    // 1. 获取 MongoDB 所有分类
    console.log('📊 获取 MongoDB 分类...')
    const mongoCats = await mongoCategories.find({}, {
      projection: { _id: 1, slug: 1 }
    }).toArray()
    
    const mongoCatMap = new Map()
    mongoCats.forEach(cat => {
      mongoCatMap.set(cat._id.toString(), cat.slug)
    })
    console.log(`   MongoDB 分类：${mongoCatMap.size} 个\n`)
    
    // 2. 获取 PostgreSQL 所有分类（slug -> id）
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
      projection: { _id: 1, slug: 1, primaryCategory: 1 }
    }).toArray()
    console.log(`   有分类的产品：${mongoProds.length} 个\n`)
    
    // 4. 迁移关系
    console.log('🔄 迁移分类关系...')
    let success = 0
    let notFound = 0
    let errors = 0
    
    for (const prod of mongoProds) {
      const mongoCatId = prod.primaryCategory?.toString()
      if (!mongoCatId) continue
      
      const catSlug = mongoCatMap.get(mongoCatId)
      if (!catSlug) {
        notFound++
        continue
      }
      
      const pgCatId = pgCatMap.get(catSlug)
      if (!pgCatId) {
        notFound++
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
      }
    }
    
    console.log('\n✅ 迁移完成！\n')
    console.log('📊 结果统计:')
    console.log(`   成功：${success} 个产品`)
    console.log(`   未找到分类：${notFound} 个产品`)
    console.log(`   错误：${errors} 个产品\n`)
    
    // 5. 验证
    console.log('📊 验证结果...')
    const verifyResult = await pool.query(`
      SELECT COUNT(*) as total, COUNT(primary_category_id) as with_category 
      FROM products
    `)
    console.log(`   PostgreSQL 总产品数：${verifyResult.rows[0].total}`)
    console.log(`   有分类的产品数：${verifyResult.rows[0].with_category}\n`)
    
  } catch (err) {
    console.error('❌ 迁移失败:', err)
    throw err
  } finally {
    await mongoose.disconnect()
    await pool.end()
    console.log('✅ 已断开所有连接')
  }
}

completeCategoryMigration().catch(console.error)
