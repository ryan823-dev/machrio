import { NextRequest, NextResponse } from 'next/server'
import {
  encodePartnerAttributionCookie,
  PARTNER_ATTRIBUTION_COOKIE,
  PARTNER_COOKIE_MAX_AGE,
  recordPartnerClick,
} from '@/lib/partner-program'

export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ partnerCode: string; linkCode: string }> },
) {
  try {
    const { partnerCode, linkCode } = await params
    const { targetUrl, attribution } = await recordPartnerClick(
      partnerCode,
      linkCode,
      request.headers,
    )

    const response = NextResponse.redirect(targetUrl, 302)
    response.cookies.set({
      name: PARTNER_ATTRIBUTION_COOKIE,
      value: encodePartnerAttributionCookie(attribution),
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      maxAge: PARTNER_COOKIE_MAX_AGE,
    })

    return response
  } catch (error) {
    console.error('[go redirect] failed:', error)
    return NextResponse.redirect(new URL('/', request.url), 302)
  }
}
