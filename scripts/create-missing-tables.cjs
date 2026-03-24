/**
 * 创建缺失的 Payload CMS 表
 */

const { Pool } = require('pg');

const POOL_CONFIG = {
  connectionString: 'postgresql://postgres.yderhgkjcsaqrsfntpqm:Machrio%402026@aws-1-ap-northeast-1.pooler.supabase.com:5432/postgres',
  max: 2,
  idleTimeoutMillis: 10000,
}

async function createMissingTables() {
  const pool = new Pool(POOL_CONFIG)
  
  try {
    console.log('🔧 创建缺失的 Payload CMS 表...\n')
    
    // 1. categories_hero_image
    console.log('📝 创建 categories_hero_image...')
    await pool.query(`
      CREATE TABLE IF NOT EXISTS categories_hero_image (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        _parent_id uuid REFERENCES categories(id) ON DELETE CASCADE,
        _order integer,
        _created_at timestamptz DEFAULT CURRENT_TIMESTAMP,
        _updated_at timestamptz DEFAULT CURRENT_TIMESTAMP,
        url text,
        alt text,
        mimeType text,
        filesize numeric,
        width numeric,
        height numeric,
        filename text,
        sizes jsonb,
        _uuid text
      )
    `)
    await pool.query('CREATE INDEX IF NOT EXISTS categories_hero_image_parent_idx ON categories_hero_image(_parent_id)')
    console.log('   ✅ 完成\n')
    
    // 2. homepage
    console.log('📝 创建 homepage...')
    await pool.query(`
      CREATE TABLE IF NOT EXISTS homepage (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        _created_at timestamptz DEFAULT CURRENT_TIMESTAMP,
        _updated_at timestamptz DEFAULT CURRENT_TIMESTAMP,
        hero_heading text,
        hero_subheading text,
        hero_cta_link text,
        hero_cta_text text,
        featured_categories jsonb,
        seo_meta_title text,
        seo_meta_description text
      )
    `)
    await pool.query(`
      INSERT INTO homepage (id, _created_at, _updated_at) 
      SELECT gen_random_uuid(), NOW(), NOW()
      WHERE NOT EXISTS (SELECT 1 FROM homepage)
    `)
    console.log('   ✅ 完成\n')
    
    // 3. site_settings
    console.log('📝 创建 site_settings...')
    await pool.query(`
      CREATE TABLE IF NOT EXISTS site_settings (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        _created_at timestamptz DEFAULT CURRENT_TIMESTAMP,
        _updated_at timestamptz DEFAULT CURRENT_TIMESTAMP,
        site_name text,
        site_logo jsonb,
        default_seo_title text,
        default_seo_description text,
        contact_email text,
        contact_phone text,
        social_links jsonb
      )
    `)
    await pool.query(`
      INSERT INTO site_settings (id, _created_at, _updated_at) 
      SELECT gen_random_uuid(), NOW(), NOW()
      WHERE NOT EXISTS (SELECT 1 FROM site_settings)
    `)
    console.log('   ✅ 完成\n')
    
    // 4. navigation
    console.log('📝 创建 navigation...')
    await pool.query(`
      CREATE TABLE IF NOT EXISTS navigation (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        _created_at timestamptz DEFAULT CURRENT_TIMESTAMP,
        _updated_at timestamptz DEFAULT CURRENT_TIMESTAMP,
        main_navigation jsonb,
        footer_navigation jsonb,
        mobile_navigation jsonb
      )
    `)
    await pool.query(`
      INSERT INTO navigation (id, _created_at, _updated_at) 
      SELECT gen_random_uuid(), NOW(), NOW()
      WHERE NOT EXISTS (SELECT 1 FROM navigation)
    `)
    console.log('   ✅ 完成\n')
    
    console.log('✅ 所有表创建完成！\n')
    
    // 验证
    const tablesResult = await pool.query(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('categories_hero_image', 'homepage', 'site_settings', 'navigation')
      ORDER BY table_name
    `)
    
    console.log('📊 验证结果:')
    tablesResult.rows.forEach(row => {
      console.log(`   ✅ ${row.table_name}`)
    })
    
  } catch (err) {
    console.error('❌ 错误:', err)
    throw err
  } finally {
    await pool.end()
  }
}

createMissingTables().catch(console.error)
