import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'

// 使用 ISR 缓存，每 1 小时重新验证
export const revalidate = 3600

interface NavCategory {
  id: string
  name: string
  slug: string
  children?: NavCategory[]
}

// 内存缓存
let cachedCategories: NavCategory[] | null = null
let cacheTime = 0
const CACHE_TTL = 60 * 60 * 1000 // 1 小时

export async function GET() {
  // 检查内存缓存
  if (cachedCategories && Date.now() - cacheTime < CACHE_TTL) {
    return NextResponse.json({ categories: cachedCategories })
  }

  try {
    const payload = await getPayload({ config })

    // Get all categories in one query for efficiency
    const allCategories = await payload.find({
      collection: 'categories',
      limit: 1000,
      sort: 'displayOrder',
    })

    // Build lookup maps
    const catById = new Map(allCategories.docs.map(c => [c.id, c]))
    
    // Group by parent
    const childrenByParent = new Map<string | null, typeof allCategories.docs>()
    
    for (const cat of allCategories.docs) {
      const parentId = cat.parent 
        ? (typeof cat.parent === 'object' ? cat.parent.id : cat.parent)
        : null
      
      if (!childrenByParent.has(parentId)) {
        childrenByParent.set(parentId, [])
      }
      childrenByParent.get(parentId)!.push(cat)
    }

    // Get L1 categories (no parent)
    const l1Categories = childrenByParent.get(null) || []

    // Build three-level nested structure
    const categories: NavCategory[] = l1Categories.map(l1 => {
      // Get L2 children
      const l2Children = childrenByParent.get(l1.id) || []
      
      return {
        id: l1.id,
        name: l1.name,
        slug: l1.slug,
        children: l2Children.map(l2 => {
          // Get L3 children
          const l3Children = childrenByParent.get(l2.id) || []
          
          return {
            id: l2.id,
            name: l2.name,
            slug: l2.slug,
            children: l3Children.map(l3 => ({
              id: l3.id,
              name: l3.name,
              slug: l3.slug,
            })),
          }
        }),
      }
    })

    // 保存到内存缓存
    cachedCategories = categories
    cacheTime = Date.now()

    return NextResponse.json({ categories }, {
      headers: { 
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200',
      },
    })
  } catch (error) {
    console.error('Nav categories error:', error)
    // 如果有缓存，返回过期缓存
    if (cachedCategories) {
      return NextResponse.json({ categories: cachedCategories })
    }
    return NextResponse.json({ categories: [] }, { status: 500 })
  }
}
