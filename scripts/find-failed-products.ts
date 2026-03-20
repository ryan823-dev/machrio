/**
 * 查找未能更新的产品
 */

import { MongoClient, ObjectId } from 'mongodb'
import * as dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'
import * as fs from 'fs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

dotenv.config({ path: path.resolve(__dirname, '../.env.local') })

async function findFailedProducts() {
  const MONGODB_URI = process.env.MONGODB_URI || ''
  
  const client = new MongoClient(MONGODB_URI)
  
  try {
    await client.connect()
    const db = client.db('machrio')
    const productsCollection = db.collection('products')
    
    // 获取报告文件
    const reportFile = path.join(__dirname, 'output', 'no-category-products-report.json')
    const report = JSON.parse(fs.readFileSync(reportFile, 'utf-8'))
    
    // 检查哪些产品仍然没有分类
    const failedProducts = []
    
    for (const product of report.products) {
      const existingProduct = await productsCollection.findOne({ 
        _id: new ObjectId(product.id) 
      })
      
      if (!existingProduct || !existingProduct.primaryCategory) {
        failedProducts.push({
          id: product.id,
          sku: product.sku,
          name: product.name,
          hasSuggestedCategory: !!product.suggestedCategory,
        })
      }
    }
    
    console.log(`❌ 找到 ${failedProducts.length} 个未能更新的产品:\n`)
    
    failedProducts.forEach((p, idx) => {
      console.log(`${idx + 1}. ${p.name}`)
      console.log(`   SKU: ${p.sku}`)
      console.log(`   ID: ${p.id}`)
      console.log(`   Has Suggested Category: ${p.hasSuggestedCategory}`)
      console.log('')
    })
    
  } catch (error) {
    console.error('查询失败:', error)
  } finally {
    await client.close()
  }
}

findFailedProducts().catch(console.error)
