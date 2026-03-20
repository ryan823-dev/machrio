/**
 * 高效匹配旧产品和新产品，生成301重定向规则
 * 
 * 优化版本：
 * 1. 批量查询所有有分类的产品
 * 2. 在内存中匹配
 * 3. 生成重定向规则
 */

import { MongoClient, ObjectId } from 'mongodb'
import * as dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'
import * as fs from 'fs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

dotenv.config({ path: path.resolve(__dirname, '../.env.local') })

async function fastMatchDuplicates() {
  const MONGODB_URI = process.env.MONGODB_URI || ''
  
  console.log('🚀 开始高效匹配旧产品和新产品...\n')
  
  const client = new MongoClient(MONGODB_URI)
  
  try {
    await client.connect()
    const db = client.db('machrio')
    const productsCollection = db.collection('products')
    const categoriesCollection = db.collection('categories')
    
    // 获取所有分类
    console.log('📦 加载分类数据...')
    const categories = await categoriesCollection.find({}).toArray() as any[]
    const categoryMap = new Map<string, any>()
    categories.forEach(cat => {
      categoryMap.set(cat._id.toString(), cat)
    })
    console.log(`   加载了 ${categories.length} 个分类\n`)
    
    // 获取所有有分类的产品
    console.log('📦 加载有分类的产品...')
    const newProducts = await productsCollection.find({
      primaryCategory: { $exists: true },
      _status: 'published'
    }).toArray() as any[]
    console.log(`   加载了 ${newProducts.length} 个有分类的产品\n`)
    
    // 创建新产品索引（按SKU末尾数字和slug末尾数字索引）
    console.log('🔍 创建产品索引...')
    const newProductsByCode = new Map<string, any[]>()
    
    for (const product of newProducts) {
      // 从SKU提取末尾数字
      if (product.sku) {
        const skuMatch = product.sku.match(/(\d+)$/)
        if (skuMatch) {
          const code = skuMatch[1]
          if (!newProductsByCode.has(code)) {
            newProductsByCode.set(code, [])
          }
          newProductsByCode.get(code)!.push(product)
        }
      }
      
      // 从slug提取末尾数字
      if (product.slug) {
        const slugMatch = product.slug.match(/(?:h-)?(\d+)$/)
        if (slugMatch) {
          const code = slugMatch[1]
          if (!newProductsByCode.has(code)) {
            newProductsByCode.set(code, [])
          }
          newProductsByCode.get(code)!.push(product)
        }
      }
    }
    console.log(`   创建了 ${newProductsByCode.size} 个索引条目\n`)
    
    // 读取旧产品报告
    console.log('📦 加载旧产品数据...')
    const reportFile = path.join(__dirname, 'output', 'no-category-products-report.json')
    const report = JSON.parse(fs.readFileSync(reportFile, 'utf-8'))
    console.log(`   加载了 ${report.products.length} 个旧产品\n`)
    
    // 为每个旧产品找匹配
    console.log('🔄 开始匹配...\n')
    const redirectRules: any[] = []
    let matchedCount = 0
    
    for (let i = 0; i < report.products.length; i++) {
      const oldProduct = report.products[i]
      
      // 从SKU提取末尾数字
      let matchCode = null
      let matchSource = null
      
      if (oldProduct.sku) {
        const skuMatch = oldProduct.sku.match(/(\d+)$/)
        if (skuMatch) {
          matchCode = skuMatch[1]
          matchSource = `sku:${matchCode}`
        }
      }
      
      // 如果SKU没有，从slug提取
      if (!matchCode && oldProduct.slug) {
        const slugMatch = oldProduct.slug.match(/(?:h-)?(\d+)$/)
        if (slugMatch) {
          matchCode = slugMatch[1]
          matchSource = `slug:${matchCode}`
        }
      }
      
      if (!matchCode) {
        continue
      }
      
      // 查找匹配的新产品
      const candidates = newProductsByCode.get(matchCode) || []
      
      for (const candidate of candidates) {
        // 跳过自己
        if (candidate._id === oldProduct.id) continue
        
        // 检查名称是否相似
        const oldNameLower = oldProduct.name.toLowerCase()
        const newNameLower = candidate.name.toLowerCase()
        
        // 取名称前60个字符比较
        const oldPrefix = oldNameLower.substring(0, Math.min(60, oldNameLower.length))
        const newPrefix = newNameLower.substring(0, Math.min(60, newNameLower.length))
        
        if (oldPrefix === newPrefix || oldPrefix.includes(newPrefix) || newPrefix.includes(oldPrefix)) {
          const category = categoryMap.get(candidate.primaryCategory)
          if (category) {
            matchedCount++
            redirectRules.push({
              source: `/product/${oldProduct.slug}`,
              destination: `/product/${category.slug}/${candidate.slug}`,
              permanent: true,
              matchCode,
              oldSku: oldProduct.sku,
              newSku: candidate.sku,
            })
            break
          }
        }
      }
      
      // 显示进度
      if ((i + 1) % 50 === 0) {
        console.log(`   处理进度: ${i + 1}/${report.products.length} (已匹配 ${matchedCount})`)
      }
    }
    
    console.log(`\n✅ 匹配完成！`)
    console.log(`   找到匹配：${matchedCount} 个\n`)
    
    // 保存结果
    const outputFile = path.join(__dirname, 'output', 'matched-redirect-rules.json')
    fs.writeFileSync(outputFile, JSON.stringify(redirectRules, null, 2))
    console.log(`💾 重定向规则已保存到：${outputFile}`)
    
    // 生成Next.js配置代码
    const nextConfigCode = redirectRules.map(rule => `    {
      source: '${rule.source}',
      destination: '${rule.destination}',
      permanent: true,
    }`).join(',\n')
    
    const snippetFile = path.join(__dirname, 'output', 'next-config-redirects-snippet.txt')
    fs.writeFileSync(snippetFile, `// 301 重定向规则 - 添加到 next.config.mjs\n// 生成时间：${new Date().toISOString()}\n// 规则数量：${redirectRules.length}\n\n${nextConfigCode}`)
    
    console.log(`💾 Next.js配置代码已保存到：${snippetFile}\n`)
    
    // 显示前10个示例
    console.log('=== 前 10 个重定向示例 ===\n')
    redirectRules.slice(0, 10).forEach((rule, idx) => {
      console.log(`${idx + 1}. [匹配码: ${rule.matchCode}]`)
      console.log(`   FROM: ${rule.source}`)
      console.log(`   TO:   ${rule.destination}`)
      console.log(`   旧SKU: ${rule.oldSku} -> 新SKU: ${rule.newSku}`)
      console.log('')
    })
    
  } catch (error) {
    console.error('执行失败:', error)
  } finally {
    await client.close()
    console.log('\n👋 完成')
  }
}

fastMatchDuplicates().catch(console.error)
