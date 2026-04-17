import { NextRequest, NextResponse } from 'next/server'
import {
  ensureAccountAuthTables,
  getAccountSessionFromRequest,
} from '@/lib/account-session'
import {
  ensureCustomerAccount,
  updateCustomerBillingInfo,
} from '@/lib/customer-service'

function buildBillingResponse(customer: Awaited<ReturnType<typeof ensureCustomerAccount>>) {
  const billingInfo = customer.billingInfo || {}

  return {
    companyLegalName: billingInfo.companyLegalName || '',
    taxId: billingInfo.taxId || '',
    billingAddress: billingInfo.billingAddress || '',
  }
}

async function getAuthenticatedEmail(request: NextRequest): Promise<string | null> {
  await ensureAccountAuthTables()
  const session = await getAccountSessionFromRequest(request)
  return session?.email || null
}

export async function GET(request: NextRequest) {
  try {
    const email = await getAuthenticatedEmail(request)
    if (!email) {
      return NextResponse.json({ error: 'Session expired. Please sign in again.' }, { status: 401 })
    }

    const customer = await ensureCustomerAccount(email)

    return NextResponse.json({
      success: true,
      billing: buildBillingResponse(customer),
    })
  } catch (error) {
    console.error('Account billing GET error:', error)
    return NextResponse.json({ error: 'Failed to load billing details' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const email = await getAuthenticatedEmail(request)
    if (!email) {
      return NextResponse.json({ error: 'Session expired. Please sign in again.' }, { status: 401 })
    }

    const body = await request.json()
    const customer = await updateCustomerBillingInfo(email, {
      companyLegalName: typeof body?.companyLegalName === 'string' ? body.companyLegalName : '',
      taxId: typeof body?.taxId === 'string' ? body.taxId : '',
      billingAddress: typeof body?.billingAddress === 'string' ? body.billingAddress : '',
    })

    return NextResponse.json({
      success: true,
      billing: buildBillingResponse(customer),
    })
  } catch (error) {
    console.error('Account billing PUT error:', error)
    return NextResponse.json({ error: 'Failed to update billing details' }, { status: 500 })
  }
}
