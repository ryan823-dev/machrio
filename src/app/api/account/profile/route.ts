import { NextRequest, NextResponse } from 'next/server'
import {
  ensureAccountAuthTables,
  getAccountSessionFromRequest,
} from '@/lib/account-session'
import {
  ensureCustomerAccount,
  updateCustomerAccountProfile,
} from '@/lib/customer-service'

function buildProfileResponse(customer: Awaited<ReturnType<typeof ensureCustomerAccount>>) {
  const displayName = customer.name === customer.email ? '' : customer.name || ''
  const displayCompany = customer.company === customer.email ? '' : customer.company || ''

  return {
    name: displayName,
    company: displayCompany,
    phone: customer.phone || '',
    title: customer.title || '',
    email: customer.email,
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
      profile: buildProfileResponse(customer),
    })
  } catch (error) {
    console.error('Account profile GET error:', error)
    return NextResponse.json({ error: 'Failed to load profile' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const email = await getAuthenticatedEmail(request)
    if (!email) {
      return NextResponse.json({ error: 'Session expired. Please sign in again.' }, { status: 401 })
    }

    const body = await request.json()
    const name = typeof body?.name === 'string' ? body.name.trim() : ''
    const company = typeof body?.company === 'string' ? body.company.trim() : ''
    const phone = typeof body?.phone === 'string' ? body.phone : ''
    const title = typeof body?.title === 'string' ? body.title : ''

    if (!name || !company) {
      return NextResponse.json(
        { error: 'Name and company are required.' },
        { status: 400 },
      )
    }

    const customer = await updateCustomerAccountProfile(email, {
      name,
      company,
      phone,
      title,
    })

    return NextResponse.json({
      success: true,
      profile: buildProfileResponse(customer),
    })
  } catch (error) {
    console.error('Account profile PUT error:', error)
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 })
  }
}
