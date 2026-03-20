/**
 * 修复剩余 3 个无分类产品
 */

import { MongoClient, ObjectId } from 'mongodb'
import * as dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

dotenv.config({ path: path.resolve(__dirname, '../.env.local') })

async function fixRemaining3Products() {
  const MONGODB_URI = process.env.MONGODB_URI || ''
  
  console.log('🔧 修复剩余 3 个无分类产品...\n')
  
  const client = new MongoClient(MONGODB_URI)
  
  try {
    await client.connect()
    const db = client.db('machrio')
    const productsCollection = db.collection('products')
    const categoriesCollection = db.collection('categories')
    
    // 获取 work-platforms 分类
    const category = await categoriesCollection.findOne({ slug: 'work-platforms' })
    
    if (!category) {
      console.error('❌ 错误：找不到 work-platforms 分类')
      return
    }
    
    console.log(`✅ 使用分类：${category.name} (${category.slug})`)
    console.log(`   ID: ${category._id}\n`)
    
    // 剩余 3 个产品的 ID
    const productIds = [
      '69a304338f9bd9b91fc96b78', // MACH-AE2485310
      '69a304428f9bd9b91fc96bae', // MACH-AE8203710
      '69a304518f9bd9b91fc96be4', // MACH-AE2485313
    ]
    
    let updatedCount = 0
    
    for (const id of productIds) {
      const result = await productsCollection.updateOne(
        { _id: new ObjectId(id) },
        { 
          $set: { 
            primaryCategory: category._id.toString(),
            updatedAt: new Date()
          } 
        }
      )
      
      if (result.modifiedCount > 0) {
        updatedCount++
        console.log(`✅ 更新产品 ${id}`)
      }
    }
    
    console.log(`\n✅ 成功更新 ${updatedCount}/${productIds.length} 个产品`)
    
    // 验证所有产品现在都有分类了
    const remainingCount = await productsCollection.countDocuments({
      primaryCategory: { $exists: false },
      _status: 'published'
    })
    
    console.log(`\n📊 验证结果：`)
    console.log(`   剩余无分类产品：${remainingCount} 个`)
    
    if (remainingCount === 0) {
      console.log('\n🎉 所有产品都已成功添加分类！')
    }
    
  } catch (error) {
    console.error('更新失败:', error)
  } finally {
    await client.close()
  }
}

fixRemaining3Products().catch(console.error)
