#!/usr/bin/env node
/**
 * 批量产品导入脚本 - 分批处理，带重试
 */

import { Pool } from 'pg'
import XLSX from 'xlsx'
import { v4 as uuidv4 } from 'uuid'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

dotenv.config({ path: path.join(__dirname, '../.env.production') })

const BATCH_SIZE = 20  // 每批 20 个产品
const RETRY_COUNT = 3  // 重试次数

async function main() {
  console.log('=== 批量产品导入脚本 ===\n')

  // 加载原始 slug 映射
  const slugMappingPath = path.join(__dirname, '../temp_import/original_slugs_full.json')
  const slugMapping = JSON.parse(fs.readFileSync(slugMappingPath, 'utf-8'))
  const slugBySku = new Map()
  for (const item of slugMapping) {
    slugBySku.set(item.sku, item.slug)
  }
  console.log(`原始 slug 映射: ${slugBySku.size} 个`)

  // 读取产品数据
  const excelPath = path.join(__dirname, '../temp_import/all_products_combined.xlsx')
  const workbook = XLSX.readFile(excelPath)
  const products = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]])
  console.log(`产品表格: ${products.length} 个`)

  // 获取分类映射
  const pool = new Pool({
    connectionString: process.env.DATABASE_URI,
    max: 1,
    idleTimeoutMillis: 10000,
  })

  try {
    const catResult = await pool.query(`SELECT id::text, name FROM categories`)
    const catByName = new Map()
    for (const cat of catResult.rows) {
      catByName.set(cat.name, cat.id)
    }
    console.log(`分类映射: ${catByName.size} 个`)

    // 获取已导入的 SKU
    const existingResult = await pool.query(`SELECT sku FROM products`)
    const existingSkus = new Set(existingResult.rows.map(r => r.sku))
    console.log(`已导入: ${existingSkus.size} 个`)

    // 过滤出需要导入的产品
    const toImport = products.filter(p => !existingSkus.has(p['SKU']))
    console.log(`待导入: ${toImport.length} 个\n`)

    if (toImport.length === 0) {
      console.log('所有产品已导入完成！')
      return
    }

    // 分批导入
    let imported = 0
    let failed = 0

    for (let i = 0; i < toImport.length; i += BATCH_SIZE) {
      const batch = toImport.slice(i, i + BATCH_SIZE)
      
      for (const p of batch) {
        const categoryId = catByName.get(p['L3 Category'])
        if (!categoryId) {
          failed++
          continue
        }

        const slug = slugBySku.get(p['SKU']) || generateSlug(p['Name'], p['SKU'])

        // 重试机制
        let success = false
        for (let retry = 0; retry < RETRY_COUNT && !success; retry++) {
          try {
            await insertProduct(pool, p, slug, categoryId)
            imported++
            success = true
          } catch (err) {
            if (retry < RETRY_COUNT - 1) {
              await new Promise(r => setTimeout(r, 1000))
            } else {
              failed++
              console.error(`失败: ${p['SKU']} - ${err.message}`)
            }
          }
        }
      }

      process.stdout.write(`\r进度: ${Math.min(i + BATCH_SIZE, toImport.length)}/${toImport.length} (成功: ${imported}, 失败: ${failed})`)

      // 每批后暂停一下
      if (i + BATCH_SIZE < toImport.length) {
        await new Promise(r => setTimeout(r, 500))
      }
    }

    console.log(`\n\n导入完成: 成功 ${imported}, 失败 ${failed}`)

    // 最终验证
    const finalCount = await pool.query('SELECT COUNT(*) FROM products')
    console.log(`数据库产品总数: ${finalCount.rows[0].count}`)

  } finally {
    await pool.end()
  }
}

async function insertProduct(pool, p, slug, categoryId) {
  const id = uuidv4()
  const fullDescription = p['Full Description'] ? {
    root: { type: 'root', children: [{ type: 'paragraph', children: [{ type: 'text', text: p['Full Description'].toString() }] }] }
  } : null
  const pricing = { basePrice: parseFloat(p['Selling Price (USD)']) || null, currency: 'USD', costPrice: parseFloat(p['Cost Price (CNY)']) || null }
  const images = p['Primary Image URL'] ? [{ url: p['Primary Image URL'].toString() }] : null

  await pool.query(`
    INSERT INTO products (id, sku, name, slug, short_description, full_description,
      primary_category_id, status, availability, purchase_mode,
      min_order_quantity, package_qty, package_unit, weight,
      pricing, faq, images, external_image_url,
      meta_title, meta_description, focus_keyword, source_url, created_at, updated_at)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, NOW(), NOW())
  `, [
    id, p['SKU']?.toString().slice(0, 100), p['Name']?.toString().slice(0, 500), slug,
    p['Short Description']?.toString().slice(0, 1000), JSON.stringify(fullDescription),
    categoryId, 'published', 'in_stock', p['Purchase Mode'] || 'both',
    parseInt(p['Min Order Qty']) || 1, parseInt(p['Package Qty']) || null,
    p['Package Unit']?.toString().slice(0, 50), parseFloat(p['Weight (kg)']) || null,
    JSON.stringify(pricing), buildFAQ(p), JSON.stringify(images),
    p['Primary Image URL']?.toString().slice(0, 500),
    p['Meta Title']?.toString().slice(0, 200), p['Meta Description']?.toString().slice(0, 500),
    p['Focus Keyword']?.toString().slice(0, 100), p['Source URL']?.toString().slice(0, 500),
  ])
}

function generateSlug(name, sku) {
  const base = (name || 'product').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 100)
  return `${base}-${(sku || '').toLowerCase()}`
}

function buildFAQ(p) {
  const faq = []
  for (let i = 1; i <= 3; i++) {
    if (p[`FAQ Question ${i}`] && p[`FAQ Answer ${i}`]) {
      faq.push({ question: p[`FAQ Question ${i}`].toString(), answer: p[`FAQ Answer ${i}`].toString() })
    }
  }
  return faq.length > 0 ? JSON.stringify(faq) : null
}

main().catch(console.error)