import { NextRequest, NextResponse } from 'next/server'
import { getPool } from '@/lib/db'
import {
  createPartnerPublication,
  getPartnerByEmail,
  getPartnerPublications,
  getSessionEmail,
} from '@/lib/partner-program'

export const dynamic = 'force-dynamic'

function canManagePublications(status: string): boolean {
  return ['approved', 'active'].includes(status)
}

function normalizeExternalUrl(value?: string | null): string | null {
  if (!value) return null
  try {
    const url = new URL(value)
    if (!['http:', 'https:'].includes(url.protocol)) return null
    return url.toString()
  } catch {
    return null
  }
}

export async function GET(request: NextRequest) {
  try {
    const email = await getSessionEmail(request.headers)
    if (!email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const partner = await getPartnerByEmail(email)
    if (!partner) {
      return NextResponse.json({ error: 'Partner not found' }, { status: 404 })
    }

    const publications = await getPartnerPublications(partner.id)
    return NextResponse.json({ success: true, publications })
  } catch (error) {
    console.error('[partner/publications][GET] failed:', error)
    return NextResponse.json(
      { error: 'Failed to load publications.' },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const email = await getSessionEmail(request.headers)
    if (!email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const partner = await getPartnerByEmail(email)
    if (!partner) {
      return NextResponse.json({ error: 'Partner not found' }, { status: 404 })
    }

    if (!canManagePublications(partner.status)) {
      return NextResponse.json(
        {
          error:
            'Your partner account is still under review. Publications can be submitted after approval.',
        },
        { status: 403 },
      )
    }

    const body = (await request.json()) as Record<string, unknown>
    const title = String(body.title || '').trim()
    const platform = String(body.platform || '').trim()
    const contentType = String(body.contentType || '').trim()
    const trackingLinkId = String(body.trackingLinkId || '').trim()
    const publishedUrl = normalizeExternalUrl(String(body.publishedUrl || ''))

    if (!title || !platform || !contentType || !trackingLinkId || !publishedUrl) {
      return NextResponse.json(
        {
          error:
            'Title, platform, content type, publication URL, and tracking link are required.',
        },
        { status: 400 },
      )
    }

    const pool = getPool()
    const linkResult = await pool.query(
      `SELECT id
       FROM creator_tracking_links
       WHERE id::text = $1 AND partner_id = $2
       LIMIT 1`,
      [trackingLinkId, partner.id],
    )

    if (linkResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Tracking link not found for this partner.' },
        { status: 404 },
      )
    }

    const publication = await createPartnerPublication({
      partnerId: partner.id,
      trackingLinkId,
      title,
      platform,
      contentType,
      publishedUrl,
      publishedAt:
        typeof body.publishedAt === 'string' ? body.publishedAt : null,
      reportedMetrics:
        typeof body.reportedMetrics === 'object' && body.reportedMetrics
          ? (body.reportedMetrics as Record<string, number | string | null>)
          : {},
    })

    return NextResponse.json({ success: true, publication })
  } catch (error) {
    console.error('[partner/publications][POST] failed:', error)
    return NextResponse.json(
      { error: 'Failed to submit publication.' },
      { status: 500 },
    )
  }
}
