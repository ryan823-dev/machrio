import { NextRequest, NextResponse } from 'next/server'
import {
  buildPartnerShortUrl,
  createPartnerLink,
  getPartnerByEmail,
  getPartnerLinks,
  getSessionEmail,
  normalizeMachrioTargetUrl,
} from '@/lib/partner-program'

export const dynamic = 'force-dynamic'

function canManageLinks(status: string): boolean {
  return ['approved', 'active'].includes(status)
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

    const links = await getPartnerLinks(partner.id)
    return NextResponse.json({
      success: true,
      links: links.map((link) => ({
        ...link,
        shortUrl: buildPartnerShortUrl(partner.partner_code, link.short_code),
      })),
    })
  } catch (error) {
    console.error('[partner/links][GET] failed:', error)
    return NextResponse.json(
      { error: 'Failed to load tracking links.' },
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

    if (!canManageLinks(partner.status)) {
      return NextResponse.json(
        {
          error:
            'Your partner account is still under review. Links become available after approval.',
        },
        { status: 403 },
      )
    }

    const body = (await request.json()) as Record<string, unknown>
    const title = String(body.title || '').trim()
    const targetUrl = normalizeMachrioTargetUrl(String(body.targetUrl || ''))

    if (!title || !targetUrl) {
      return NextResponse.json(
        {
          error:
            'Please provide a title and a valid Machrio product, category, brand, or RFQ URL.',
        },
        { status: 400 },
      )
    }

    const link = await createPartnerLink({
      partnerId: partner.id,
      title,
      targetUrl,
      targetType: typeof body.targetType === 'string' ? body.targetType : null,
      targetLabel:
        typeof body.targetLabel === 'string' ? body.targetLabel : null,
      utmCampaign:
        typeof body.utmCampaign === 'string' ? body.utmCampaign : null,
    })

    return NextResponse.json({
      success: true,
      link: {
        id: link.id,
        shortCode: link.shortCode,
        shortUrl: buildPartnerShortUrl(partner.partner_code, link.shortCode),
      },
    })
  } catch (error) {
    console.error('[partner/links][POST] failed:', error)
    return NextResponse.json(
      { error: 'Failed to create tracking link.' },
      { status: 500 },
    )
  }
}
