/**
 * 识别并修复无分类产品
 * 
 * 使用方法:
 * npx tsx scripts/fix-no-category-products.ts
 */

import { MongoClient } from 'mongodb'
import * as dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'
import * as fs from 'fs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

dotenv.config({ path: path.resolve(__dirname, '../.env.local') })

interface Product {
  _id: string
  slug: string
  sku: string
  name: string
  primaryCategory?: string
  categories?: string[]
  updatedAt?: string
  _status?: string
}

async function fixNoCategoryProducts() {
  const MONGODB_URI = process.env.MONGODB_URI || ''
  
  console.log('🔍 分析无分类产品问题...\n')
  
  const client = new MongoClient(MONGODB_URI)
  
  try {
    await client.connect()
    const db = client.db('machrio')
    const productsCollection = db.collection('products')
    const categoriesCollection = db.collection('categories')
    
    // 获取所有无分类的发布产品
    const noCategoryProducts = await productsCollection.find({
      primaryCategory: { $exists: false },
      _status: 'published'
    }).toArray() as unknown as Product[]
    
    console.log(`发现 ${noCategoryProducts.length} 个无分类的已发布产品\n`)
    
    // 获取所有分类
    const allCategories = await categoriesCollection.find({}).toArray() as any[]
    console.log(`数据库中有 ${allCategories.length} 个分类\n`)
    
    // 分析产品名称中的关键词，尝试自动匹配分类
    const categoryKeywords: Record<string, string> = {}
    allCategories.forEach(cat => {
      const keywords = cat.name.toLowerCase().split(/\s+/)
      keywords.forEach(keyword => {
        if (keyword.length > 3) {
          categoryKeywords[keyword] = cat._id.toString()
        }
      })
    })
    
    // 为每个无分类产品推荐分类
    const productsWithSuggestions = noCategoryProducts.map(product => {
      const nameLower = product.name.toLowerCase()
      let suggestedCategoryId = null
      let matchedKeyword = null
      
      // 尝试从名称中匹配关键词
      for (const [keyword, categoryId] of Object.entries(categoryKeywords)) {
        if (nameLower.includes(keyword)) {
          suggestedCategoryId = categoryId
          matchedKeyword = keyword
          break
        }
      }
      
      return {
        ...product,
        suggestedCategoryId,
        matchedKeyword
      }
    })
    
    // 统计
    const withSuggestion = productsWithSuggestions.filter(p => p.suggestedCategoryId)
    const withoutSuggestion = productsWithSuggestions.filter(p => !p.suggestedCategoryId)
    
    console.log(`=== 分析结果 ===\n`)
    console.log(`可自动匹配分类：${withSuggestion.length} 个`)
    console.log(`需手动指定分类：${withoutSuggestion.length} 个\n`)
    
    // 显示前 20 个示例
    console.log('=== 前 20 个产品示例 ===\n')
    productsWithSuggestions.slice(0, 20).forEach((p, idx) => {
      const status = p.suggestedCategoryId ? '✅ 可自动匹配' : '⚠️  需手动指定'
      console.log(`${idx + 1}. ${p.name}`)
      console.log(`   SKU: ${p.sku}`)
      console.log(`   当前 URL: /product/${p.slug}`)
      console.log(`   状态：${status}`)
      if (p.suggestedCategoryId) {
        console.log(`   匹配关键词：${p.matchedKeyword}`)
      }
      console.log('')
    })
    
    // 保存详细报告
    const outputDir = path.resolve(__dirname, './output')
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true })
    }
    
    const reportFile = path.join(outputDir, 'no-category-products-report.json')
    fs.writeFileSync(reportFile, JSON.stringify({
      summary: {
        total: noCategoryProducts.length,
        withSuggestion: withSuggestion.length,
        withoutSuggestion: withoutSuggestion.length,
      },
      products: productsWithSuggestions.map(p => ({
        id: p._id,
        sku: p.sku,
        name: p.name,
        slug: p.slug,
        currentUrl: `/product/${p.slug}`,
        suggestedCategory: p.suggestedCategoryId ? {
          categoryId: p.suggestedCategoryId,
          matchedKeyword: p.matchedKeyword,
        } : null,
        needsManualReview: !p.suggestedCategoryId,
      }))
    }, null, 2))
    
    console.log(`✅ 详细报告已保存到：${reportFile}\n`)
    
    // 生成 MongoDB 更新脚本
    const updateScript = productsWithSuggestions
      .filter(p => p.suggestedCategoryId)
      .map(p => `
// ${p.name}
db.products.updateOne(
  { _id: "${p._id}" },
  { 
    $set: { 
      primaryCategory: "${p.suggestedCategoryId}",
      updatedAt: new Date()
    } 
  }
)`.trim())
      .join('\n\n')
    
    const updateScriptFile = path.join(outputDir, 'update-categories-mongo.js')
    fs.writeFileSync(updateScriptFile, `// MongoDB 更新脚本 - 为无分类产品添加分类\n// 使用前请务必备份数据库！\n\n${updateScript}\n`)
    
    console.log(`✅ MongoDB 更新脚本已保存到：${updateScriptFile}`)
    console.log('\n\n=== 下一步操作 ===\n')
    console.log('1. 查看详细报告：no-category-products-report.json')
    console.log('2. 审查自动匹配的分类是否正确')
    console.log('3. 对于需要手动指定的产品，在报告中补充分类 ID')
    console.log('4. 运行 MongoDB 更新脚本添加分类')
    console.log('5. 重新部署网站，系统会自动生成正确的 URL')
    console.log('\n⚠️ 警告：更新脚本会修改数据库，请务必先备份！')
    
  } catch (error) {
    console.error('分析失败:', error)
  } finally {
    await client.close()
  }
}

fixNoCategoryProducts().catch(console.error)
