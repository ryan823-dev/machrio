import {
  getPool,
  ensureCustomerReferenceColumns,
  getLatestRfqSubmissionByEmail,
  linkRfqSubmissionsToCustomerByEmail,
} from '@/lib/db'

type CustomerSource = 'direct' | 'rfq' | 'contact' | 'manual'

export interface ShippingAddressInput {
  label?: string
  address: string
  city: string
  state: string
  postalCode: string
  country: string
}

export interface BillingInfoInput {
  companyLegalName?: string | null
  taxId?: string | null
  billingAddress?: string | null
}

interface CustomerUpsertInput {
  email: string
  name?: string | null
  company?: string | null
  phone?: string | null
  title?: string | null
  source?: CustomerSource
  shippingAddress?: ShippingAddressInput | null
}

interface CheckoutCustomerSyncInput {
  email: string
  name?: string | null
  company?: string | null
  phone?: string | null
  source?: CustomerSource
  shippingAddress?: ShippingAddressInput | null
  billingInfo?: BillingInfoInput | null
}

export interface CustomerRecord {
  id: string
  email: string
  name: string
  company: string
  phone?: string | null
  title?: string | null
  source?: CustomerSource | null
  shippingAddresses?: ShippingAddressInput[] | null
  billingInfo?: BillingInfoInput | null
}

interface CustomerRow {
  id: string
  email: string
  name: string | null
  company: string | null
  phone: string | null
  title: string | null
  source: CustomerSource | null
  shipping_addresses: unknown
  billing_info: unknown
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

function normalizeText(value: string | null | undefined): string {
  return value?.trim() || ''
}

function normalizeAddressKey(address: ShippingAddressInput): string {
  return [
    normalizeText(address.address).toLowerCase(),
    normalizeText(address.city).toLowerCase(),
    normalizeText(address.state).toLowerCase(),
    normalizeText(address.postalCode).toLowerCase(),
    normalizeText(address.country).toLowerCase(),
  ].join('|')
}

function sanitizeShippingAddress(
  address: ShippingAddressInput | null | undefined,
): ShippingAddressInput | null {
  if (!address) return null

  const sanitized: ShippingAddressInput = {
    label: normalizeText(address.label) || undefined,
    address: normalizeText(address.address),
    city: normalizeText(address.city),
    state: normalizeText(address.state),
    postalCode: normalizeText(address.postalCode),
    country: normalizeText(address.country) || 'US',
  }

  if (!sanitized.address || !sanitized.city || !sanitized.state || !sanitized.postalCode) {
    return null
  }

  return sanitized
}

function sanitizeShippingAddresses(value: unknown): ShippingAddressInput[] {
  if (!Array.isArray(value)) return []

  return value
    .map((entry) => sanitizeShippingAddress(
      entry && typeof entry === 'object'
        ? entry as ShippingAddressInput
        : null,
    ))
    .filter((address): address is ShippingAddressInput => Boolean(address))
}

function sanitizeBillingInfo(
  billingInfo: BillingInfoInput | null | undefined,
): BillingInfoInput {
  return {
    companyLegalName: normalizeText(billingInfo?.companyLegalName),
    taxId: normalizeText(billingInfo?.taxId),
    billingAddress: normalizeText(billingInfo?.billingAddress),
  }
}

function hasBillingInfoValue(billingInfo: BillingInfoInput | null | undefined): boolean {
  const sanitized = sanitizeBillingInfo(billingInfo)
  return Boolean(sanitized.companyLegalName || sanitized.taxId || sanitized.billingAddress)
}

function parseJsonValue(value: unknown): unknown {
  if (typeof value !== 'string') return value

  try {
    return JSON.parse(value)
  } catch {
    return null
  }
}

function mapCustomerRow(row: CustomerRow | undefined): CustomerRecord | null {
  if (!row) return null

  return {
    id: String(row.id),
    email: normalizeEmail(String(row.email || '')),
    name: normalizeText(row.name),
    company: normalizeText(row.company),
    phone: normalizeText(row.phone) || null,
    title: normalizeText(row.title) || null,
    source: row.source || null,
    shippingAddresses: sanitizeShippingAddresses(parseJsonValue(row.shipping_addresses)),
    billingInfo: sanitizeBillingInfo(
      parseJsonValue(row.billing_info) as BillingInfoInput | null | undefined,
    ),
  }
}

async function insertCustomerRecord(input: {
  email: string
  name: string
  company: string
  phone?: string | null
  title?: string | null
  source: CustomerSource
  shippingAddresses?: ShippingAddressInput[]
  billingInfo?: BillingInfoInput
}): Promise<CustomerRecord> {
  const pool = getPool()
  const result = await pool.query<CustomerRow>(
    `INSERT INTO customers (
      email,
      name,
      company,
      phone,
      title,
      source,
      shipping_addresses,
      billing_info
    ) VALUES (
      $1, $2, $3, $4, $5, $6, $7::jsonb, $8::jsonb
    )
    ON CONFLICT (email) DO UPDATE
    SET updated_at = NOW()
    RETURNING
      id::text AS id,
      email,
      name,
      company,
      phone,
      title,
      source,
      shipping_addresses,
      billing_info`,
    [
      input.email,
      input.name,
      input.company,
      normalizeText(input.phone) || null,
      normalizeText(input.title) || null,
      input.source,
      JSON.stringify(input.shippingAddresses || []),
      JSON.stringify(input.billingInfo || {}),
    ],
  )

  const customer = mapCustomerRow(result.rows[0])
  if (!customer) {
    throw new Error('Failed to insert customer record')
  }

  return customer
}

async function saveCustomerRecord(
  customerId: string,
  input: {
    name: string
    company: string
    phone?: string | null
    title?: string | null
    source?: CustomerSource | null
    shippingAddresses?: ShippingAddressInput[] | null
    billingInfo?: BillingInfoInput | null
  },
): Promise<CustomerRecord> {
  const pool = getPool()
  const result = await pool.query<CustomerRow>(
    `UPDATE customers
     SET name = $2,
         company = $3,
         phone = $4,
         title = $5,
         source = $6,
         shipping_addresses = $7::jsonb,
         billing_info = $8::jsonb,
         updated_at = NOW()
     WHERE id = $1::uuid
     RETURNING
       id::text AS id,
       email,
       name,
       company,
       phone,
       title,
       source,
       shipping_addresses,
       billing_info`,
    [
      customerId,
      normalizeText(input.name),
      normalizeText(input.company),
      normalizeText(input.phone) || null,
      normalizeText(input.title) || null,
      input.source || 'manual',
      JSON.stringify(input.shippingAddresses || []),
      JSON.stringify(sanitizeBillingInfo(input.billingInfo)),
    ],
  )

  const customer = mapCustomerRow(result.rows[0])
  if (!customer) {
    throw new Error(`Failed to update customer ${customerId}`)
  }

  return customer
}

function mergeCustomerRecord(
  customer: CustomerRecord,
  updates: Partial<Omit<CustomerRecord, 'id' | 'email'>>,
): {
  name: string
  company: string
  phone?: string | null
  title?: string | null
  source?: CustomerSource | null
  shippingAddresses?: ShippingAddressInput[] | null
  billingInfo?: BillingInfoInput | null
} {
  return {
    name: updates.name ?? customer.name,
    company: updates.company ?? customer.company,
    phone: updates.phone ?? customer.phone ?? null,
    title: updates.title ?? customer.title ?? null,
    source: updates.source ?? customer.source ?? 'manual',
    shippingAddresses: updates.shippingAddresses ?? customer.shippingAddresses ?? [],
    billingInfo: updates.billingInfo ?? customer.billingInfo ?? {},
  }
}

function isUuid(value: string | null | undefined): value is string {
  return Boolean(
    value
    && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value),
  )
}

export async function findCustomerByEmail(email: string): Promise<CustomerRecord | null> {
  const normalizedEmail = normalizeEmail(email)
  const pool = getPool()
  const result = await pool.query<CustomerRow>(
    `SELECT
       id::text AS id,
       email,
       name,
       company,
       phone,
       title,
       source,
       shipping_addresses,
       billing_info
     FROM customers
     WHERE LOWER(email) = $1
     LIMIT 1`,
    [normalizedEmail],
  )

  return mapCustomerRow(result.rows[0])
}

export async function upsertCustomerProfile(input: CustomerUpsertInput): Promise<CustomerRecord> {
  const normalizedEmail = normalizeEmail(input.email)
  const existing = await findCustomerByEmail(normalizedEmail)
  const nextShippingAddress = sanitizeShippingAddress(input.shippingAddress)

  if (!existing) {
    return insertCustomerRecord({
      email: normalizedEmail,
      name: normalizeText(input.name) || normalizeText(input.company) || normalizedEmail,
      company: normalizeText(input.company) || normalizeText(input.name) || normalizedEmail,
      phone: normalizeText(input.phone) || null,
      title: normalizeText(input.title) || null,
      source: input.source || 'manual',
      shippingAddresses: nextShippingAddress ? [nextShippingAddress] : [],
      billingInfo: {},
    })
  }

  const nextName = normalizeText(input.name)
  const nextCompany = normalizeText(input.company)
  const nextPhone = normalizeText(input.phone)
  const nextTitle = normalizeText(input.title)
  const existingShippingAddresses = Array.isArray(existing.shippingAddresses)
    ? existing.shippingAddresses
    : []
  const hasAddress = nextShippingAddress
    ? existingShippingAddresses.some((address) => (
        normalizeAddressKey(address) === normalizeAddressKey(nextShippingAddress)
      ))
    : true

  const shouldUpdateName = Boolean(
    nextName && (!normalizeText(existing.name) || normalizeText(existing.name) !== nextName),
  )
  const shouldUpdateCompany = Boolean(
    nextCompany && (!normalizeText(existing.company) || normalizeText(existing.company) !== nextCompany),
  )
  const shouldUpdatePhone = Boolean(nextPhone && normalizeText(existing.phone) !== nextPhone)
  const shouldUpdateTitle = Boolean(nextTitle && normalizeText(existing.title) !== nextTitle)
  const shouldUpdateSource = Boolean(input.source && (!existing.source || existing.source === 'manual'))
  const shouldAddAddress = Boolean(nextShippingAddress && !hasAddress)

  if (
    !shouldUpdateName
    && !shouldUpdateCompany
    && !shouldUpdatePhone
    && !shouldUpdateTitle
    && !shouldUpdateSource
    && !shouldAddAddress
  ) {
    return existing
  }

  return saveCustomerRecord(existing.id, mergeCustomerRecord(existing, {
    name: shouldUpdateName ? nextName : undefined,
    company: shouldUpdateCompany ? nextCompany : undefined,
    phone: shouldUpdatePhone ? nextPhone : undefined,
    title: shouldUpdateTitle ? nextTitle : undefined,
    source: shouldUpdateSource ? input.source : undefined,
    shippingAddresses: shouldAddAddress && nextShippingAddress
      ? [...existingShippingAddresses, nextShippingAddress]
      : undefined,
  }))
}

export async function ensureCustomerFromHistory(email: string): Promise<CustomerRecord | null> {
  const normalizedEmail = normalizeEmail(email)
  const existing = await findCustomerByEmail(normalizedEmail)
  if (existing) return existing

  const pool = getPool()
  const [latestOrderResult, latestRfq] = await Promise.all([
    pool.query(
      `SELECT customer_name, customer_company, customer_phone, shipping_address, created_at
       FROM orders
       WHERE LOWER(customer_email) = $1
       ORDER BY created_at DESC
       LIMIT 1`,
      [normalizedEmail],
    ),
    getLatestRfqSubmissionByEmail(normalizedEmail),
  ])

  const latestOrder = latestOrderResult.rows[0]
  if (latestOrder) {
    const shippingAddressRaw = latestOrder.shipping_address as Record<string, unknown> | null
    return upsertCustomerProfile({
      email: normalizedEmail,
      name: latestOrder.customer_name,
      company: latestOrder.customer_company,
      phone: latestOrder.customer_phone,
      source: 'direct',
      shippingAddress: shippingAddressRaw ? {
        address: String(shippingAddressRaw.address || ''),
        city: String(shippingAddressRaw.city || ''),
        state: String(shippingAddressRaw.state || ''),
        postalCode: String(shippingAddressRaw.postalCode || ''),
        country: String(shippingAddressRaw.country || 'US'),
        label: 'Primary Shipping',
      } : null,
    })
  }

  if (latestRfq) {
    return upsertCustomerProfile({
      email: normalizedEmail,
      name: latestRfq.customer_name,
      company: latestRfq.customer_company,
      phone: latestRfq.customer_phone,
      source: 'rfq',
    })
  }

  return null
}

export async function ensureCustomerAccount(email: string): Promise<CustomerRecord> {
  const normalizedEmail = normalizeEmail(email)
  const existing = await findCustomerByEmail(normalizedEmail)
  if (existing) return existing

  const customerFromHistory = await ensureCustomerFromHistory(normalizedEmail)
  if (customerFromHistory) return customerFromHistory

  return upsertCustomerProfile({
    email: normalizedEmail,
    source: 'manual',
  })
}

export async function updateCustomerAccountProfile(
  email: string,
  input: {
    name: string
    company: string
    phone?: string | null
    title?: string | null
  },
): Promise<CustomerRecord> {
  const customer = await ensureCustomerAccount(email)
  const normalizedEmail = normalizeEmail(email)

  return saveCustomerRecord(customer.id, mergeCustomerRecord(customer, {
    name: normalizeText(input.name) || customer.name || normalizedEmail,
    company: normalizeText(input.company) || customer.company || normalizedEmail,
    phone: normalizeText(input.phone) || null,
    title: normalizeText(input.title) || null,
  }))
}

export async function replaceCustomerShippingAddresses(
  email: string,
  addresses: ShippingAddressInput[],
): Promise<CustomerRecord> {
  const customer = await ensureCustomerAccount(email)
  const sanitizedAddresses = addresses
    .map((address) => sanitizeShippingAddress(address))
    .filter((address): address is ShippingAddressInput => Boolean(address))

  return saveCustomerRecord(customer.id, mergeCustomerRecord(customer, {
    shippingAddresses: sanitizedAddresses,
  }))
}

export async function updateCustomerBillingInfo(
  email: string,
  billingInfo: BillingInfoInput,
): Promise<CustomerRecord> {
  const customer = await ensureCustomerAccount(email)

  return saveCustomerRecord(customer.id, mergeCustomerRecord(customer, {
    billingInfo: sanitizeBillingInfo(billingInfo),
  }))
}

export async function syncCheckoutCustomerData(
  input: CheckoutCustomerSyncInput,
): Promise<CustomerRecord> {
  const customer = await upsertCustomerProfile({
    email: input.email,
    name: input.name,
    company: input.company,
    phone: input.phone,
    source: input.source,
    shippingAddress: input.shippingAddress,
  })

  if (!hasBillingInfoValue(input.billingInfo)) {
    return customer
  }

  const existingBillingInfo = sanitizeBillingInfo(customer.billingInfo)
  const nextBillingInfo = sanitizeBillingInfo(input.billingInfo)
  const mergedBillingInfo: BillingInfoInput = {
    companyLegalName: nextBillingInfo.companyLegalName || existingBillingInfo.companyLegalName,
    taxId: nextBillingInfo.taxId || existingBillingInfo.taxId,
    billingAddress: nextBillingInfo.billingAddress || existingBillingInfo.billingAddress,
  }

  if (
    mergedBillingInfo.companyLegalName === existingBillingInfo.companyLegalName
    && mergedBillingInfo.taxId === existingBillingInfo.taxId
    && mergedBillingInfo.billingAddress === existingBillingInfo.billingAddress
  ) {
    return customer
  }

  return saveCustomerRecord(customer.id, mergeCustomerRecord(customer, {
    billingInfo: mergedBillingInfo,
  }))
}

export async function syncCustomerLinksByEmail(
  email: string,
  options: { markAccountLinked?: boolean } = {},
): Promise<CustomerRecord | null> {
  const normalizedEmail = normalizeEmail(email)
  const customer = await ensureCustomerFromHistory(normalizedEmail)
  if (!customer) return null

  await ensureCustomerReferenceColumns()

  const pool = getPool()
  const markAccountLinked = Boolean(options.markAccountLinked)
  const hasNumericCustomerId = /^\d+$/.test(customer.id)
  const numericCustomerId = hasNumericCustomerId ? Number.parseInt(customer.id, 10) : null
  const hasUuidCustomerId = isUuid(customer.id)

  await pool.query(
    `UPDATE orders
     SET customer_ref = CASE
           WHEN $1::boolean THEN $2
           ELSE customer_ref
         END,
         customer_ref_id = CASE
           WHEN $3::boolean THEN $4::uuid
           ELSE customer_ref_id
         END,
         guest_email = COALESCE(guest_email, customer_email),
         ownership_status = CASE
           WHEN $5 THEN 'linked'
           ELSE COALESCE(ownership_status, 'guest')
         END,
         claimed_at = CASE
           WHEN $5 AND claimed_at IS NULL THEN NOW()
           ELSE claimed_at
         END
     WHERE LOWER(customer_email) = $6
       AND (
         ($1::boolean AND customer_ref IS DISTINCT FROM $2)
         OR ($3::boolean AND customer_ref_id IS DISTINCT FROM $4::uuid)
         OR ($5 AND ownership_status IS DISTINCT FROM 'linked')
         OR guest_email IS NULL
       )`,
    [
      hasNumericCustomerId,
      numericCustomerId,
      hasUuidCustomerId,
      hasUuidCustomerId ? customer.id : null,
      markAccountLinked,
      normalizedEmail,
    ],
  )

  await linkRfqSubmissionsToCustomerByEmail(normalizedEmail, customer.id)

  return customer
}
