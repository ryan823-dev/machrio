/**
 * 生成 301 重定向规则
 * 
 * 由于我们已经为产品添加了分类，旧的产品 URL 格式 /product/{slug} 现在会变为 /product/{category}/{slug}
 * 这个脚本生成从旧 URL 到新 URL 的 301 重定向规则
 * 
 * 使用方法:
 * npx tsx scripts/generate-301-redirects.ts
 */

import { MongoClient, ObjectId } from 'mongodb'
import * as dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'
import * as fs from 'fs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

dotenv.config({ path: path.resolve(__dirname, '../.env.local') })

interface ProductWithCategory {
  _id: string
  slug: string
  sku: string
  name: string
  primaryCategory: string
}

async function generate301Redirects() {
  const MONGODB_URI = process.env.MONGODB_URI || ''
  
  console.log('🔄 生成 301 重定向规则...\n')
  
  const client = new MongoClient(MONGODB_URI)
  
  try {
    await client.connect()
    const db = client.db('machrio')
    const productsCollection = db.collection('products')
    const categoriesCollection = db.collection('categories')
    
    // 获取所有有分类的产品
    const products = await productsCollection.find({
      primaryCategory: { $exists: true },
      _status: 'published'
    }).toArray() as unknown as ProductWithCategory[]
    
    console.log(`📊 找到 ${products.length} 个有分类的产品`)
    
    // 获取所有分类
    const categories = await categoriesCollection.find({}).toArray() as any[]
    const categoryMap = new Map<string, any>()
    categories.forEach(cat => {
      categoryMap.set(cat._id.toString(), cat)
    })
    
    // 生成重定向规则
    // 注意：我们不需要为所有产品生成重定向，只需要为那些可能被谷歌索引的旧 URL 生成
    // 由于我们无法确定哪些产品有旧 URL，我们将为所有最近更新的 274 个产品生成重定向
    
    // 读取之前的报告文件，获取需要重定向的产品
    const reportFile = path.join(__dirname, 'output', 'no-category-products-report.json')
    let redirectedProducts: any[] = []
    
    if (fs.existsSync(reportFile)) {
      const report = JSON.parse(fs.readFileSync(reportFile, 'utf-8'))
      redirectedProducts = report.products
      console.log(`📊 需要为重定向的产品：${redirectedProducts.length} 个`)
    }
    
    // 为重定向列表中的每个产品生成规则
    const redirectRules = []
    
    for (const productData of redirectedProducts) {
      const product = await productsCollection.findOne({ 
        _id: new ObjectId(productData.id) 
      }) as unknown as ProductWithCategory | null
      
      if (!product || !product.primaryCategory) {
        continue
      }
      
      const category = categoryMap.get(product.primaryCategory)
      if (!category) {
        continue
      }
      
      // 旧 URL 格式：/product/{slug}
      // 新 URL 格式：/product/{category-slug}/{slug}
      const oldUrl = `/product/${product.slug}`
      const newUrl = `/product/${category.slug}/${product.slug}`
      
      redirectRules.push({
        source: oldUrl,
        destination: newUrl,
        permanent: true,
      })
    }
    
    console.log(`\n✅ 生成了 ${redirectRules.length} 条重定向规则`)
    
    // 保存为 JSON 文件
    const outputFile = path.join(__dirname, 'output', '301-redirect-rules.json')
    fs.writeFileSync(outputFile, JSON.stringify(redirectRules, null, 2))
    
    console.log(`💾 重定向规则已保存到：${outputFile}`)
    
    // 生成 Next.js 配置代码片段
    const nextConfigCode = redirectRules.map(rule => `    {
      source: '${rule.source}',
      destination: '${rule.destination}',
      permanent: ${rule.permanent},
    }`).join(',\n')
    
    const snippetFile = path.join(__dirname, 'output', 'next-config-redirects-snippet.txt')
    fs.writeFileSync(snippetFile, `// 将此代码添加到 next.config.mjs 的 async redirects() 函数中\n\n${nextConfigCode}`)
    
    console.log(`💾 Next.js 配置代码片段已保存到：${snippetFile}`)
    
    // 显示前 10 个示例
    console.log('\n=== 前 10 个重定向示例 ===\n')
    redirectRules.slice(0, 10).forEach((rule, idx) => {
      console.log(`${idx + 1}. ${rule.source}`)
      console.log(`   → ${rule.destination}`)
      console.log('')
    })
    
    console.log('\n⚠️ 下一步操作：')
    console.log('1. 审查生成的重定向规则是否正确')
    console.log('2. 将重定向规则添加到 next.config.mjs')
    console.log('3. 本地测试重定向是否正常工作')
    console.log('4. 部署到 Preview 环境进行验证')
    
  } catch (error) {
    console.error('生成失败:', error)
  } finally {
    await client.close()
  }
}

generate301Redirects().catch(console.error)
