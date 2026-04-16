import { NextRequest, NextResponse } from 'next/server'
import {
  getPartnerByEmail,
  getPartnerDashboardData,
  getSessionEmail,
} from '@/lib/partner-program'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const email = await getSessionEmail(request.headers)
    if (!email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const partner = await getPartnerByEmail(email)
    if (!partner) {
      return NextResponse.json(
        {
          error:
            'No partner profile found for this email yet. Please apply to the program first.',
        },
        { status: 404 },
      )
    }

    const data = await getPartnerDashboardData(partner)
    return NextResponse.json({ success: true, ...data })
  } catch (error) {
    console.error('[partner/data] failed:', error)
    return NextResponse.json(
      { error: 'Failed to load partner dashboard.' },
      { status: 500 },
    )
  }
}
