/**
 * 验证分类是否存在
 */

import { MongoClient, ObjectId } from 'mongodb'
import * as dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

dotenv.config({ path: path.resolve(__dirname, '../.env.local') })

async function verifyCategory() {
  const MONGODB_URI = process.env.MONGODB_URI || ''
  
  const client = new MongoClient(MONGODB_URI)
  
  try {
    await client.connect()
    const db = client.db('machrio')
    const categoriesCollection = db.collection('categories')
    
    // 检查报告中使用的第一个分类 ID
    const categoryId = "69a50eedd1138dde5e717f34"
    
    const category = await categoriesCollection.findOne({ 
      _id: new ObjectId(categoryId) 
    })
    
    if (category) {
      console.log('✅ 分类存在:')
      console.log(`   名称：${category.name}`)
      console.log(`   Slug: ${category.slug}`)
      console.log(`   ID: ${category._id}`)
    } else {
      console.log('❌ 分类不存在:', categoryId)
      
      // 尝试查找名称中包含 "cleaning" 的分类
      const similarCategories = await categoriesCollection.find({
        name: { $regex: /cleaning/i }
      }).toArray()
      
      console.log('\n类似的分类:')
      similarCategories.forEach(cat => {
        console.log(`   - ${cat.name} (${cat.slug}) - ID: ${cat._id}`)
      })
    }
    
    // 同时检查产品是否已经有分类
    const productsCollection = db.collection('products')
    const productId = "69a2f7388f9bd9b91fc93df1"
    
    const product = await productsCollection.findOne({ 
      _id: new ObjectId(productId) 
    })
    
    console.log('\n产品状态:')
    if (product) {
      console.log(`   SKU: ${product.sku}`)
      console.log(`   Name: ${product.name}`)
      console.log(`   Has primaryCategory: ${!!product.primaryCategory}`)
      if (product.primaryCategory) {
        console.log(`   primaryCategory: ${product.primaryCategory}`)
      }
    } else {
      console.log('   ❌ 产品不存在')
    }
    
  } catch (error) {
    console.error('验证失败:', error)
  } finally {
    await client.close()
  }
}

verifyCategory().catch(console.error)
