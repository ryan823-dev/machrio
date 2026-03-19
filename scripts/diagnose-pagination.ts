/**
 * 诊断产品列表分页问题
 * 
 * 使用方法:
 * npx tsx scripts/diagnose-pagination.ts
 */

import { MongoClient } from 'mongodb'
import * as dotenv from 'dotenv'
import * as path from 'path'

dotenv.config({ path: path.resolve(__dirname, '../.env.local') })

async function diagnosePagination() {
  const MONGODB_URI = process.env.DATABASE_URI || ''
  const DB_NAME = MONGODB_URI.split('/').pop()?.split('?')[0] || 'machrio'
  
  console.log('🔍 诊断产品列表分页问题\n')
  console.log(`数据库：${DB_NAME}`)
  console.log('---\n')

  const client = new MongoClient(MONGODB_URI)

  try {
    await client.connect()
    const db = client.db(DB_NAME)
    const productsCollection = db.collection('products')

    // 1. 统计总产品数
    const totalProducts = await productsCollection.countDocuments({})
    console.log(`📊 总产品数：${totalProducts.toLocaleString()}`)

    // 2. 计算理论页数（每页 20 条）
    const PAGE_SIZE = 20
    const totalPages = Math.ceil(totalProducts / PAGE_SIZE)
    console.log(`📄 理论页数：${totalPages} 页 (每页 ${PAGE_SIZE} 条)`)

    // 3. 检查最后一页
    const lastPage = totalPages
    const skip = (lastPage - 1) * PAGE_SIZE
    const lastPageProducts = await productsCollection
      .find({})
      .skip(skip)
      .limit(PAGE_SIZE)
      .toArray()

    console.log(`\n📋 最后一页 (${lastPage}/${totalPages}) 数据:`)
    console.log(`   - 实际返回数量：${lastPageProducts.length} 条`)
    console.log(`   - 期望数量：${Math.min(PAGE_SIZE, totalProducts - skip)} 条`)

    if (lastPageProducts.length === 0) {
      console.log(`   ❌ 异常：最后一页为空！`)
      
      // 尝试获取倒数第二页
      const secondLastPage = lastPage - 1
      const secondLastSkip = (secondLastPage - 1) * PAGE_SIZE
      const secondLastProducts = await productsCollection
        .find({})
        .skip(secondLastSkip)
        .limit(PAGE_SIZE)
        .toArray()
      
      console.log(`\n   尝试倒数第二页 (${secondLastPage}):`)
      console.log(`   - 返回数量：${secondLastProducts.length} 条`)
      
      if (secondLastProducts.length > 0) {
        console.log(`   ✅ 倒数第二页有数据，说明最后一页计算错误`)
      }
    } else {
      console.log(`   ✅ 最后一页数据正常`)
      console.log(`   - 第一个产品：${lastPageProducts[0]?.name || 'N/A'}`)
      console.log(`   - 最后一个产品：${lastPageProducts[lastPageProducts.length - 1]?.name || 'N/A'}`)
    }

    // 4. 检查是否有 draft 文档
    const draftCount = await productsCollection.countDocuments({ _status: 'draft' })
    const publishedCount = await productsCollection.countDocuments({ _status: 'published' })
    
    console.log(`\n📝 文档状态:`)
    console.log(`   - Published: ${publishedCount.toLocaleString()}`)
    console.log(`   - Draft: ${draftCount.toLocaleString()}`)

    // 5. 检查分页查询（模拟 Payload CMS 的查询）
    console.log(`\n🧪 测试分页查询:`)
    
    const testPages = [1, 2, Math.floor(totalPages / 2), totalPages - 1, totalPages]
    
    for (const page of testPages) {
      const testSkip = (page - 1) * PAGE_SIZE
      const testProducts = await productsCollection
        .find({})
        .skip(testSkip)
        .limit(PAGE_SIZE)
        .toArray()
      
      const expectedCount = page === totalPages 
        ? totalProducts - testSkip 
        : PAGE_SIZE
      
      const status = testProducts.length === expectedCount ? '✅' : '❌'
      console.log(`   ${status} 第 ${page}页：返回 ${testProducts.length} 条，期望 ${expectedCount} 条`)
    }

    // 6. 建议
    console.log(`\n💡 建议:`)
    
    if (lastPageProducts.length === 0) {
      console.log(`   1. 检查前端分页组件的 totalPages 计算是否正确`)
      console.log(`   2. 确认 API 请求的 page 参数是否超出范围`)
      console.log(`   3. 考虑在最后一页为空时自动回退到上一有效页`)
    } else {
      console.log(`   ✅ 分页逻辑基本正常`)
    }

  } catch (error) {
    console.error('❌ 诊断失败:', error)
  } finally {
    await client.close()
  }
}

diagnosePagination().catch(console.error)
