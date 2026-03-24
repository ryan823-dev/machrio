/**
 * 迁移 MongoDB 中产品的 primaryCategory 关系到 PostgreSQL
 */

const mongoose = require('mongoose');
const { Pool } = require('pg');

// MongoDB 配置
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/machrio'

// PostgreSQL 配置
const POOL_CONFIG = {
  connectionString: 'postgresql://postgres.yderhgkjcsaqrsfntpqm:Machrio@2026@aws-1-ap-northeast-1.pooler.supabase.com:5432/postgres',
  max: 2,
  idleTimeoutMillis: 5000,
}

async function migrateProductCategories() {
  console.log('🚀 开始迁移产品分类关系...\n')
  
  // 连接 MongoDB
  await mongoose.connect(MONGODB_URI)
  console.log('✅ 已连接 MongoDB')
  
  const db = mongoose.connection
  const products = db.collection('products')
  const categories = db.collection('categories')
  
  // 连接 PostgreSQL
  const pool = new Pool(POOL_CONFIG)
  console.log('✅ 已连接 PostgreSQL\n')
  
  try {
    // 1. 获取 MongoDB 中所有分类的 ID 映射
    console.log('📊 获取 MongoDB 分类数据...')
    const mongoCategories = await categories.find({}, {
      projection: { _id: 1, slug: 1 }
    }).toArray()
    
    const mongoCategoryMap = new Map()
    mongoCategories.forEach(cat => {
      mongoCategoryMap.set(cat._id.toString(), cat.slug)
    })
    console.log(`   找到 ${mongoCategoryMap.size} 个分类\n`)
    
    // 2. 获取 PostgreSQL 中所有分类的 slug -> ID 映射
    console.log('📊 获取 PostgreSQL 分类数据...')
    const pgCategoriesResult = await pool.query('SELECT id, slug FROM categories')
    const pgCategoryMap = new Map()
    pgCategoriesResult.rows.forEach(cat => {
      pgCategoryMap.set(cat.slug, cat.id)
    })
    console.log(`   找到 ${pgCategoryMap.size} 个分类\n`)
    
    // 3. 获取所有有 primaryCategory 的产品
    console.log('📊 获取 MongoDB 产品数据...')
    const mongoProducts = await products.find({
      primaryCategory: { $exists: true, $ne: null }
    }, {
      projection: { _id: 1, sku: 1, slug: 1, primaryCategory: 1 }
    }).toArray()
    console.log(`   找到 ${mongoProducts.length} 个产品有 primaryCategory\n`)
    
    // 4. 迁移分类关系
    console.log('🔄 开始迁移分类关系...')
    let updated = 0
    let notFound = 0
    let errors = 0
    
    for (const mongoProduct of mongoProducts) {
      const mongoCategoryId = mongoProduct.primaryCategory?.toString()
      if (!mongoCategoryId) continue
      
      const categorySlug = mongoCategoryMap.get(mongoCategoryId)
      if (!categorySlug) {
        notFound++
        continue
      }
      
      const pgCategoryId = pgCategoryMap.get(categorySlug)
      if (!pgCategoryId) {
        notFound++
        continue
      }
      
      // 更新 PostgreSQL 中的产品
      try {
        await pool.query(
          'UPDATE products SET primary_category_id = $1 WHERE slug = $2',
          [pgCategoryId, mongoProduct.slug]
        )
        updated++
        
        if (updated % 100 === 0) {
          console.log(`   已更新 ${updated}/${mongoProducts.length} 个产品...`)
        }
      } catch (err) {
        console.error(`   ❌ 更新产品 ${mongoProduct.slug} 失败:`, err.message)
        errors++
      }
    }
    
    console.log('\n✅ 迁移完成！')
    console.log(`\n📊 迁移结果:`)
    console.log(`   更新成功：${updated} 个产品`)
    console.log(`   未找到分类：${notFound} 个产品`)
    console.log(`   错误：${errors} 个产品`)
    
    // 5. 验证结果
    console.log('\n📊 验证结果...')
    const verifyResult = await pool.query('SELECT COUNT(*) FROM products WHERE primary_category_id IS NOT NULL')
    const count = verifyResult.rows[0].count
    console.log(`   PostgreSQL 中有 ${count} 个产品有 primary_category_id`)
    
  } catch (err) {
    console.error('❌ 迁移失败:', err)
    throw err
  } finally {
    await mongoose.disconnect()
    await pool.end()
    console.log('\n✅ 已断开所有连接')
  }
}

// 执行迁移
migrateProductCategories().catch(console.error)
