import { NextResponse } from 'next/server'
import {
  buildSitemapIndexXml,
  getProductSitemapIndexEntries,
  getPublicBaseUrl,
} from '@/lib/sitemaps'

export const revalidate = 3600
export const dynamic = 'force-dynamic'

export async function GET() {
  const baseUrl = getPublicBaseUrl()
  const now = new Date()
  const productSitemaps = await getProductSitemapIndexEntries()

  const xml = buildSitemapIndexXml([
    { loc: `${baseUrl}/page-sitemap.xml`, lastModified: now },
    { loc: `${baseUrl}/category-sitemap.xml`, lastModified: now },
    { loc: `${baseUrl}/knowledge-sitemap.xml`, lastModified: now },
    { loc: `${baseUrl}/glossary-sitemap.xml`, lastModified: now },
    ...productSitemaps,
  ])

  return new NextResponse(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
    },
  })
}
