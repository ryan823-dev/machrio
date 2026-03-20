/**
 * 为需要手动指定的产品添加分类
 * 
 * 使用方法:
 * npx tsx scripts/add-manual-categories.ts
 */

import { MongoClient } from 'mongodb'
import * as dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'
import * as fs from 'fs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

dotenv.config({ path: path.resolve(__dirname, '../.env.local') })

// 手动指定的分类映射
const MANUAL_CATEGORIES: Record<string, string> = {
  // PVC 排水管配件 -> Plumbing
  '69a2f8988f9bd9b91fc942c2': 'plumbing', // PVC Drainage Elbow
  '69a2f96f8f9bd9b91fc945b6': 'plumbing', // PVC Drainage Elbow
  
  // 扫帚 -> Cleaning and Janitorial
  '69a2feb38f9bd9b91fc95822': 'cleaning-and-janitorial', // Extended sorghum broom
  
  // 防锈袋/防静电袋 -> Protective Packaging
  '69a2ffb78f9bd9b91fc95bb8': 'protective-packaging', // VCI rust inhibitor PE bag
  '69a3000c8f9bd9b91fc95ce1': 'protective-packaging', // Anti static PE bag blue
  '69a300218f9bd9b91fc95d29': 'protective-packaging', // Anti static PE bag pink
  
  // 平台车/手推车 -> Work Platforms
  '69a303aa8f9bd9b91fc96992': 'work-platforms', // Turtle Platform Truck
  '69a303f98f9bd9b91fc96aa9': 'work-platforms', // Platform Truck CSR 18
  '69a304008f9bd9b91fc96ac4': 'work-platforms', // Anti Static Heavy Duty Cart
  '69a304218f9bd9b91fc96b39': 'work-platforms', // Iron Platform Truck QH07002
  '69a304298f9bd9b91fc96b54': 'work-platforms', // Iron Platform Truck QH07001
}

async function addManualCategories() {
  const MONGODB_URI = process.env.MONGODB_URI || ''
  
  console.log('🔧 为需要手动指定的产品添加分类...\n')
  
  const client = new MongoClient(MONGODB_URI)
  
  try {
    await client.connect()
    const db = client.db('machrio')
    const productsCollection = db.collection('products')
    const categoriesCollection = db.collection('categories')
    
    // 获取所有分类的 slug 到 ID 的映射
    const allCategories = await categoriesCollection.find({}).toArray() as any[]
    const categorySlugToId: Record<string, string> = {}
    allCategories.forEach(cat => {
      if (cat.slug) {
        categorySlugToId[cat.slug] = cat._id.toString()
      }
    })
    
    // 验证所有需要的分类都存在
    const missingCategories: string[] = []
    for (const slug of Object.values(MANUAL_CATEGORIES)) {
      if (!categorySlugToId[slug]) {
        missingCategories.push(slug)
      }
    }
    
    if (missingCategories.length > 0) {
      console.error(`❌ 错误：以下分类不存在：${missingCategories.join(', ')}`)
      console.error('请先在系统中创建这些分类')
      return
    }
    
    // 更新产品
    let updatedCount = 0
    for (const [productId, categorySlug] of Object.entries(MANUAL_CATEGORIES)) {
      const categoryId = categorySlugToId[categorySlug]
      
      const result = await productsCollection.updateOne(
        { _id: productId },
        { 
          $set: { 
            primaryCategory: categoryId,
            updatedAt: new Date()
          } 
        }
      )
      
      if (result.modifiedCount > 0) {
        updatedCount++
        console.log(`✅ 更新产品 ${productId} -> ${categorySlug}`)
      }
    }
    
    console.log(`\n✅ 成功更新 ${updatedCount} 个产品的分类`)
    
    // 生成备份脚本
    const backupScript = Object.entries(MANUAL_CATEGORIES).map(([productId, categorySlug]) => `
// 回滚产品 ${productId}
db.products.updateOne(
  { _id: "${productId}" },
  { 
    $unset: { primaryCategory: "" },
    $set: { updatedAt: new Date() }
  }
)`).join('\n')
    
    const backupFile = path.join(__dirname, 'output', 'rollback-manual-categories.js')
    fs.writeFileSync(backupFile, `// 回滚脚本 - 撤销手动分类更新\n// 使用前请务必备份数据库！\n\n${backupScript}\n`)
    
    console.log(`\n💾 回滚脚本已保存到：${backupFile}`)
    console.log('\n⚠️ 重要提示：')
    console.log('1. 请在执行更新前确保已备份数据库')
    console.log('2. 更新后请测试产品页面是否正常显示')
    console.log('3. 如需回滚，请使用生成的回滚脚本')
    
  } catch (error) {
    console.error('更新失败:', error)
  } finally {
    await client.close()
  }
}

addManualCategories().catch(console.error)
