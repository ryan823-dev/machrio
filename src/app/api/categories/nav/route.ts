import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'

export const dynamic = 'force-dynamic'

interface NavCategory {
  id: string
  name: string
  slug: string
  children?: NavCategory[]
}

export async function GET() {
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

    return NextResponse.json({ categories }, {
      headers: { 
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200',
      },
    })
  } catch (error) {
    console.error('Nav categories error:', error)
    return NextResponse.json({ categories: [] }, { status: 500 })
  }
}
