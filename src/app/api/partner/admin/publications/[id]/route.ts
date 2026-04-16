import { NextRequest, NextResponse } from 'next/server'
import {
  getSessionEmail,
  isPartnerAdminEmail,
  updatePublicationReviewStatus,
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
    const reviewStatus = String(body.reviewStatus || '').trim() as
      | 'submitted'
      | 'under-review'
      | 'approved'
      | 'rejected'

    if (!['submitted', 'under-review', 'approved', 'rejected'].includes(reviewStatus)) {
      return NextResponse.json({ error: 'Invalid publication review status.' }, { status: 400 })
    }

    const feeAmountRaw =
      typeof body.feeAmount === 'number'
        ? body.feeAmount
        : typeof body.feeAmount === 'string'
          ? Number(body.feeAmount)
          : null

    const publication = await updatePublicationReviewStatus({
      publicationId: id,
      reviewStatus,
      feeAmount: typeof feeAmountRaw === 'number' && Number.isFinite(feeAmountRaw)
        ? feeAmountRaw
        : null,
      notes: typeof body.notes === 'string' ? body.notes : null,
    })

    if (!publication) {
      return NextResponse.json({ error: 'Publication not found.' }, { status: 404 })
    }

    return NextResponse.json({ success: true, publication })
  } catch (error) {
    console.error('[partner/admin/publications] failed:', error)
    return NextResponse.json(
      { error: 'Failed to update publication review.' },
      { status: 500 },
    )
  }
}
