/**
 * 批量更新产品分类
 * 
 * 使用方法:
 * npx tsx scripts/batch-update-categories.ts
 */

import { MongoClient, ObjectId } from 'mongodb'
import * as dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'
import * as fs from 'fs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

dotenv.config({ path: path.resolve(__dirname, '../.env.local') })

async function batchUpdateCategories() {
  const MONGODB_URI = process.env.MONGODB_URI || ''
  
  console.log('🚀 开始批量更新产品分类...\n')
  
  const client = new MongoClient(MONGODB_URI)
  
  try {
    await client.connect()
    console.log('✅ 数据库连接成功\n')
    
    const db = client.db('machrio')
    const productsCollection = db.collection('products')
    
    // 获取报告文件
    const reportFile = path.join(__dirname, 'output', 'no-category-products-report.json')
    if (!fs.existsSync(reportFile)) {
      console.error('❌ 错误：找不到报告文件', reportFile)
      return
    }
    
    const report = JSON.parse(fs.readFileSync(reportFile, 'utf-8'))
    
    console.log(`📊 报告中有 ${report.products.length} 个产品需要更新\n`)
    
    // 准备批量操作
    const bulkOperations = []
    
    // 手动指定的 14 个产品
    const manualMappings: Record<string, string> = {
      '69a2f8988f9bd9b91fc942c2': 'plumbing',
      '69a2f96f8f9bd9b91fc945b6': 'plumbing',
      '69a2feb38f9bd9b91fc95822': 'cleaning-and-janitorial',
      '69a2ffb78f9bd9b91fc95bb8': 'protective-packaging',
      '69a3000c8f9bd9b91fc95ce1': 'protective-packaging',
      '69a300218f9bd9b91fc95d29': 'protective-packaging',
      '69a303aa8f9bd9b91fc96992': 'work-platforms',
      '69a303f98f9bd9b91fc96aa9': 'work-platforms',
      '69a304008f9bd9b91fc96ac4': 'work-platforms',
      '69a304218f9bd9b91fc96b39': 'work-platforms',
      '69a304298f9bd9b91fc96b54': 'work-platforms',
    }
    
    // 预先加载所有需要用到的分类
    const categoriesCollection = db.collection('categories')
    const uniqueSlugs = Array.from(new Set(Object.values(manualMappings)))
    const slugToCategoryMap: Record<string, string> = {}
    
    for (const slug of uniqueSlugs) {
      const category = await categoriesCollection.findOne({ slug })
      if (category) {
        slugToCategoryMap[slug] = category._id.toString()
      }
    }
    
    for (const product of report.products) {
      // 确定使用哪个分类 ID
      let categoryId: string | null = null
      
      // 注意：报告中的字段是 suggestedCategory.categoryId（嵌套结构）
      if (product.suggestedCategory && product.suggestedCategory.categoryId) {
        categoryId = product.suggestedCategory.categoryId
      }
      
      if (!categoryId && manualMappings[product.id]) {
        categoryId = slugToCategoryMap[manualMappings[product.id]] || null
      }
      
      if (categoryId) {
        bulkOperations.push({
          updateOne: {
            filter: { _id: new ObjectId(product.id) },
            update: {
              $set: {
                primaryCategory: categoryId,
                updatedAt: new Date()
              }
            }
          }
        })
      }
    }
    
    console.log(`⚙️  准备了 ${bulkOperations.length} 个更新操作\n`)
    
    if (bulkOperations.length === 0) {
      console.log('⚠️  没有需要更新的产品')
      return
    }
    
    // 执行批量更新（分批执行，每批 100 个）
    const BATCH_SIZE = 100
    let totalUpdated = 0
    
    for (let i = 0; i < bulkOperations.length; i += BATCH_SIZE) {
      const batch = bulkOperations.slice(i, i + BATCH_SIZE)
      const result = await productsCollection.bulkWrite(batch)
      totalUpdated += result.modifiedCount
      
      console.log(`📝 批次 ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(bulkOperations.length / BATCH_SIZE)} - 更新了 ${result.modifiedCount} 个产品`)
    }
    
    console.log(`\n✅ 批量更新完成！`)
    console.log(`   总共更新：${totalUpdated} 个产品`)
    console.log(`   报告总数：${report.products.length} 个产品`)
    
    // 生成执行报告
    const executionReport = {
      timestamp: new Date().toISOString(),
      summary: {
        totalInReport: report.products.length,
        operationsPrepared: bulkOperations.length,
        successfullyUpdated: totalUpdated,
      }
    }
    
    const reportOutputFile = path.join(__dirname, 'output', 'batch-execution-report.json')
    fs.writeFileSync(reportOutputFile, JSON.stringify(executionReport, null, 2))
    
    console.log(`\n💾 执行报告已保存到：${reportOutputFile}`)
    
    console.log('\n⚠️ 下一步操作：')
    console.log('1. 随机抽查几个产品，确认分类已正确添加')
    console.log('2. 测试产品页面 URL 是否正确包含分类路径')
    console.log('3. 生成 301 重定向规则')
    console.log('4. 部署到 Preview 环境进行测试')
    
  } catch (error) {
    console.error('执行失败:', error)
  } finally {
    await client.close()
    console.log('\n👋 数据库连接已关闭')
  }
}

batchUpdateCategories().catch(console.error)
