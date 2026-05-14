import { NextResponse } from 'next/server'
import { buildSitemapXml, getProductSitemapEntries } from '@/lib/sitemaps'

export const revalidate = 3600
export const dynamic = 'force-dynamic'

interface ProductSitemapPageProps {
  params: Promise<{ page: string }>
}

function parsePage(value: string): number | null {
  const normalized = value.replace(/\.xml$/i, '')
  if (!/^\d+$/.test(normalized)) return null

  const page = Number.parseInt(normalized, 10)
  return Number.isFinite(page) && page > 0 ? page : null
}

export async function GET(_request: Request, { params }: ProductSitemapPageProps) {
  const { page: rawPage } = await params
  const page = parsePage(rawPage)

  if (!page) {
    return new NextResponse('Not found', { status: 404 })
  }

  const xml = buildSitemapXml(await getProductSitemapEntries(page))

  return new NextResponse(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
    },
  })
}
