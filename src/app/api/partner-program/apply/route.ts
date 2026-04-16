import { NextRequest, NextResponse } from 'next/server'
import {
  createOrUpdatePartnerApplication,
  type PartnerApplicationInput,
} from '@/lib/partner-program'

export const dynamic = 'force-dynamic'

function splitInput(value: FormDataEntryValue | unknown): string[] {
  if (typeof value !== 'string') return []
  return value
    .split('\n')
    .flatMap((line) => line.split(','))
    .map((item) => item.trim())
    .filter(Boolean)
}

async function parseApplicationRequest(
  request: NextRequest,
): Promise<PartnerApplicationInput> {
  const contentType = request.headers.get('content-type') || ''

  if (contentType.includes('multipart/form-data')) {
    const body = await request.formData()
    return {
      name: String(body.get('name') || ''),
      email: String(body.get('email') || ''),
      website: String(body.get('website') || '') || null,
      country: String(body.get('country') || '') || null,
      mainPlatform:
        String(body.get('mainPlatform') || body.get('main_platform') || '') ||
        null,
      platformLinks: [
        ...splitInput(body.get('platformLinks')),
        ...splitInput(body.get('platform_links')),
      ],
      expertise: body.getAll('expertise').map((item) => String(item)),
      sampleWorkUrls: [
        ...splitInput(body.get('sampleWorkUrls')),
        ...splitInput(body.get('sample_work_urls')),
      ],
      topicPitch: String(body.get('topicPitch') || body.get('topic') || '') || null,
      message: String(body.get('message') || '') || null,
      payoutMethod: String(body.get('payoutMethod') || '') || null,
      payoutAccount: String(body.get('payoutAccount') || '') || null,
    }
  }

  const body = (await request.json()) as Record<string, unknown>
  return {
    name: String(body.name || ''),
    email: String(body.email || ''),
    website: typeof body.website === 'string' ? body.website : null,
    country: typeof body.country === 'string' ? body.country : null,
    mainPlatform:
      typeof body.mainPlatform === 'string' ? body.mainPlatform : null,
    platformLinks: Array.isArray(body.platformLinks)
      ? body.platformLinks.map((item) => String(item))
      : [],
    expertise: Array.isArray(body.expertise)
      ? body.expertise.map((item) => String(item))
      : [],
    sampleWorkUrls: Array.isArray(body.sampleWorkUrls)
      ? body.sampleWorkUrls.map((item) => String(item))
      : [],
    topicPitch: typeof body.topicPitch === 'string' ? body.topicPitch : null,
    message: typeof body.message === 'string' ? body.message : null,
    payoutMethod:
      typeof body.payoutMethod === 'string' ? body.payoutMethod : null,
    payoutAccount:
      typeof body.payoutAccount === 'string' ? body.payoutAccount : null,
  }
}

export async function POST(request: NextRequest) {
  try {
    const input = await parseApplicationRequest(request)

    if (!input.name.trim() || !input.email.trim()) {
      return NextResponse.json(
        { error: 'Name and email are required.' },
        { status: 400 },
      )
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email.trim())) {
      return NextResponse.json(
        { error: 'Please enter a valid email address.' },
        { status: 400 },
      )
    }

    const partner = await createOrUpdatePartnerApplication(input)

    return NextResponse.json({
      success: true,
      message:
        'Application received. We will review your channels and get back to you within 3-5 business days.',
      partner: {
        id: partner.id,
        status: partner.status,
        partnerCode: partner.partner_code,
      },
    })
  } catch (error) {
    console.error('[partner-program/apply] failed:', error)
    return NextResponse.json(
      { error: 'Failed to submit application. Please try again later.' },
      { status: 500 },
    )
  }
}
