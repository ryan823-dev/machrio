/**
 * 生成无分类产品到有分类产品的 301 重定向
 * 
 * 使用方法:
 * npx tsx scripts/generate-product-redirects.ts
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
  updatedAt?: string
  _status?: string
}

async function generateRedirects() {
  const MONGODB_URI = process.env.MONGODB_URI || ''
  
  console.log('🔍 分析产品重复 URL 问题...\n')
  
  const client = new MongoClient(MONGODB_URI)
  
  try {
    await client.connect()
    const db = client.db('machrio')
    const productsCollection = db.collection('products')
    
    // 获取所有发布的产品
    const allProducts = await productsCollection.find({
      _status: 'published'
    }).toArray() as unknown as Product[]
    
    console.log(`总发布产品数：${allProducts.length}`)
    
    // 按 SKU 分组
    const skuGroups = new Map<string, Product[]>()
    allProducts.forEach(product => {
      if (!skuGroups.has(product.sku)) {
        skuGroups.set(product.sku, [])
      }
      skuGroups.get(product.sku)!.push(product)
    })
    
    // 找出需要重定向的产品对
    const redirectPairs: Array<{
      oldProduct: Product
      newProduct: Product
      reason: string
    }> = []
    
    for (const [sku, products] of skuGroups.entries()) {
      if (products.length === 1) continue
      
      // 分离有分类和无分类的产品
      const withCategory = products.filter(p => p.primaryCategory)
      const withoutCategory = products.filter(p => !p.primaryCategory)
      
      if (withoutCategory.length > 0 && withCategory.length > 0) {
        // 找到最新的有分类产品作为目标
        const newestWithCategory = withCategory.sort((a, b) => {
          return new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime()
        })[0]
        
        // 所有无分类的都需要重定向
        withoutCategory.forEach(oldProduct => {
          redirectPairs.push({
            oldProduct,
            newProduct: newestWithCategory,
            reason: '无分类旧版本 → 有分类新版本'
          })
        })
      }
    }
    
    console.log(`\n发现 ${redirectPairs.length} 个需要重定向的旧产品 URL\n`)
    
    // 生成重定向规则
    const redirects = redirectPairs.map(({ oldProduct, newProduct }) => {
      const oldUrl = `/product/${oldProduct.slug}`
      const newUrl = `/product/${newProduct.primaryCategory}/${newProduct.slug}`
      
      return {
        source: oldUrl,
        destination: newUrl,
        permanent: true,
        metadata: {
          oldProductId: oldProduct._id,
          newProductId: newProduct._id,
          sku: oldProduct.sku,
          name: oldProduct.name,
        }
      }
    })
    
    // 保存重定向规则
    const outputDir = path.resolve(__dirname, '../scripts/output')
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true })
    }
    
    const outputFile = path.join(outputDir, 'product-url-redirects.json')
    fs.writeFileSync(outputFile, JSON.stringify(redirects, null, 2))
    
    console.log(`✅ 重定向规则已保存到：${outputFile}`)
    console.log(`📊 共 ${redirects.length} 条规则\n`)
    
    // 显示前 10 个示例
    console.log('=== 前 10 个重定向示例 ===\n')
    redirects.slice(0, 10).forEach((r, idx) => {
      console.log(`${idx + 1}. ${r.metadata.name}`)
      console.log(`   SKU: ${r.metadata.sku}`)
      console.log(`   旧 URL: ${r.source}`)
      console.log(`   新 URL: ${r.destination}`)
      console.log('')
    })
    
    // 生成 next.config.mjs 代码片段
    const configCode = redirects.map(r => 
      `    { source: '${r.source}', destination: '${r.destination}', permanent: true }`
    ).join(',\n')
    
    const configOutput = path.join(outputDir, 'next-config-redirects-snippet.txt')
    fs.writeFileSync(configOutput, configCode)
    console.log(`✅ Next.js 配置代码片段已保存到：${configOutput}`)
    
    // 生成清理脚本
    const cleanupScript = redirects.map(r => 
      `db.products.deleteOne({ _id: "${r.metadata.oldProductId}" })`
    ).join('\n')
    
    const cleanupOutput = path.join(outputDir, 'cleanup-old-products-mongo.js')
    fs.writeFileSync(cleanupOutput, `// MongoDB 清理脚本\n// 使用前请务必备份数据库！\n\n${cleanupScript}\n`)
    console.log(`✅ 清理脚本已保存到：${cleanupOutput}`)
    
    console.log('\n\n=== 下一步操作 ===\n')
    console.log('1. 审查生成的重定向规则')
    console.log('2. 将重定向规则添加到 next.config.mjs')
    console.log('3. 部署并测试重定向')
    console.log('4. 确认无误后，运行清理脚本删除旧产品')
    console.log('\n⚠️ 警告：清理脚本会永久删除数据，请务必先备份！')
    
  } catch (error) {
    console.error('生成失败:', error)
  } finally {
    await client.close()
  }
}

generateRedirects().catch(console.error)
