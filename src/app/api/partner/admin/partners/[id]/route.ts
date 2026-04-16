import { NextRequest, NextResponse } from 'next/server'
import {
  getSessionEmail,
  isPartnerAdminEmail,
  updatePartnerReviewStatus,
} from '@/lib/partner-program'

export const dynamic = 'force-dynamic'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const email = await getSessionEmail(request.headers)
    if (!email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!isPartnerAdminEmail(email)) {
      return NextResponse.json({ error: 'Admin access required.' }, { status: 403 })
    }

    const { id } = await params
    const body = (await request.json()) as Record<string, unknown>
    const status = String(body.status || '').trim() as
      | 'pending'
      | 'approved'
      | 'active'
      | 'paused'
      | 'rejected'

    if (!['pending', 'approved', 'active', 'paused', 'rejected'].includes(status)) {
      return NextResponse.json({ error: 'Invalid partner status.' }, { status: 400 })
    }

    const partner = await updatePartnerReviewStatus({
      partnerId: id,
      status,
      notes: typeof body.notes === 'string' ? body.notes : null,
    })

    if (!partner) {
      return NextResponse.json({ error: 'Partner not found.' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      partner: {
        id: partner.id,
        status: partner.status,
        approvedAt: partner.approved_at,
      },
    })
  } catch (error) {
    console.error('[partner/admin/partners] failed:', error)
    return NextResponse.json(
      { error: 'Failed to update partner review status.' },
      { status: 500 },
    )
  }
}
