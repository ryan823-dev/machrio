import { NextRequest, NextResponse } from 'next/server'
import {
  createPartnerPayoutBatch,
  getSessionEmail,
  isPartnerAdminEmail,
} from '@/lib/partner-program'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const email = await getSessionEmail(request.headers)
    if (!email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!isPartnerAdminEmail(email)) {
      return NextResponse.json({ error: 'Admin access required.' }, { status: 403 })
    }

    const body = (await request.json()) as Record<string, unknown>
    const partnerId = String(body.partnerId || '').trim()
    const currency = String(body.currency || '').trim().toUpperCase()

    if (!partnerId || !currency) {
      return NextResponse.json(
        { error: 'Partner id and currency are required.' },
        { status: 400 },
      )
    }

    const payout = await createPartnerPayoutBatch({
      adminEmail: email,
      partnerId,
      currency,
      method: typeof body.method === 'string' ? body.method : null,
      notes: typeof body.notes === 'string' ? body.notes : null,
    })

    return NextResponse.json({ success: true, payout })
  } catch (error) {
    console.error('[partner/admin/payouts][POST] failed:', error)
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Failed to create payout batch.',
      },
      { status: 500 },
    )
  }
}
