import { NextResponse } from 'next/server'
import { buildSitemapXml, getSitemapEntries } from '@/lib/sitemaps'

export const revalidate = 3600

export async function GET() {
  const xml = buildSitemapXml(await getSitemapEntries('products'))

  return new NextResponse(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
    },
  })
}
