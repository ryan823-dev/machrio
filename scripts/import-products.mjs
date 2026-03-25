#!/usr/bin/env node
/**
 * 产品数据导入脚本
 * 从 Excel 文件导入产品到 Supabase
 */

import { Pool } from 'pg'
import XLSX from 'xlsx'
import { v4 as uuidv4 } from 'uuid'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

dotenv.config({ path: path.join(__dirname, '../.env.production') })

async function main() {
  console.log('=== Machrio 产品导入脚本 ===\n')

  const pool = new Pool({
    connectionString: process.env.DATABASE_URI,
    max: 1,
    idleTimeoutMillis: 30000,
  })

  try {
    // 1. 获取分类映射
    console.log('1. 获取分类映射...')
    const catResult = await pool.query(`SELECT id::text, name FROM categories`)
    const catByName = new Map()
    for (const cat of catResult.rows) {
      catByName.set(cat.name, cat.id)
    }
    console.log(`   找到 ${catByName.size} 个分类`)

    // 2. 读取产品数据
    console.log('2. 读取产品数据...')
    const excelPath = path.join(__dirname, '../temp_import/all_products_combined.xlsx')
    const workbook = XLSX.readFile(excelPath)
    const products = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]])
    console.log(`   找到 ${products.length} 个产品`)

    // 3. 导入产品
    console.log('3. 导入产品...')
    let imported = 0, skipped = 0, errors = 0

    for (let i = 0; i < products.length; i++) {
      const p = products[i]
      const categoryId = catByName.get(p['L3 Category'])

      if (!categoryId) {
        skipped++
        continue
      }

      try {
        const id = uuidv4()
        const slug = generateSlug(p['Name'], p['SKU'])

        // 构建 full_description (jsonb)
        const fullDescription = p['Full Description'] ? {
          root: {
            type: 'root',
            children: [{
              type: 'paragraph',
              children: [{ type: 'text', text: p['Full Description'].toString() }]
            }]
          }
        } : null

        // 构建 pricing (jsonb)
        const pricing = {
          basePrice: parseFloat(p['Selling Price (USD)']) || null,
          currency: 'USD',
          costPrice: parseFloat(p['Cost Price (CNY)']) || null,
        }

        // 构建 images (jsonb)
        const images = p['Primary Image URL'] ? [{
          url: p['Primary Image URL'].toString()
        }] : null

        await pool.query(`
          INSERT INTO products (
            id, sku, name, slug, short_description, full_description,
            primary_category_id, status, availability, purchase_mode,
            min_order_quantity, package_qty, package_unit, weight,
            pricing, faq, images, external_image_url,
            meta_title, meta_description, focus_keyword, source_url,
            created_at, updated_at
          ) VALUES (
            $1, $2, $3, $4, $5, $6,
            $7, $8, $9, $10,
            $11, $12, $13, $14,
            $15, $16, $17, $18,
            $19, $20, $21, $22,
            NOW(), NOW()
          )
        `, [
          id,
          p['SKU']?.toString().slice(0, 100),
          p['Name']?.toString().slice(0, 500),
          slug,
          p['Short Description']?.toString().slice(0, 1000),
          JSON.stringify(fullDescription),
          categoryId,
          'published',
          'in_stock',
          p['Purchase Mode'] || 'both',
          parseInt(p['Min Order Qty']) || 1,
          parseInt(p['Package Qty']) || null,
          p['Package Unit']?.toString().slice(0, 50),
          parseFloat(p['Weight (kg)']) || null,
          JSON.stringify(pricing),
          buildFAQ(p),
          JSON.stringify(images),
          p['Primary Image URL']?.toString().slice(0, 500),
          p['Meta Title']?.toString().slice(0, 200),
          p['Meta Description']?.toString().slice(0, 500),
          p['Focus Keyword']?.toString().slice(0, 100),
          p['Source URL']?.toString().slice(0, 500),
        ])
        imported++
      } catch (err) {
        errors++
        if (errors <= 5) console.error(`  错误: ${p['SKU']} - ${err.message}`)
      }

      if ((i + 1) % 100 === 0) {
        process.stdout.write(`\r   进度: ${i + 1}/${products.length} (成功: ${imported}, 跳过: ${skipped}, 错误: ${errors})`)
      }
    }

    console.log(`\n\n=== 导入完成 ===`)
    console.log(`成功: ${imported}, 跳过: ${skipped}, 错误: ${errors}`)

    // 验证
    const countResult = await pool.query('SELECT COUNT(*) FROM products')
    console.log(`\n数据库产品总数: ${countResult.rows[0].count}`)

    // 检查分类关联
    const catCountResult = await pool.query(`
      SELECT c.name, COUNT(p.id) as count
      FROM categories c
      JOIN products p ON p.primary_category_id = c.id::uuid
      GROUP BY c.name
      ORDER BY count DESC
      LIMIT 10
    `)
    console.log('\n产品最多的分类:')
    for (const row of catCountResult.rows) {
      console.log(`  ${row.name}: ${row.count}`)
    }

  } finally {
    await pool.end()
  }
}

function generateSlug(name, sku) {
  const base = (name || 'product')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 100)
  return `${base}-${(sku || '').toLowerCase()}`
}

function buildFAQ(p) {
  const faq = []
  for (let i = 1; i <= 3; i++) {
    const q = p[`FAQ Question ${i}`]
    const a = p[`FAQ Answer ${i}`]
    if (q && a) {
      faq.push({ question: q.toString(), answer: a.toString() })
    }
  }
  return faq.length > 0 ? JSON.stringify(faq) : null
}

main().catch(console.error)