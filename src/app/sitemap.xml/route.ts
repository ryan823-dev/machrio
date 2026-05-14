import { NextResponse } from 'next/server'
import {
  buildSitemapIndexXml,
  getSitemapIndexEntries,
} from '@/lib/sitemaps'

export const revalidate = 3600
export const dynamic = 'force-dynamic'

export async function GET() {
  const xml = buildSitemapIndexXml(await getSitemapIndexEntries())

  return new NextResponse(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
    },
  })
}
