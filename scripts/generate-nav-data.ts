/**
 * 生成静态导航数据脚本
 * 在构建时运行，生成 /public/data/nav-categories.json
 * 
 * 运行: npx tsx scripts/generate-nav-data.ts
 * 
 * 支持 MongoDB 和 PostgreSQL (Supabase)
 */

import { MongoClient } from 'mongodb'
import * as dotenv from 'dotenv'
import * as fs from 'fs'
import * as path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

dotenv.config({ path: path.resolve(__dirname, '../.env.local') })

interface NavCategory {
  id: string
  name: string
  slug: string
  children?: NavCategory[]
}

// Fetch categories from Supabase REST API
async function fetchFromSupabase(): Promise<any[]> {
  const SUPABASE_URL = 'https://yderhgkjcsaqrsfntpqm.supabase.co'
  const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlkZXJoZ2tqY3NhcXJzZm50cHFtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MjY0NjI0MywiZXhwIjoyMDU4MjIyMjQzfQ.UJvWQFHvKVt4h5VdLMf_0G9T2eJNvZO6jBvYQqVpPqc'
  
  const response = await fetch(`${SUPABASE_URL}/rest/v1/categories?select=id,name,slug,parent,displayOrder&order=displayOrder.asc`, {
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
    },
  })
  
  if (!response.ok) {
    throw new Error(`Supabase API error: ${response.status}`)
  }
  
  return response.json()
}

async function generateNavData() {
  const usePostgres = process.env.USE_POSTGRES?.trim() === '1'
  const MONGODB_URI = process.env.MONGODB_URI || ''
  
  console.log('🔄 开始生成导航数据...\n')
  console.log(`   使用数据库: ${usePostgres ? 'PostgreSQL (Supabase)' : 'MongoDB'}`)
  
  try {
    let allCategories: any[]
    
    if (usePostgres || !MONGODB_URI) {
      // Use Supabase REST API
      console.log('   从 Supabase REST API 获取数据...')
      allCategories = await fetchFromSupabase()
      
      // Transform Supabase format to match MongoDB format
      allCategories = allCategories.map(cat => ({
        _id: { toString: () => cat.id },
        name: cat.name,
        slug: cat.slug,
        parent: cat.parent ? { toString: () => cat.parent } : null,
        displayOrder: cat.displayOrder,
      }))
    } else {
      // Use MongoDB
      const client = new MongoClient(MONGODB_URI)
      
      try {
        await client.connect()
        const db = client.db('machrio')
        const categoriesCollection = db.collection('categories')
        
        allCategories = await categoriesCollection.find({})
          .sort({ displayOrder: 1 })
          .project({ name: 1, slug: 1, parent: 1, displayOrder: 1 })
          .toArray()
      } finally {
        await client.close()
      }
    }
    
    console.log(`📊 找到 ${allCategories.length} 个分类`)
    
    // 构建父子关系
    const childrenByParent = new Map<string | null, any[]>()
    
    for (const cat of allCategories) {
      const parentId = cat.parent?.toString() || null
      if (!childrenByParent.has(parentId)) {
        childrenByParent.set(parentId, [])
      }
      childrenByParent.get(parentId)!.push(cat)
    }
    
    // 获取顶级分类
    const l1Categories = childrenByParent.get(null) || []
    
    // 构建三层嵌套结构
    const categories: NavCategory[] = l1Categories.map(l1 => {
      const l2Children = (childrenByParent.get(l1._id.toString()) || [])
      
      return {
        id: l1._id.toString(),
        name: l1.name,
        slug: l1.slug,
        children: l2Children.map(l2 => {
          const l3Children = (childrenByParent.get(l2._id.toString()) || [])
          
          return {
            id: l2._id.toString(),
            name: l2.name,
            slug: l2.slug,
            children: l3Children.map(l3 => ({
              id: l3._id.toString(),
              name: l3.name,
              slug: l3.slug,
            })),
          }
        }),
      }
    })
    
    // 保存到文件 - 同时生成到 public 和 src 目录
    const publicPath = path.resolve(__dirname, '../public/data/nav-categories.json')
    const srcPath = path.resolve(__dirname, '../src/data/nav-categories.json')
    
    fs.writeFileSync(publicPath, JSON.stringify({ categories }, null, 2))
    fs.writeFileSync(srcPath, JSON.stringify({ categories }, null, 2))
    
    console.log(`\n✅ 成功生成导航数据`)
    console.log(`   Public: ${publicPath}`)
    console.log(`   Src: ${srcPath}`)
    console.log(`   分类数: ${categories.length} 个顶级分类`)
    
    // 同时生成一个精简版本（只有 L1）
    const l1Only = categories.map(c => ({ id: c.id, name: c.name, slug: c.slug }))
    const l1Path = path.resolve(__dirname, '../public/data/nav-categories-l1.json')
    fs.writeFileSync(l1Path, JSON.stringify({ categories: l1Only }, null, 2))
    console.log(`   L1 精简版: ${l1Path}`)
    
  } catch (error) {
    console.error('生成失败:', error)
    process.exit(1)
  }
}

generateNavData().catch(console.error)