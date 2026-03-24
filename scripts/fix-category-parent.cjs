const mongoose = require('mongoose');
const { Pool } = require('pg');

const MONGODB_URI = 'mongodb+srv://mroworks_db_user:moore1982@mroworks-dev.gbqxebq.mongodb.net/machrio'
const POOL_CONFIG = {
  connectionString: 'postgresql://postgres.yderhgkjcsaqrsfntpqm:Machrio%402026@aws-1-ap-northeast-1.pooler.supabase.com:5432/postgres',
  max: 1,
  idleTimeoutMillis: 60000,
}

async function fixCategoryParent() {
  console.log('🔧 批量更新分类 parent_id...\n')
  
  await mongoose.connect(MONGODB_URI)
  const db = mongoose.connection
  const mongoCategories = db.collection('categories')
  
  const pool = new Pool(POOL_CONFIG)
  const client = await pool.connect()
  
  try {
    // 1. 获取 MongoDB 数据
    console.log('📊 获取 MongoDB 分类关系...')
    const allCats = await mongoCategories.find({}, { projection: { _id: 1, slug: 1 } }).toArray()
    const idToSlug = new Map()
    allCats.forEach(c => idToSlug.set(c._id.toString(), c.slug))
    
    const catsWithParent = await mongoCategories.find({
      parent: { $exists: true, $ne: null }
    }, { projection: { slug: 1, parent: 1 } }).toArray()
    
    // 2. 获取 PostgreSQL 数据
    console.log('📊 获取 PostgreSQL 分类...')
    const pgResult = await client.query('SELECT id, slug FROM categories')
    const slugToPgId = new Map()
    pgResult.rows.forEach(r => slugToPgId.set(r.slug, r.id))
    
    // 3. 准备批量更新
    console.log('📝 准备批量更新数据...')
    const updates = []
    for (const cat of catsWithParent) {
      const parentSlug = idToSlug.get(cat.parent.toString())
      const pgCatId = slugToPgId.get(cat.slug)
      const pgParentId = slugToPgId.get(parentSlug)
      if (pgCatId && pgParentId) {
        updates.push([pgCatId, pgParentId])
      }
    }
    console.log(`   可更新：${updates.length} 个分类\n`)
    
    // 4. 批量执行
    console.log('📝 执行批量更新...')
    const BATCH_SIZE = 200
    let updated = 0
    
    for (let i = 0; i < updates.length; i += BATCH_SIZE) {
      const batch = updates.slice(i, i + BATCH_SIZE)
      const values = batch.map((_, idx) => `($${idx * 2 + 1}, $${idx * 2 + 2})`).join(', ')
      const params = batch.flatMap(([catId, parentId]) => [catId, parentId])
      
      await client.query(`
        UPDATE categories c
        SET parent_id = v.parent_id::uuid
        FROM (VALUES ${values}) AS v(cat_id, parent_id)
        WHERE c.id = v.cat_id::uuid
      `, params)
      
      updated += batch.length
      console.log(`   批次 ${Math.floor(i/BATCH_SIZE)+1}: 更新 ${updated}/${updates.length}`)
      
      // 等待一下避免连接超时
      await new Promise(r => setTimeout(r, 500))
    }
    
    console.log(`\n✅ 更新了 ${updated} 个分类\n`)
    
    // 5. 验证
    console.log('📊 验证结果...')
    const verify = await client.query(`
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
    verify.rows.forEach(r => console.log(`  L${r.level}: ${r.count} 个`))
    
  } catch (err) {
    console.error('❌ 错误:', err.message)
    throw err
  } finally {
    client.release()
    await mongoose.disconnect()
    await pool.end()
    console.log('\n✅ 完成')
  }
}

fixCategoryParent().catch(console.error)
