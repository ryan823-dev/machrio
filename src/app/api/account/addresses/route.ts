import { NextRequest, NextResponse } from 'next/server'
import {
  ensureAccountAuthTables,
  getAccountSessionFromRequest,
} from '@/lib/account-session'
import {
  ensureCustomerAccount,
  replaceCustomerShippingAddresses,
  type ShippingAddressInput,
} from '@/lib/customer-service'

function buildAddressesResponse(customer: Awaited<ReturnType<typeof ensureCustomerAccount>>) {
  return Array.isArray(customer.shippingAddresses)
    ? customer.shippingAddresses.map((address) => ({
        label: address.label || '',
        address: address.address || '',
        city: address.city || '',
        state: address.state || '',
        postalCode: address.postalCode || '',
        country: address.country || 'US',
      }))
    : []
}

async function getAuthenticatedEmail(request: NextRequest): Promise<string | null> {
  await ensureAccountAuthTables()
  const session = await getAccountSessionFromRequest(request)
  return session?.email || null
}

function sanitizeAddressesInput(value: unknown): ShippingAddressInput[] {
  if (!Array.isArray(value)) return []

  return value.map((entry) => {
    const address = entry && typeof entry === 'object' ? entry as Record<string, unknown> : {}
    return {
      label: typeof address.label === 'string' ? address.label : '',
      address: typeof address.address === 'string' ? address.address : '',
      city: typeof address.city === 'string' ? address.city : '',
      state: typeof address.state === 'string' ? address.state : '',
      postalCode: typeof address.postalCode === 'string' ? address.postalCode : '',
      country: typeof address.country === 'string' && address.country.trim()
        ? address.country
        : 'US',
    }
  })
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
      addresses: buildAddressesResponse(customer),
    })
  } catch (error) {
    console.error('Account addresses GET error:', error)
    return NextResponse.json({ error: 'Failed to load addresses' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const email = await getAuthenticatedEmail(request)
    if (!email) {
      return NextResponse.json({ error: 'Session expired. Please sign in again.' }, { status: 401 })
    }

    const body = await request.json()
    const addresses = sanitizeAddressesInput(body?.addresses)
    const hasInvalidAddress = addresses.some((address) => (
      Boolean(address.address.trim())
      || Boolean(address.city.trim())
      || Boolean(address.state.trim())
      || Boolean(address.postalCode.trim())
      || Boolean(address.label?.trim())
    ) && (
      !address.address.trim()
      || !address.city.trim()
      || !address.state.trim()
      || !address.postalCode.trim()
    ))

    if (hasInvalidAddress) {
      return NextResponse.json(
        { error: 'Each saved address needs street, city, state, and postal code.' },
        { status: 400 },
      )
    }

    const customer = await replaceCustomerShippingAddresses(email, addresses)

    return NextResponse.json({
      success: true,
      addresses: buildAddressesResponse(customer),
    })
  } catch (error) {
    console.error('Account addresses PUT error:', error)
    return NextResponse.json({ error: 'Failed to update addresses' }, { status: 500 })
  }
}
