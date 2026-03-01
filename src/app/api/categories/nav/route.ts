import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const payload = await getPayload({ config })

    // Get top-level categories (no parent)
    const topLevel = await payload.find({
      collection: 'categories',
      where: {
        or: [
          { parent: { exists: false } },
          { parent: { equals: null } },
        ],
      },
      sort: 'displayOrder',
      limit: 20,
    })

    // For each top-level category, get subcategories
    const categories = await Promise.all(
      topLevel.docs.map(async (cat) => {
        const children = await payload.find({
          collection: 'categories',
          where: { parent: { equals: cat.id } },
          sort: 'displayOrder',
          limit: 50,
        })

        return {
          name: cat.name,
          slug: cat.slug,
          subcategories: children.docs.map((child) => ({
            name: child.name,
            slug: child.slug,
          })),
        }
      })
    )

    return NextResponse.json({ categories }, {
      headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' },
    })
  } catch {
    return NextResponse.json({ categories: [] }, { status: 500 })
  }
}
