import { NextRequest, NextResponse } from 'next/server'
import {
  getAdminOverview,
  getSessionEmail,
  isPartnerAdminEmail,
} from '@/lib/partner-program'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const email = await getSessionEmail(request.headers)
    if (!email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!isPartnerAdminEmail(email)) {
      return NextResponse.json(
        { error: 'Admin access required.' },
        { status: 403 },
      )
    }

    const overview = await getAdminOverview()
    return NextResponse.json({ success: true, ...overview })
  } catch (error) {
    console.error('[partner/admin/overview] failed:', error)
    return NextResponse.json(
      { error: 'Failed to load partner admin overview.' },
      { status: 500 },
    )
  }
}
