/**
 * 执行所有产品分类更新
 * 
 * 使用方法:
 * npx tsx scripts/execute-all-updates.ts
 */

import { MongoClient, ObjectId } from 'mongodb'
import * as dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'
import * as fs from 'fs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

dotenv.config({ path: path.resolve(__dirname, '../.env.local') })

// 手动指定的分类映射（补充自动匹配未覆盖的 14 个产品）
const MANUAL_CATEGORIES: Record<string, string> = {
  // PVC 排水管配件 -> Plumbing
  '69a2f8988f9bd9b91fc942c2': 'plumbing',
  '69a2f96f8f9bd9b91fc945b6': 'plumbing',
  
  // 扫帚 -> Cleaning and Janitorial
  '69a2feb38f9bd9b91fc95822': 'cleaning-and-janitorial',
  
  // 防锈袋/防静电袋 -> Protective Packaging
  '69a2ffb78f9bd9b91fc95bb8': 'protective-packaging',
  '69a3000c8f9bd9b91fc95ce1': 'protective-packaging',
  '69a300218f9bd9b91fc95d29': 'protective-packaging',
  
  // 平台车/手推车 -> Work Platforms
  '69a303aa8f9bd9b91fc96992': 'work-platforms',
  '69a303f98f9bd9b91fc96aa9': 'work-platforms',
  '69a304008f9bd9b91fc96ac4': 'work-platforms',
  '69a304218f9bd9b91fc96b39': 'work-platforms',
  '69a304298f9bd9b91fc96b54': 'work-platforms',
}

async function executeAllUpdates() {
  const MONGODB_URI = process.env.MONGODB_URI || ''
  
  console.log('🚀 开始执行产品分类更新...\n')
  
  const client = new MongoClient(MONGODB_URI)
  
  try {
    await client.connect()
    console.log('✅ 数据库连接成功\n')
    
    const db = client.db('machrio')
    const productsCollection = db.collection('products')
    const categoriesCollection = db.collection('categories')
    
    // 获取报告文件
    const reportFile = path.join(__dirname, 'output', 'no-category-products-report.json')
    if (!fs.existsSync(reportFile)) {
      console.error('❌ 错误：找不到报告文件', reportFile)
      console.error('请先运行 fix-no-category-products.ts 生成报告')
      return
    }
    
    const report = JSON.parse(fs.readFileSync(reportFile, 'utf-8'))
    
    // 获取所有分类的 slug 到 ID 的映射
    const allCategories = await categoriesCollection.find({}).toArray() as any[]
    const categorySlugToId: Record<string, string> = {}
    allCategories.forEach(cat => {
      if (cat.slug) {
        categorySlugToId[cat.slug] = cat._id.toString()
      }
    })
    
    console.log(`📊 数据库中有 ${allCategories.length} 个分类`)
    console.log(`📊 报告中有 ${report.products.length} 个产品需要更新\n`)
    
    // 统计
    let updatedCount = 0
    let failedCount = 0
    let alreadyUpdatedCount = 0
    
    // 处理每个产品
    for (const product of report.products) {
      try {
        // 检查产品是否已经有分类
        const existingProduct = await productsCollection.findOne({ _id: product.id })
        if (existingProduct && existingProduct.primaryCategory) {
          alreadyUpdatedCount++
          continue
        }
        
        // 确定使用哪个分类
        let categoryId: string | null = null
        
        if (product.suggestedCategoryId) {
          // 使用自动匹配的类别
          categoryId = product.suggestedCategoryId
        } else if (MANUAL_CATEGORIES[product.id]) {
          // 使用手动指定的类别
          const slug = MANUAL_CATEGORIES[product.id]
          categoryId = categorySlugToId[slug] || null
          
          if (!categoryId) {
            console.error(`⚠️  警告：产品 ${product.sku} 的分类 ${slug} 不存在`)
            failedCount++
            continue
          }
        }
        
        if (!categoryId) {
          console.error(`⚠️  警告：产品 ${product.sku} 没有可用的分类`)
          failedCount++
          continue
        }
        
        // 更新产品
        const result = await productsCollection.updateOne(
          { _id: new ObjectId(product.id) },
          { 
            $set: { 
              primaryCategory: categoryId,
              updatedAt: new Date()
            } 
          }
        )
        
        if (result.modifiedCount > 0) {
          updatedCount++
          if (updatedCount <= 10 || updatedCount % 50 === 0) {
            console.log(`✅ [${updatedCount}] ${product.sku} -> 已添加分类`)
          }
        }
        
      } catch (error) {
        console.error(`❌ 更新产品 ${product.sku} 失败:`, error)
        failedCount++
      }
    }
    
    console.log('\n=== 更新结果 ===\n')
    console.log(`✅ 成功更新：${updatedCount} 个产品`)
    console.log(`⏭️  已跳过（已有分类）: ${alreadyUpdatedCount} 个产品`)
    console.log(`❌ 更新失败：${failedCount} 个产品`)
    console.log(`📊 总计处理：${report.products.length} 个产品`)
    
    // 生成执行报告
    const executionReport = {
      timestamp: new Date().toISOString(),
      summary: {
        total: report.products.length,
        updated: updatedCount,
        skipped: alreadyUpdatedCount,
        failed: failedCount,
      },
      details: {
        manualCategoriesUsed: Object.keys(MANUAL_CATEGORIES).length,
        autoMatchedUsed: report.products.filter((p: any) => p.suggestedCategoryId).length,
      }
    }
    
    const reportOutputFile = path.join(__dirname, 'output', 'execution-report.json')
    fs.writeFileSync(reportOutputFile, JSON.stringify(executionReport, null, 2))
    
    console.log(`\n💾 执行报告已保存到：${reportOutputFile}`)
    
    // 生成回滚脚本
    const rollbackScript = report.products.map((product: any) => `
// 回滚产品：${product.name} (${product.sku})
db.products.updateOne(
  { _id: "${product.id}" },
  { 
    $unset: { primaryCategory: "" },
    $set: { updatedAt: new Date() }
  }
)`).join('\n')
    
    const rollbackFile = path.join(__dirname, 'output', 'rollback-all-categories.js')
    fs.writeFileSync(rollbackFile, `// 回滚脚本 - 撤销所有产品分类更新\n// 使用前请务必备份数据库！\n// 生成时间：${new Date().toISOString()}\n\n${rollbackScript}\n`)
    
    console.log(`💾 回滚脚本已保存到：${rollbackFile}`)
    
    console.log('\n✅ 所有更新已完成！')
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

executeAllUpdates().catch(console.error)
