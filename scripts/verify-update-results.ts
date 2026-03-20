/**
 * 验证更新结果
 */

import { MongoClient, ObjectId } from 'mongodb'
import * as dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'
import * as fs from 'fs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

dotenv.config({ path: path.resolve(__dirname, '../.env.local') })

async function verifyUpdateResults() {
  const MONGODB_URI = process.env.MONGODB_URI || ''
  
  const client = new MongoClient(MONGODB_URI)
  
  try {
    await client.connect()
    const db = client.db('machrio')
    const productsCollection = db.collection('products')
    
    // 获取报告文件
    const reportFile = path.join(__dirname, 'output', 'no-category-products-report.json')
    const report = JSON.parse(fs.readFileSync(reportFile, 'utf-8'))
    
    console.log('📊 验证更新结果...\n')
    
    let updatedCount = 0
    let notUpdatedCount = 0
    
    for (const product of report.products) {
      const existingProduct = await productsCollection.findOne({ 
        _id: new ObjectId(product.id) 
      })
      
      if (existingProduct && existingProduct.primaryCategory) {
        updatedCount++
        if (updatedCount <= 5) {
          console.log(`✅ ${product.sku} - 已更新`)
        }
      } else {
        notUpdatedCount++
        console.log(`❌ ${product.sku} - 未更新`)
      }
    }
    
    console.log(`\n=== 统计 ===\n`)
    console.log(`✅ 已更新：${updatedCount} 个产品`)
    console.log(`❌ 未更新：${notUpdatedCount} 个产品`)
    console.log(`📊 总计：${report.products.length} 个产品`)
    
    // 随机抽查 5 个产品的详细信息
    console.log('\n=== 随机抽查示例 ===\n')
    const randomProducts = report.products.sort(() => Math.random() - 0.5).slice(0, 5)
    
    for (const product of randomProducts) {
      const existingProduct = await productsCollection.findOne({ 
        _id: new ObjectId(product.id) 
      })
      
      if (existingProduct && existingProduct.primaryCategory) {
        const category = await db.collection('categories').findOne({ 
          _id: new ObjectId(existingProduct.primaryCategory) 
        })
        
        console.log(`✅ ${product.name}`)
        console.log(`   SKU: ${product.sku}`)
        console.log(`   新分类：${category?.name || 'Unknown'}`)
        console.log(`   新 URL: /product/${category?.slug || '?'}/${product.slug}`)
        console.log('')
      }
    }
    
  } catch (error) {
    console.error('验证失败:', error)
  } finally {
    await client.close()
  }
}

verifyUpdateResults().catch(console.error)
