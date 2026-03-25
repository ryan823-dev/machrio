/**
 * 诊断脚本 - 检查数据库连接和数据完整性
 *
 * 使用方法:
 * 1. 复制 .env.example 为 .env.local
 * 2. 填入你的 DATABASE_URI 和 SUPABASE_SERVICE_ROLE_KEY
 * 3. 运行: node scripts/diagnose.cjs
 */

import * as dotenv from 'dotenv'
import { Pool } from 'pg'

dotenv.config({ path: '.env.local' })

async function diagnose() {
  console.log('🔍 Machrio 数据库诊断工具\n')
  console.log('=' .repeat(50))

  // 1. 检查环境变量
  console.log('\n📋 环境变量检查:')
  console.log(`  USE_POSTGRES: ${process.env.USE_POSTGRES || '(未设置)'}`)
  console.log(`  DATABASE_URI: ${process.env.DATABASE_URI ? '✅ 已设置' : '❌ 未设置'}`)
  console.log(`  SUPABASE_SERVICE_ROLE_KEY: ${process.env.SUPABASE_SERVICE_ROLE_KEY ? '✅ 已设置' : '❌ 未设置'}`)

  // 2. 检查数据库连接
  if (!process.env.DATABASE_URI) {
    console.log('\n❌ DATABASE_URI 未设置，无法连接数据库')
    return
  }

  const pool = new Pool({
    connectionString: process.env.DATABASE_URI,
    max: 1,
  })

  try {
    console.log('\n🔌 连接数据库...')
    const client = await pool.connect()
    console.log('✅ 数据库连接成功')

    // 3. 检查表是否存在
    const tables = ['categories', 'products', 'users', 'homepage', 'site_settings', 'navigation']
    console.log('\n📊 表结构检查:')

    for (const table of tables) {
      try {
        const result = await client.query(`SELECT COUNT(*) FROM ${table}`)
        console.log(`  ✅ ${table}: ${result.rows[0].count} 条记录`)
      } catch (err) {
        console.log(`  ❌ ${table}: 表不存在或查询失败 - ${err.message}`)
      }
    }

    // 4. 检查分类层级结构
    console.log('\n🏷️ 分类层级检查:')
    try {
      // 检查 L1 分类（没有 parent 的分类）
      const l1Result = await client.query(`
        SELECT COUNT(*) as count FROM categories
        WHERE parent_id IS NULL
      `)
      console.log(`  L1 分类 (顶级): ${l1Result.rows[0].count}`)

      // 检查 L2 分类
      const l2Result = await client.query(`
        SELECT COUNT(*) as count FROM categories c1
        WHERE EXISTS (SELECT 1 FROM categories c2 WHERE c2.parent_id = c1.id)
        AND c1.parent_id IS NOT NULL
      `)
      console.log(`  L2 分类 (有子分类): ${l2Result.rows[0].count}`)

      // 检查 L3 分类（有产品的子分类）
      const l3Result = await client.query(`
        SELECT COUNT(*) as count FROM categories c1
        WHERE NOT EXISTS (SELECT 1 FROM categories c2 WHERE c2.parent_id = c1.id)
        AND c1.parent_id IS NOT NULL
      `)
      console.log(`  L3 分类 (叶子分类): ${l3Result.rows[0].count}`)

      // 检查孤立分类（没有父分类的 L2/L3）
      const orphanResult = await client.query(`
        SELECT COUNT(*) as count FROM categories
        WHERE parent_id IS NOT NULL
        AND parent_id NOT IN (SELECT id FROM categories)
      `)
      if (parseInt(orphanResult.rows[0].count) > 0) {
        console.log(`  ⚠️ 孤立分类 (父分类不存在): ${orphanResult.rows[0].count}`)
      }
    } catch (err) {
      console.log(`  ❌ 查询失败: ${err.message}`)
    }

    // 5. 检查产品与分类关系
    console.log('\n📦 产品与分类关系检查:')
    try {
      // 没有主分类的产品
      const noCategoryResult = await client.query(`
        SELECT COUNT(*) as count FROM products
        WHERE primary_category_id IS NULL
      `)
      const noCategoryCount = parseInt(noCategoryResult.rows[0].count)
      if (noCategoryCount > 0) {
        console.log(`  ⚠️ 无主分类的产品: ${noCategoryCount}`)
      } else {
        console.log(`  ✅ 所有产品都有主分类`)
      }

      // 统计各分类的产品数量
      const productByCategoryResult = await client.query(`
        SELECT c.name, c.slug, COUNT(p.id) as product_count
        FROM categories c
        LEFT JOIN products p ON p.primary_category_id = c.id
        WHERE c.parent_id IS NOT NULL
        GROUP BY c.id, c.name, c.slug
        HAVING COUNT(p.id) = 0
        ORDER BY c.name
        LIMIT 10
      `)
      if (productByCategoryResult.rows.length > 0) {
        console.log(`  ⚠️ 没有产品的分类 (前10个):`)
        productByCategoryResult.rows.forEach(row => {
          console.log(`    - ${row.name} (${row.slug}): ${row.product_count} 个产品`)
        })
      }

      // 验证 L3 分类是否都有产品
      const l3WithoutProductsResult = await client.query(`
        SELECT COUNT(*) as count FROM categories
        WHERE parent_id IS NOT NULL
        AND id NOT IN (SELECT parent_id FROM categories WHERE parent_id IS NOT NULL)
        AND id NOT IN (SELECT primary_category_id FROM products WHERE primary_category_id IS NOT NULL)
      `)
      const l3WithoutProducts = parseInt(l3WithoutProductsResult.rows[0].count)
      if (l3WithoutProducts > 0) {
        console.log(`  ⚠️ L3 分类中没有产品: ${l3WithoutProducts}`)
      }
    } catch (err) {
      console.log(`  ❌ 查询失败: ${err.message}`)
    }

    // 6. 检查 users 表结构
    console.log('\n👤 Users 表检查:')
    try {
      const usersColumns = await client.query(`
        SELECT column_name, data_type
        FROM information_schema.columns
        WHERE table_name = 'users'
        ORDER BY ordinal_position
      `)
      const hasRole = usersColumns.rows.some(col => col.column_name === 'role')
      const hasName = usersColumns.rows.some(col => col.column_name === 'name')

      console.log(`  role 列: ${hasRole ? '✅ 存在' : '❌ 缺失'}`)
      console.log(`  name 列: ${hasName ? '✅ 存在' : '❌ 缺失'}`)

      if (!hasRole || !hasName) {
        console.log('\n  🔧 执行修复 SQL:')
        console.log('  ALTER TABLE users ADD COLUMN IF NOT EXISTS role text DEFAULT \'editor\';')
        console.log('  ALTER TABLE users ADD COLUMN IF NOT EXISTS name text;')
      }
    } catch (err) {
      console.log(`  ❌ 检查失败: ${err.message}`)
    }

    // 7. 检查 categories 表结构
    console.log('\n🏷️ Categories 表检查:')
    try {
      const catColumns = await client.query(`
        SELECT column_name
        FROM information_schema.columns
        WHERE table_name = 'categories'
      `)
      const hasDisplayOrder = catColumns.rows.some(col => col.column_name === 'display_order')
      console.log(`  display_order 列: ${hasDisplayOrder ? '✅ 存在' : '❌ 缺失'}`)

      const hasParentId = catColumns.rows.some(col => col.column_name === 'parent_id')
      console.log(`  parent_id 列: ${hasParentId ? '✅ 存在' : '❌ 缺失'}`)
    } catch (err) {
      console.log(`  ❌ 检查失败: ${err.message}`)
    }

    // 8. 检查 products 表结构
    console.log('\n📦 Products 表检查:')
    try {
      const prodColumns = await client.query(`
        SELECT column_name
        FROM information_schema.columns
        WHERE table_name = 'products'
      `)
      const hasPrimaryCategory = prodColumns.rows.some(col => col.column_name === 'primary_category_id')
      console.log(`  primary_category_id 列: ${hasPrimaryCategory ? '✅ 存在' : '❌ 缺失'}`)

      const hasSlug = prodColumns.rows.some(col => col.column_name === 'slug')
      console.log(`  slug 列: ${hasSlug ? '✅ 存在' : '❌ 缺失'}`)
    } catch (err) {
      console.log(`  ❌ 检查失败: ${err.message}`)
    }

    client.release()
    await pool.end()

    console.log('\n' + '='.repeat(50))
    console.log('✅ 诊断完成')

  } catch (err) {
    console.error('\n❌ 数据库连接失败:')
    console.error(`   ${err.message}`)
    console.error('\n可能的原因:')
    console.error('   1. DATABASE_URI 配置错误')
    console.error('   2. Supabase 数据库服务未启动')
    console.error('   3. 防火墙阻止了连接')
    console.error('   4. IP 白名单未配置（如果是 Supabase）')

    await pool.end()
  }
}

diagnose().catch(console.error)
