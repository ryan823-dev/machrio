import { NextRequest, NextResponse } from 'next/server'
import {
  buildPartnerPayoutExportCsv,
  getPartnerPayoutDetail,
  getSessionEmail,
  isPartnerAdminEmail,
  updatePartnerPayoutStatus,
} from '@/lib/partner-program'

export const dynamic = 'force-dynamic'

async function requirePartnerAdminEmail(request: NextRequest) {
  const email = await getSessionEmail(request.headers)
  if (!email) {
    return {
      email: null,
      response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
    }
  }

  if (!isPartnerAdminEmail(email)) {
    return {
      email: null,
      response: NextResponse.json({ error: 'Admin access required.' }, { status: 403 }),
    }
  }

  return { email, response: null }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const auth = await requirePartnerAdminEmail(request)
    if (auth.response) {
      return auth.response
    }

    const { id } = await params
    const payout = await getPartnerPayoutDetail(id)

    if (!payout) {
      return NextResponse.json({ error: 'Payout batch not found.' }, { status: 404 })
    }

    if (request.nextUrl.searchParams.get('format') === 'csv') {
      const exportPayload = buildPartnerPayoutExportCsv(payout)
      return new NextResponse(exportPayload.csv, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="${exportPayload.filename}"`,
          'Cache-Control': 'no-store',
        },
      })
    }

    return NextResponse.json({ success: true, ...payout })
  } catch (error) {
    console.error('[partner/admin/payouts][GET] failed:', error)
    return NextResponse.json(
      { error: 'Failed to load payout batch.' },
      { status: 500 },
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const auth = await requirePartnerAdminEmail(request)
    if (auth.response) {
      return auth.response
    }

    const { id } = await params
    const body = (await request.json()) as Record<string, unknown>
    const status = String(body.status || '').trim() as 'paid' | 'cancelled'

    if (!['paid', 'cancelled'].includes(status)) {
      return NextResponse.json({ error: 'Invalid payout status.' }, { status: 400 })
    }

    const payout = await updatePartnerPayoutStatus({
      payoutId: id,
      status,
      transactionRef:
        typeof body.transactionRef === 'string' ? body.transactionRef : null,
      notes: typeof body.notes === 'string' ? body.notes : null,
    })

    if (!payout) {
      return NextResponse.json({ error: 'Payout batch not found.' }, { status: 404 })
    }

    return NextResponse.json({ success: true, payout })
  } catch (error) {
    console.error('[partner/admin/payouts][PATCH] failed:', error)
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Failed to update payout batch.',
      },
      { status: 500 },
    )
  }
}
