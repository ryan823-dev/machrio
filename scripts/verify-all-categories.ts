/**
 * 验证报告中所有建议的分类 ID 是否存在
 */

import { MongoClient, ObjectId } from 'mongodb'
import * as dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'
import * as fs from 'fs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

dotenv.config({ path: path.resolve(__dirname, '../.env.local') })

async function verifyAllCategories() {
  const MONGODB_URI = process.env.MONGODB_URI || ''
  
  const client = new MongoClient(MONGODB_URI)
  
  try {
    await client.connect()
    const db = client.db('machrio')
    const categoriesCollection = db.collection('categories')
    
    // 获取报告文件
    const reportFile = path.join(__dirname, 'output', 'no-category-products-report.json')
    const report = JSON.parse(fs.readFileSync(reportFile, 'utf-8'))
    
    // 收集所有唯一的分类 ID
    const uniqueCategoryIds = new Set<string>()
    report.products.forEach((product: any) => {
      if (product.suggestedCategoryId) {
        uniqueCategoryIds.add(product.suggestedCategoryId)
      }
    })
    
    console.log(`📊 发现 ${uniqueCategoryIds.size} 个唯一的分类 ID\n`)
    
    // 验证每个分类是否存在
    const existingCategories: string[] = []
    const missingCategories: string[] = []
    
    for (const categoryId of Array.from(uniqueCategoryIds)) {
      const category = await categoriesCollection.findOne({ 
        _id: new ObjectId(categoryId) 
      })
      
      if (category) {
        existingCategories.push(categoryId)
      } else {
        missingCategories.push(categoryId)
      }
    }
    
    console.log(`✅ 存在的分类：${existingCategories.length} 个`)
    console.log(`❌ 不存在的分类：${missingCategories.length} 个\n`)
    
    if (missingCategories.length > 0) {
      console.log('不存在的分类 ID 列表:')
      missingCategories.forEach(id => console.log(`   - ${id}`))
      console.log('')
    }
    
    // 统计有多少产品可以使用现有分类
    const productsWithValidCategory = report.products.filter((p: any) => 
      p.suggestedCategoryId && existingCategories.includes(p.suggestedCategoryId)
    )
    
    console.log(`📊 可以更新的产品数量：${productsWithValidCategory.length} 个`)
    console.log(`📊 无法更新的产品数量：${report.products.length - productsWithValidCategory.length} 个`)
    
  } catch (error) {
    console.error('验证失败:', error)
  } finally {
    await client.close()
  }
}

verifyAllCategories().catch(console.error)
