/**
 * 列出所有可用的分类
 * 
 * 使用方法:
 * npx tsx scripts/list-categories.ts
 */

import { MongoClient } from 'mongodb'
import * as dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

dotenv.config({ path: path.resolve(__dirname, '../.env.local') })

async function listCategories() {
  const MONGODB_URI = process.env.MONGODB_URI || ''
  
  console.log('📋 获取所有分类...\n')
  
  const client = new MongoClient(MONGODB_URI)
  
  try {
    await client.connect()
    const db = client.db('machrio')
    const categoriesCollection = db.collection('categories')
    
    const allCategories = await categoriesCollection.find({}).toArray() as any[]
    
    console.log(`数据库中共有 ${allCategories.length} 个分类\n`)
    console.log('=== 分类列表（按名称排序）===\n')
    
    // 按名称排序
    allCategories.sort((a, b) => a.name.localeCompare(b.name))
    
    // 显示所有分类
    allCategories.forEach((cat, idx) => {
      console.log(`${idx + 1}. ${cat.name}`)
      console.log(`   Slug: ${cat.slug || 'N/A'}`)
      console.log(`   ID: ${cat._id}\n`)
    })
    
    // 搜索可能相关的分类
    console.log('\n=== 可能相关的分类 ===\n')
    
    const searchTerms = ['plumb', 'drain', 'pipe', 'packag', 'bag', 'cart', 'truck', 'platform', 'broom', 'clean']
    const relevantCategories = allCategories.filter(cat => {
      const nameLower = cat.name.toLowerCase()
      const slugLower = (cat.slug || '').toLowerCase()
      return searchTerms.some(term => nameLower.includes(term) || slugLower.includes(term))
    })
    
    relevantCategories.forEach(cat => {
      console.log(`✅ ${cat.name} (slug: ${cat.slug}, id: ${cat._id})`)
    })
    
  } catch (error) {
    console.error('获取分类失败:', error)
  } finally {
    await client.close()
  }
}

listCategories().catch(console.error)
