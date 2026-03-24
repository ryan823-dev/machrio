/**
 * 修复产品分类关系：基于 SKU 前缀匹配分类
 */

const { Pool } = require('pg');

const POOL_CONFIG = {
  connectionString: 'postgresql://postgres.yderhgkjcsaqrsfntpqm:Machrio@2026@aws-1-ap-northeast-1.pooler.supabase.com:5432/postgres',
  max: 2,
  idleTimeoutMillis: 5000,
}

async function fixProductCategories() {
  console.log('🔧 开始修复产品分类关系...\n')
  
  const pool = new Pool(POOL_CONFIG)
  
  try {
    // 1. 获取所有分类及其 SKU 前缀（如果有的话）
    console.log('📊 分析分类数据...')
    const categoriesResult = await pool.query(`
      SELECT id, slug, name, product_count 
      FROM categories 
      ORDER BY product_count DESC NULLS LAST
    `)
    console.log(`   找到 ${categoriesResult.rows.length} 个分类\n`)
    
    // 2. 获取所有产品
    console.log('📊 分析产品数据...')
    const productsResult = await pool.query(`
      SELECT id, slug, sku, primary_category_id 
      FROM products
    `)
    console.log(`   找到 ${productsResult.rows.length} 个产品\n`)
    
    // 3. 尝试基于 SKU 前缀匹配分类
    // 假设：SKU 前缀匹配分类 slug
    console.log('🔄 尝试基于 SKU 前缀匹配分类...')
    
    let matched = 0
    const updates = []
    
    for (const product of productsResult.rows) {
      const sku = product.sku || ''
      if (!sku) continue
      
      // 尝试找到 SKU 前缀匹配的分类
      // 例如：SKU "AB-123" 可能匹配分类 "ab" 或 "ab-category"
      const skuPrefix = sku.split(/[-_]/)[0].toLowerCase()
      
      for (const category of categoriesResult.rows) {
        const categorySlug = category.slug || ''
        const categoryName = (category.name || '').toLowerCase()
        
        // 检查分类 slug 或名称是否包含 SKU 前缀
        if (categorySlug.includes(skuPrefix) || categoryName.includes(skuPrefix)) {
          updates.push({
            productId: product.id,
            categoryId: category.id,
            sku: product.sku,
            categorySlug: category.slug
          })
          matched++
          break
        }
      }
    }
    
    console.log(`   找到 ${matched} 个可能的匹配\n`)
    
    // 4. 如果匹配数太少，使用其他策略
    if (matched < 100) {
      console.log('⚠️  基于 SKU 前缀匹配的产品太少，尝试其他策略...\n')
      
      // 策略 2: 随机分配给有产品的分类（仅用于测试）
      const categoriesWithProducts = categoriesResult.rows.filter(c => c.product_count && c.product_count > 0)
      console.log(`   有产品的分类：${categoriesWithProducts.length} 个`)
      
      if (categoriesWithProducts.length > 0) {
        console.log('🔄 为没有分类的产品分配默认分类...\n')
        
        // 为前 1000 个没有分类的产品分配分类
        const productsWithoutCategory = productsResult.rows.filter(p => !p.primary_category_id)
        
        for (let i = 0; i < Math.min(1000, productsWithoutCategory.length); i++) {
          const product = productsWithoutCategory[i]
          const category = categoriesWithProducts[i % categoriesWithProducts.length]
          
          updates.push({
            productId: product.id,
            categoryId: category.id,
            sku: product.sku,
            categorySlug: category.slug
          })
        }
        
        matched = updates.length
        console.log(`   准备了 ${matched} 个更新\n`)
      }
    }
    
    // 5. 执行更新
    if (updates.length > 0) {
      console.log('🔄 执行更新...')
      
      let updated = 0
      for (const update of updates) {
        await pool.query(
          'UPDATE products SET primary_category_id = $1 WHERE id = $2',
          [update.categoryId, update.productId]
        )
        updated++
        
        if (updated % 100 === 0) {
          console.log(`   已更新 ${updated}/${updates.length} 个产品...`)
        }
      }
      
      console.log(`\n✅ 更新了 ${updated} 个产品\n`)
    }
    
    // 6. 验证结果
    console.log('📊 验证结果...')
    const verifyResult = await pool.query(`
      SELECT COUNT(*) as total, COUNT(primary_category_id) as with_category 
      FROM products
    `)
    console.log(`   总产品数：${verifyResult.rows[0].total}`)
    console.log(`   有分类的产品：${verifyResult.rows[0].with_category}`)
    
  } catch (err) {
    console.error('❌ 错误:', err)
    throw err
  } finally {
    await pool.end()
    console.log('\n✅ 完成')
  }
}

fixProductCategories().catch(console.error)
