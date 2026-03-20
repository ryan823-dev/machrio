/**
 * 查找剩余的无分类产品
 */

import { MongoClient } from 'mongodb'
import * as dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

dotenv.config({ path: path.resolve(__dirname, '../.env.local') })

async function findRemainingProducts() {
  const MONGODB_URI = process.env.MONGODB_URI || ''
  
  const client = new MongoClient(MONGODB_URI)
  
  try {
    await client.connect()
    const db = client.db('machrio')
    const productsCollection = db.collection('products')
    
    // 查询剩余的无分类产品
    const remainingProducts = await productsCollection.find({
      primaryCategory: { $exists: false },
      _status: 'published'
    }).limit(10).toArray() as any[]
    
    console.log(`📊 剩余 ${remainingProducts.length} 个无分类产品:\n`)
    
    remainingProducts.forEach((p, idx) => {
      console.log(`${idx + 1}. ${p.name}`)
      console.log(`   SKU: ${p.sku}`)
      console.log(`   ID: ${p._id}`)
      console.log(`   Slug: ${p.slug}`)
      console.log('')
    })
    
  } catch (error) {
    console.error('查询失败:', error)
  } finally {
    await client.close()
  }
}

findRemainingProducts().catch(console.error)
