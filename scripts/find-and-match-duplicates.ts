/**
 * 匹配旧产品和新产品，生成301重定向规则
 * 
 * 逻辑：
 * 1. 从报告中获取274个无分类的旧产品
 * 2. 通过产品名称末尾的代码（如 h-8247, MACH-8247）匹配有分类的新版本
 * 3. 生成从旧URL到新URL的301重定向
 */

import { MongoClient, ObjectId } from 'mongodb'
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
}

interface RedirectRule {
  source: string
  destination: string
  permanent: boolean
  oldProduct: Product
  newProduct?: Product
  matchMethod: string
}

async function findAndMatchDuplicates() {
  const MONGODB_URI = process.env.MONGODB_URI || ''
  
  console.log('🔍 开始匹配旧产品和新产品...\n')
  
  const client = new MongoClient(MONGODB_URI)
  
  try {
    await client.connect()
    const db = client.db('machrio')
    const productsCollection = db.collection('products')
    const categoriesCollection = db.collection('categories')
    
    // 获取所有分类
    const categories = await categoriesCollection.find({}).toArray() as any[]
    const categoryMap = new Map<string, any>()
    categories.forEach(cat => {
      categoryMap.set(cat._id.toString(), cat)
    })
    
    // 获取报告中的274个旧产品
    const reportFile = path.join(__dirname, 'output', 'no-category-products-report.json')
    const report = JSON.parse(fs.readFileSync(reportFile, 'utf-8'))
    
    console.log(`📊 从报告中加载了 ${report.products.length} 个旧产品\n`)
    
    // 为每个旧产品提取匹配代码
    const redirectRules: RedirectRule[] = []
    
    // 辅助函数：从产品名称或SKU中提取匹配代码
    function extractMatchCode(product: any): string[] {
      const codes: string[] = []
      
      // 从SKU提取，例如 MACH-8247 -> 8247
      if (product.sku) {
        const skuMatch = product.sku.match(/(\d+)$/)
        if (skuMatch) codes.push(skuMatch[1])
      }
      
      // 从slug末尾提取，例如 xxx-h-8247 -> 8247
      if (product.slug) {
        const slugMatch = product.slug.match(/(?:h-)?(\d+)$/)
        if (slugMatch) codes.push(slugMatch[1])
      }
      
      return codes
    }
    
    // 处理每个旧产品
    for (const oldProductData of report.products) {
      const oldProduct = await productsCollection.findOne({ 
        _id: new ObjectId(oldProductData.id) 
      }) as unknown as Product
      
      if (!oldProduct) continue
      
      const matchCodes = extractMatchCode(oldProduct)
      const redirectRule: RedirectRule = {
        source: `/product/${oldProduct.slug}`,
        destination: '',
        permanent: true,
        oldProduct: oldProduct,
        matchMethod: 'not_found',
      }
      
      // 尝试通过匹配代码找到新产品
      for (const code of matchCodes) {
        // 在有分类的产品中搜索匹配
        const newProducts = await productsCollection.find({
          primaryCategory: { $exists: true },
          _status: 'published',
          $or: [
            { sku: { $regex: code } },
            { slug: { $regex: code } }
          ]
        }).limit(5).toArray() as unknown as Product[]
        
        // 找到最佳匹配
        for (const candidate of newProducts) {
          if (candidate._id.toString() === oldProduct._id.toString()) continue
          
          // 验证匹配：产品名称相似
          const oldNameLower = oldProduct.name.toLowerCase()
          const newNameLower = candidate.name.toLowerCase()
          
          // 检查名称前50个字符是否相似
          const oldNamePrefix = oldNameLower.substring(0, Math.min(50, oldNameLower.length))
          const newNamePrefix = newNameLower.substring(0, Math.min(50, newNameLower.length))
          
          if (oldNamePrefix === newNamePrefix || oldNamePrefix.includes(newNamePrefix) || newNamePrefix.includes(oldNamePrefix)) {
            const category = categoryMap.get(candidate.primaryCategory)
            redirectRule.destination = `/product/${category?.slug || 'unknown'}/${candidate.slug}`
            redirectRule.newProduct = candidate
            redirectRule.matchMethod = `matched_by_code_${code}`
            break
          }
        }
        
        if (redirectRule.newProduct) break
      }
      
      // 如果找不到匹配的新产品，但旧产品现在有分类了
      if (!redirectRule.newProduct && oldProduct.primaryCategory) {
        const category = categoryMap.get(oldProduct.primaryCategory)
        redirectRule.destination = `/product/${category?.slug || 'unknown'}/${oldProduct.slug}`
        redirectRule.matchMethod = 'old_product_now_has_category'
      }
      
      redirectRules.push(redirectRule)
    }
    
    // 统计
    const matchedCount = redirectRules.filter(r => r.newProduct).length
    const selfRedirectCount = redirectRules.filter(r => r.matchMethod === 'old_product_now_has_category').length
    const unmatchedCount = redirectRules.filter(r => !r.destination).length
    
    console.log('\n=== 匹配结果 ===\n')
    console.log(`✅ 找到新产品并匹配：${matchedCount} 个`)
    console.log(`🔄 旧产品已有分类（自重定向）：${selfRedirectCount} 个`)
    console.log(`❌ 无法匹配：${unmatchedCount} 个`)
    console.log(`📊 总计：${redirectRules.length} 个\n`)
    
    // 只保留有效的重定向规则
    const validRedirects = redirectRules
      .filter(r => r.destination && r.source !== r.destination)
      .map(r => ({
        source: r.source,
        destination: r.destination,
        permanent: true,
      }))
    
    console.log(`📝 有效的重定向规则：${validRedirects.length} 条\n`)
    
    // 显示前10个示例
    console.log('=== 前 10 个重定向示例 ===\n')
    redirectRules.slice(0, 10).forEach((rule, idx) => {
      console.log(`${idx + 1}. [${rule.matchMethod}]`)
      console.log(`   FROM: ${rule.source}`)
      console.log(`   TO:   ${rule.destination}`)
      if (rule.newProduct) {
        console.log(`   新产品: ${rule.newProduct.name}`)
      }
      console.log('')
    })
    
    // 保存结果
    const outputFile = path.join(__dirname, 'output', 'matched-redirect-rules.json')
    fs.writeFileSync(outputFile, JSON.stringify(validRedirects, null, 2))
    console.log(`💾 重定向规则已保存到：${outputFile}`)
    
    // 生成Next.js配置代码
    const nextConfigCode = validRedirects.map(rule => `    {
      source: '${rule.source}',
      destination: '${rule.destination}',
      permanent: true,
    }`).join(',\n')
    
    const snippetFile = path.join(__dirname, 'output', 'next-config-redirects-snippet.txt')
    fs.writeFileSync(snippetFile, `// 301 重定向规则 - 添加到 next.config.mjs\n// 生成时间：${new Date().toISOString()}\n// 规则数量：${validRedirects.length}\n\n${nextConfigCode}`)
    
    console.log(`💾 Next.js配置代码已保存到：${snippetFile}`)
    
  } catch (error) {
    console.error('执行失败:', error)
  } finally {
    await client.close()
  }
}

findAndMatchDuplicates().catch(console.error)
