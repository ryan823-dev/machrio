const mongoose = require('mongoose');
const { Pool } = require('pg');

const MONGODB_URI = 'mongodb+srv://mroworks_db_user:moore1982@mroworks-dev.gbqxebq.mongodb.net/machrio'
const POOL_CONFIG = {
  connectionString: 'postgresql://postgres.yderhgkjcsaqrsfntpqm:Machrio%402026@aws-1-ap-northeast-1.pooler.supabase.com:5432/postgres',
  max: 1,
  idleTimeoutMillis: 30000,
}

async function migrateCategoryHierarchy() {
  console.log('🚀 迁移分类层级关系...\n')
  
  await mongoose.connect(MONGODB_URI)
  const db = mongoose.connection
  const mongoCategories = db.collection('categories')
  
  const pool = new Pool(POOL_CONFIG)
  const client = await pool.connect()
  
  try {
    // 1. 获取 MongoDB 分类映射
    console.log('📊 获取 MongoDB 分类...')
    const mongoCats = await mongoCategories.find({}, { projection: { _id: 1, slug: 1 } }).toArray()
    const mongoCatMap = new Map()
    mongoCats.forEach(cat => mongoCatMap.set(cat._id.toString(), cat.slug))
    console.log(`   ${mongoCats.length} 个分类\n`)
    
    // 2. 获取 PostgreSQL 分类映射
    console.log('📊 获取 PostgreSQL 分类...')
    const pgCatsResult = await client.query('SELECT id, slug FROM categories')
    const pgCatMap = new Map()
    pgCatsResult.rows.forEach(cat => pgCatMap.set(cat.slug, cat.id))
    console.log(`   ${pgCatsResult.rows.length} 个分类\n`)
    
    // 3. 获取 MongoDB 有父分类的分类
    console.log('📊 获取 MongoDB 分类层级关系...')
    const mongoCatsWithParent = await mongoCategories.find({
      parent: { $exists: true, $ne: null }
    }, { projection: { slug: 1, parent: 1 } }).toArray()
    console.log(`   ${mongoCatsWithParent.length} 个分类有父分类\n`)
    
    // 4. 更新 PostgreSQL 中的 parent_id
    console.log('📝 更新分类层级关系...')
    let updated = 0
    let notFound = 0
    
    for (const cat of mongoCatsWithParent) {
      const catSlug = cat.slug
      const parentId = cat.parent.toString()
      const parentSlug = mongoCatMap.get(parentId)
      
      if (!parentSlug) {
        notFound++
        continue
      }
      
      const pgCatId = pgCatMap.get(catSlug)
      const pgParentId = pgCatMap.get(parentSlug)
      
      if (!pgCatId || !pgParentId) {
        notFound++
        continue
      }
      
      await client.query(
        'UPDATE categories SET parent_id = $1 WHERE id = $2',
        [pgParentId, pgCatId]
      )
      updated++
      
      if (updated % 100 === 0) {
        console.log(`   已更新 ${updated} 个...`)
      }
    }
    
    console.log(`\n✅ 更新了 ${updated} 个分类的层级关系`)
    console.log(`   未找到匹配：${notFound} 个\n`)
    
    // 5. 验证
    console.log('📊 验证结果...')
    const verifyResult = await client.query(`
      WITH RECURSIVE cat_tree AS (
        SELECT id, slug, name, parent_id, 1 as level 
        FROM categories WHERE parent_id IS NULL
        UNION ALL
        SELECT c.id, c.slug, c.name, c.parent_id, ct.level + 1 
        FROM categories c JOIN cat_tree ct ON c.parent_id = ct.id
      ) 
      SELECT level, COUNT(*) as count FROM cat_tree GROUP BY level ORDER BY level
    `)
    
    console.log('分类层级统计:')
    verifyResult.rows.forEach(r => {
      console.log(`  L${r.level}: ${r.count} 个分类`)
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

migrateCategoryHierarchy().catch(console.error)