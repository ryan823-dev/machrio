/**
 * 快速验证更新结果
 */

import { MongoClient } from 'mongodb'
import * as dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

dotenv.config({ path: path.resolve(__dirname, '../.env.local') })

async function quickVerify() {
  const MONGODB_URI = process.env.MONGODB_URI || ''
  
  const client = new MongoClient(MONGODB_URI)
  
  try {
    await client.connect()
    const db = client.db('machrio')
    const productsCollection = db.collection('products')
    
    // 查询之前需要更新的 274 个产品中有多少现在有分类了
    const reportProductIds = [
      "69a2f7388f9bd9b91fc93df1", "69a2f73b8f9bd9b91fc93dfa", "69a2f73d8f9bd9b91fc93e03",
      "69a2f8988f9bd9b91fc942c2", "69a2f96f8f9bd9b91fc945b6",
      "69a2feb38f9bd9b91fc95822",
      "69a2ffb78f9bd9b91fc95bb8", "69a3000c8f9bd9b91fc95ce1", "69a300218f9bd9b91fc95d29",
      "69a303aa8f9bd9b91fc96992", "69a303f98f9bd9b91fc96aa9", "69a304008f9bd9b91fc96ac4",
      "69a304218f9bd9b91fc96b39", "69a304298f9bd9b91fc96b54"
    ]
    
    let withCategory = 0
    let withoutCategory = 0
    
    for (const id of reportProductIds) {
      const product = await productsCollection.findOne({ _id: id })
      if (product && product.primaryCategory) {
        withCategory++
      } else {
        withoutCategory++
      }
    }
    
    console.log(`\n✅ 有分类的产品：${withCategory} 个`)
    console.log(`❌ 无分类的产品：${withoutCategory} 个`)
    
    // 随机显示一个示例
    const sampleProduct = await productsCollection.findOne({ 
      _id: "69a2f7388f9bd9b91fc93df1" 
    })
    
    if (sampleProduct && sampleProduct.primaryCategory) {
      const category = await db.collection('categories').findOne({ 
        _id: sampleProduct.primaryCategory 
      })
      
      console.log(`\n📋 示例产品:`)
      console.log(`   SKU: ${sampleProduct.sku}`)
      console.log(`   Name: ${sampleProduct.name}`)
      console.log(`   Category: ${category?.name}`)
      console.log(`   New URL: /product/${category?.slug}/${sampleProduct.slug}`)
    }
    
  } catch (error) {
    console.error('验证失败:', error)
  } finally {
    await client.close()
  }
}

quickVerify().catch(console.error)
