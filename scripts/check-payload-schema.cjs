/**
 * 检查 Payload CMS 所需的数据库表
 */

const { Pool } = require('pg');

const POOL_CONFIG = {
  connectionString: 'postgresql://postgres.yderhgkjcsaqrsfntpqm:Machrio%402026@aws-1-ap-northeast-1.pooler.supabase.com:5432/postgres',
  max: 2,
  idleTimeoutMillis: 5000,
}

async function checkPayloadSchema() {
  const pool = new Pool(POOL_CONFIG)
  
  try {
    console.log('📊 检查 Payload CMS 数据库表...\n')
    
    // 获取所有表
    const tablesResult = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `)
    
    const allTables = tablesResult.rows.map(r => r.table_name)
    console.log(`总表数：${allTables.length}\n`)
    
    // Payload CMS 系统表
    const payloadSystemTables = [
      'payload_migrations',
      'payload_preferences',
      'users',
      'users_sessions'
    ]
    
    // 集合表
    const collectionTables = [
      'categories',
      'categories_faq',
      'categories_facet_groups',
      'categories_hero_image',
      'products',
      'products_faq',
      'products_specifications',
      'products_industries',
      'products_pricing_tieredpricing',
      'products_related_products',
      'products_seo_keywords',
      'products_documents',
      'products_videos',
      'products_texts',
      'products__texts',
      'products_texts_tags',
      'products_tiered_pricing',
      'brands',
      'media',
      'orders',
      'customers',
      'quotes',
      'rfq_submissions',
      'contact_submissions',
      'shipping_methods',
      'shipping_rates',
      'free_shipping_rules',
      'verification_codes',
      'account_sessions',
      'product_views',
      'articles',
      'pages',
      'industries',
      'redirects',
      'glossary_terms',
    ]
    
    // Global 表
    const globalTables = [
      'homepage',
      'site_settings',
      'navigation',
    ]
    
    console.log('📋 Payload 系统表:')
    payloadSystemTables.forEach(table => {
      const exists = allTables.includes(table)
      console.log(`  ${exists ? '✅' : '❌'} ${table}`)
    })
    
    console.log('\n📋 集合表:')
    collectionTables.forEach(table => {
      const exists = allTables.includes(table)
      console.log(`  ${exists ? '✅' : '❌'} ${table}`)
    })
    
    console.log('\n📋 Global 表:')
    globalTables.forEach(table => {
      const exists = allTables.includes(table)
      console.log(`  ${exists ? '✅' : '❌'} ${table}`)
    })
    
    // 检查缺失的表
    const missingTables = [
      ...payloadSystemTables,
      ...collectionTables,
      ...globalTables
    ].filter(table => !allTables.includes(table))
    
    if (missingTables.length > 0) {
      console.log(`\n⚠️  缺失 ${missingTables.length} 个表:`)
      missingTables.forEach(t => console.log(`  - ${t}`))
    } else {
      console.log('\n✅ 所有表都存在！')
    }
    
  } catch (err) {
    console.error('❌ 错误:', err)
  } finally {
    await pool.end()
  }
}

checkPayloadSchema().catch(console.error)
