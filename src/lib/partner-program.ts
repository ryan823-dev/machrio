import crypto from 'crypto'
import { getPool } from '@/lib/db'

const PUBLIC_BASE_URL =
  process.env.NEXT_PUBLIC_SERVER_URL || 'https://www.machrio.com'

const PUBLIC_HOST = new URL(PUBLIC_BASE_URL).host.replace(/^www\./, '')
const PARTNER_WINDOW_DAYS = 30

export const PARTNER_ATTRIBUTION_COOKIE = 'machrio_partner_attribution'
export const PARTNER_COMMISSION_RATE = 0.03
export const PARTNER_COOKIE_MAX_AGE = 60 * 60 * 24 * PARTNER_WINDOW_DAYS

let partnerProgramInitialized = false

export interface CreatorPartnerRow {
  id: string
  email: string
  full_name: string
  website: string | null
  country: string | null
  status: string
  partner_code: string
  main_platform: string | null
  platform_links: unknown
  expertise: unknown
  sample_work_urls: unknown
  topic_pitch: string | null
  message: string | null
  payout_method: string | null
  payout_account: string | null
  created_at: string
  updated_at: string
  approved_at: string | null
}

export interface PartnerAttribution {
  partnerId: string
  partnerCode: string
  trackingLinkId: string
  publicationId: string | null
  clickId: string
  attributedAt: string
  targetUrl: string
}

export interface PartnerApplicationInput {
  name: string
  email: string
  website?: string | null
  country?: string | null
  mainPlatform?: string | null
  platformLinks?: string[]
  expertise?: string[]
  sampleWorkUrls?: string[]
  topicPitch?: string | null
  message?: string | null
  payoutMethod?: string | null
  payoutAccount?: string | null
}

export interface PartnerPayoutDetailItem {
  id: string
  itemType: string
  sourceId: string
  sourceLabel: string | null
  amount: number
  currency: string
  createdAt: string | null
  sourceStatus: string | null
  publicationUrl: string | null
  orderId: string | null
  orderNumber: string | null
  grossAmount: number | null
  netAmount: number | null
  commissionRate: number | null
  commissionAmount: number | null
}

export interface PartnerPayoutDetail {
  payout: {
    id: string
    partnerId: string
    partnerName: string
    partnerEmail: string
    partnerCode: string
    payoutNumber: string
    currency: string
    status: string
    method: string | null
    destination: string | null
    contentFeeTotal: number
    commissionTotal: number
    totalAmount: number
    itemCount: number
    notes: string | null
    createdByEmail: string | null
    transactionRef: string | null
    createdAt: string | null
    updatedAt: string | null
    paidAt: string | null
  }
  items: PartnerPayoutDetailItem[]
}

function toTextArray(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value
    .map((item) => (typeof item === 'string' ? item.trim() : ''))
    .filter(Boolean)
}

function parseJsonArray(value: unknown): string[] {
  if (Array.isArray(value)) return toTextArray(value)
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value)
      if (Array.isArray(parsed)) return toTextArray(parsed)
    } catch {
      return value
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean)
    }
  }
  return []
}

function slugToken(value: string, fallback: string): string {
  const token = value
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '')
    .slice(0, 8)
  return token || fallback
}

function roundCurrency(value: number): number {
  return Math.round(value * 100) / 100
}

function toNullableNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null
  const numeric = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(numeric) ? roundCurrency(numeric) : null
}

function formatTimestampForExport(value: unknown): string {
  if (!value) return ''
  const normalized = String(value)
  const date = new Date(normalized)
  return Number.isNaN(date.getTime()) ? normalized : date.toISOString()
}

function csvCell(value: unknown): string {
  return `"${String(value ?? '').replace(/"/g, '""')}"`
}

function sanitizeFileToken(value: string, fallback: string): string {
  const sanitized = value
    .trim()
    .replace(/[^A-Za-z0-9_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
  return sanitized || fallback
}

function getDefaultContentFee(contentType?: string | null): number {
  switch ((contentType || '').toLowerCase()) {
    case 'social':
    case 'social-post':
    case 'thread':
      return 10
    case 'video':
      return 30
    case 'landing-page':
    case 'resource-page':
      return 25
    case 'article':
    case 'blog':
    default:
      return 20
  }
}

function getDeviceType(userAgent: string): string {
  const ua = userAgent.toLowerCase()
  if (ua.includes('mobile')) return 'mobile'
  if (ua.includes('tablet') || ua.includes('ipad')) return 'tablet'
  return 'desktop'
}

function getClientIp(headers: Headers): string {
  const forwarded = headers.get('x-forwarded-for')
  if (forwarded) return forwarded.split(',')[0]?.trim() || ''
  return headers.get('x-real-ip') || ''
}

function hashValue(value: string): string | null {
  if (!value) return null
  return crypto.createHash('sha256').update(value).digest('hex')
}

function getSessionToken(headers: Headers): string | null {
  const authHeader = headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) return null
  const token = authHeader.slice(7)
  return token.length === 64 ? token : null
}

function normalizeExternalUrl(value?: string | null): string | null {
  if (!value) return null
  try {
    const url = new URL(value)
    if (!['http:', 'https:'].includes(url.protocol)) return null
    return url.toString()
  } catch {
    return null
  }
}

export function normalizeMachrioTargetUrl(value?: string | null): string | null {
  if (!value) return null

  try {
    const url = new URL(value, PUBLIC_BASE_URL)
    if (!['http:', 'https:'].includes(url.protocol)) return null

    const hostname = url.host.replace(/^www\./, '')
    if (hostname !== PUBLIC_HOST) return null

    return url.toString()
  } catch {
    return null
  }
}

export function encodePartnerAttributionCookie(
  attribution: PartnerAttribution,
): string {
  return Buffer.from(JSON.stringify(attribution), 'utf8').toString('base64url')
}

export function decodePartnerAttributionCookie(
  value?: string | null,
): PartnerAttribution | null {
  if (!value) return null

  try {
    const parsed = JSON.parse(
      Buffer.from(value, 'base64url').toString('utf8'),
    ) as PartnerAttribution

    if (
      !parsed.partnerId ||
      !parsed.partnerCode ||
      !parsed.trackingLinkId ||
      !parsed.clickId ||
      !parsed.attributedAt
    ) {
      return null
    }

    const age = Date.now() - new Date(parsed.attributedAt).getTime()
    if (!Number.isFinite(age) || age > PARTNER_COOKIE_MAX_AGE * 1000) {
      return null
    }

    return parsed
  } catch {
    return null
  }
}

export function getPartnerAttributionFromHeaders(
  headers: Headers,
): PartnerAttribution | null {
  const cookieHeader = headers.get('cookie')
  if (!cookieHeader) return null

  const cookies = cookieHeader.split(';')
  for (const entry of cookies) {
    const [rawName, ...rawValue] = entry.trim().split('=')
    if (rawName !== PARTNER_ATTRIBUTION_COOKIE) continue
    return decodePartnerAttributionCookie(rawValue.join('='))
  }

  return null
}

async function generateUniquePartnerCode(
  name: string,
  email: string,
): Promise<string> {
  const pool = getPool()
  const base = `${slugToken(name, 'MACH')}${slugToken(email.split('@')[0] || '', 'RIO')}`.slice(0, 10)

  for (let attempt = 0; attempt < 10; attempt += 1) {
    const suffix = attempt === 0
      ? crypto.randomBytes(2).toString('hex').toUpperCase()
      : crypto.randomBytes(3).toString('hex').toUpperCase()
    const partnerCode = `${base}${suffix}`.slice(0, 16)
    const existing = await pool.query(
      `SELECT 1 FROM creator_partners WHERE partner_code = $1 LIMIT 1`,
      [partnerCode],
    )
    if (existing.rows.length === 0) return partnerCode
  }

  return `MCH${crypto.randomBytes(5).toString('hex').toUpperCase()}`
}

async function generateUniqueShortCode(): Promise<string> {
  const pool = getPool()

  for (let attempt = 0; attempt < 10; attempt += 1) {
    const shortCode = crypto.randomBytes(4).toString('hex').toUpperCase()
    const existing = await pool.query(
      `SELECT 1 FROM creator_tracking_links WHERE short_code = $1 LIMIT 1`,
      [shortCode],
    )
    if (existing.rows.length === 0) return shortCode
  }

  return crypto.randomBytes(5).toString('hex').toUpperCase()
}

async function generateUniquePayoutNumber(): Promise<string> {
  const pool = getPool()

  for (let attempt = 0; attempt < 10; attempt += 1) {
    const payoutNumber = `PYO-${Date.now().toString(36).toUpperCase()}-${crypto
      .randomBytes(2)
      .toString('hex')
      .toUpperCase()}`

    const existing = await pool.query(
      `SELECT 1 FROM creator_payouts WHERE payout_number = $1 LIMIT 1`,
      [payoutNumber],
    )
    if (existing.rows.length === 0) return payoutNumber
  }

  return `PYO-${crypto.randomBytes(6).toString('hex').toUpperCase()}`
}

export async function ensurePartnerProgramTables(): Promise<void> {
  if (partnerProgramInitialized) return

  const pool = getPool()

  await pool.query(`
    CREATE TABLE IF NOT EXISTS creator_partners (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      email TEXT NOT NULL UNIQUE,
      full_name TEXT NOT NULL,
      website TEXT,
      country TEXT,
      status TEXT NOT NULL DEFAULT 'pending',
      partner_code TEXT NOT NULL UNIQUE,
      main_platform TEXT,
      platform_links JSONB NOT NULL DEFAULT '[]'::jsonb,
      expertise JSONB NOT NULL DEFAULT '[]'::jsonb,
      sample_work_urls JSONB NOT NULL DEFAULT '[]'::jsonb,
      topic_pitch TEXT,
      message TEXT,
      payout_method TEXT,
      payout_account TEXT,
      notes TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      approved_at TIMESTAMPTZ
    )
  `)

  await pool.query(`
    CREATE TABLE IF NOT EXISTS creator_publications (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      partner_id UUID NOT NULL,
      tracking_link_id UUID,
      platform TEXT NOT NULL,
      content_type TEXT NOT NULL,
      title TEXT NOT NULL,
      published_url TEXT NOT NULL,
      published_at TIMESTAMPTZ,
      review_status TEXT NOT NULL DEFAULT 'submitted',
      fee_amount NUMERIC NOT NULL DEFAULT 20,
      fee_status TEXT NOT NULL DEFAULT 'pending',
      reported_metrics JSONB NOT NULL DEFAULT '{}'::jsonb,
      notes TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      approved_at TIMESTAMPTZ
    )
  `)

  await pool.query(`
    CREATE TABLE IF NOT EXISTS creator_tracking_links (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      partner_id UUID NOT NULL,
      publication_id UUID,
      short_code TEXT NOT NULL UNIQUE,
      title TEXT NOT NULL,
      target_url TEXT NOT NULL,
      target_type TEXT NOT NULL DEFAULT 'custom',
      target_label TEXT,
      utm_source TEXT NOT NULL DEFAULT 'creator-partner',
      utm_medium TEXT NOT NULL DEFAULT 'affiliate',
      utm_campaign TEXT,
      link_status TEXT NOT NULL DEFAULT 'active',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `)

  await pool.query(`
    CREATE TABLE IF NOT EXISTS creator_click_events (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      click_id TEXT NOT NULL UNIQUE,
      partner_id UUID NOT NULL,
      tracking_link_id UUID NOT NULL,
      publication_id UUID,
      short_code TEXT NOT NULL,
      target_url TEXT NOT NULL,
      referrer TEXT,
      user_agent TEXT,
      ip_hash TEXT,
      country TEXT,
      device_type TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `)

  await pool.query(`
    CREATE TABLE IF NOT EXISTS creator_lead_events (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      partner_id UUID NOT NULL,
      tracking_link_id UUID,
      publication_id UUID,
      click_id TEXT,
      rfq_id TEXT,
      customer_email TEXT,
      customer_company TEXT,
      source_page TEXT,
      status TEXT NOT NULL DEFAULT 'new',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `)

  await pool.query(`
    CREATE TABLE IF NOT EXISTS creator_commissions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      partner_id UUID NOT NULL,
      tracking_link_id UUID,
      publication_id UUID,
      click_id TEXT,
      order_id TEXT UNIQUE,
      order_number TEXT,
      currency TEXT NOT NULL DEFAULT 'USD',
      gross_amount NUMERIC NOT NULL DEFAULT 0,
      net_amount NUMERIC NOT NULL DEFAULT 0,
      commission_rate NUMERIC NOT NULL DEFAULT ${PARTNER_COMMISSION_RATE},
      commission_amount NUMERIC NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'pending',
      notes TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      paid_at TIMESTAMPTZ
    )
  `)

  await pool.query(`
    CREATE TABLE IF NOT EXISTS creator_payouts (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      partner_id UUID NOT NULL,
      payout_number TEXT NOT NULL UNIQUE,
      currency TEXT NOT NULL DEFAULT 'USD',
      status TEXT NOT NULL DEFAULT 'pending',
      method TEXT,
      destination TEXT,
      content_fee_total NUMERIC NOT NULL DEFAULT 0,
      commission_total NUMERIC NOT NULL DEFAULT 0,
      total_amount NUMERIC NOT NULL DEFAULT 0,
      item_count INTEGER NOT NULL DEFAULT 0,
      notes TEXT,
      created_by_email TEXT,
      transaction_ref TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      paid_at TIMESTAMPTZ
    )
  `)

  await pool.query(`
    CREATE TABLE IF NOT EXISTS creator_payout_items (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      payout_id UUID NOT NULL,
      partner_id UUID NOT NULL,
      item_type TEXT NOT NULL,
      source_id TEXT NOT NULL,
      source_label TEXT,
      amount NUMERIC NOT NULL DEFAULT 0,
      currency TEXT NOT NULL DEFAULT 'USD',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `)

  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_creator_partners_status
    ON creator_partners(status)
  `)
  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_creator_publications_partner_id
    ON creator_publications(partner_id, created_at DESC)
  `)
  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_creator_tracking_links_partner_id
    ON creator_tracking_links(partner_id, created_at DESC)
  `)
  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_creator_click_events_partner_id
    ON creator_click_events(partner_id, created_at DESC)
  `)
  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_creator_commissions_partner_id
    ON creator_commissions(partner_id, created_at DESC)
  `)
  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_creator_payouts_partner_id
    ON creator_payouts(partner_id, created_at DESC)
  `)
  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_creator_payout_items_payout_id
    ON creator_payout_items(payout_id)
  `)

  await pool.query(`
    ALTER TABLE IF EXISTS orders
    ADD COLUMN IF NOT EXISTS partner_id TEXT,
    ADD COLUMN IF NOT EXISTS partner_code TEXT,
    ADD COLUMN IF NOT EXISTS partner_tracking_link_id TEXT,
    ADD COLUMN IF NOT EXISTS partner_publication_id TEXT,
    ADD COLUMN IF NOT EXISTS partner_click_id TEXT,
    ADD COLUMN IF NOT EXISTS partner_commission_rate NUMERIC,
    ADD COLUMN IF NOT EXISTS partner_commission_amount NUMERIC
  `)

  await pool.query(`
    ALTER TABLE IF EXISTS rfq_submissions
    ADD COLUMN IF NOT EXISTS partner_id TEXT,
    ADD COLUMN IF NOT EXISTS partner_code TEXT,
    ADD COLUMN IF NOT EXISTS partner_tracking_link_id TEXT,
    ADD COLUMN IF NOT EXISTS partner_publication_id TEXT,
    ADD COLUMN IF NOT EXISTS partner_click_id TEXT
  `)

  partnerProgramInitialized = true
}

export async function getSessionEmail(headers: Headers): Promise<string | null> {
  const token = getSessionToken(headers)
  if (!token) return null

  const pool = getPool()
  const result = await pool.query(
    `SELECT email
     FROM account_sessions
     WHERE token = $1 AND expires_at > NOW()
     ORDER BY created_at DESC
     LIMIT 1`,
    [token],
  )

  return result.rows[0]?.email || null
}

export async function getPartnerByEmail(
  email: string,
): Promise<CreatorPartnerRow | null> {
  await ensurePartnerProgramTables()

  const pool = getPool()
  const result = await pool.query(
    `SELECT *
     FROM creator_partners
     WHERE email = $1
     LIMIT 1`,
    [email.toLowerCase().trim()],
  )

  return (result.rows[0] as CreatorPartnerRow | undefined) || null
}

export async function createOrUpdatePartnerApplication(
  input: PartnerApplicationInput,
): Promise<CreatorPartnerRow> {
  await ensurePartnerProgramTables()

  const pool = getPool()
  const email = input.email.toLowerCase().trim()
  const name = input.name.trim()
  const website = normalizeExternalUrl(input.website)
  const partnerCode = await generateUniquePartnerCode(name, email)

  const result = await pool.query(
    `INSERT INTO creator_partners (
      email,
      full_name,
      website,
      country,
      status,
      partner_code,
      main_platform,
      platform_links,
      expertise,
      sample_work_urls,
      topic_pitch,
      message,
      payout_method,
      payout_account,
      created_at,
      updated_at
    ) VALUES (
      $1, $2, $3, $4, 'pending', $5, $6, $7::jsonb, $8::jsonb, $9::jsonb, $10, $11, $12, $13, NOW(), NOW()
    )
    ON CONFLICT (email)
    DO UPDATE SET
      full_name = EXCLUDED.full_name,
      website = EXCLUDED.website,
      country = EXCLUDED.country,
      main_platform = EXCLUDED.main_platform,
      platform_links = EXCLUDED.platform_links,
      expertise = EXCLUDED.expertise,
      sample_work_urls = EXCLUDED.sample_work_urls,
      topic_pitch = EXCLUDED.topic_pitch,
      message = EXCLUDED.message,
      payout_method = EXCLUDED.payout_method,
      payout_account = EXCLUDED.payout_account,
      status = CASE
        WHEN creator_partners.status IN ('approved', 'active', 'paused') THEN creator_partners.status
        ELSE 'pending'
      END,
      updated_at = NOW()
    RETURNING *`,
    [
      email,
      name,
      website,
      input.country?.trim() || null,
      partnerCode,
      input.mainPlatform?.trim() || null,
      JSON.stringify(toTextArray(input.platformLinks)),
      JSON.stringify(toTextArray(input.expertise)),
      JSON.stringify(toTextArray(input.sampleWorkUrls)),
      input.topicPitch?.trim() || null,
      input.message?.trim() || null,
      input.payoutMethod?.trim() || null,
      input.payoutAccount?.trim() || null,
    ],
  )

  return result.rows[0] as CreatorPartnerRow
}

export async function createPartnerLink(input: {
  partnerId: string
  title: string
  targetUrl: string
  targetType?: string | null
  targetLabel?: string | null
  utmCampaign?: string | null
}): Promise<{
  id: string
  shortCode: string
  shortUrl: string
}> {
  await ensurePartnerProgramTables()

  const pool = getPool()
  const shortCode = await generateUniqueShortCode()
  const result = await pool.query(
    `INSERT INTO creator_tracking_links (
      partner_id,
      short_code,
      title,
      target_url,
      target_type,
      target_label,
      utm_campaign,
      created_at,
      updated_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
    RETURNING id, short_code`,
    [
      input.partnerId,
      shortCode,
      input.title.trim(),
      input.targetUrl,
      input.targetType?.trim() || 'custom',
      input.targetLabel?.trim() || null,
      input.utmCampaign?.trim() || null,
    ],
  )

  return {
    id: result.rows[0].id as string,
    shortCode,
    shortUrl: '',
  }
}

export async function getPartnerLinks(partnerId: string) {
  await ensurePartnerProgramTables()

  const pool = getPool()
  const result = await pool.query(
    `SELECT
       l.id::text AS id,
       l.short_code,
       l.title,
       l.target_url,
       l.target_type,
       l.target_label,
       l.link_status,
       l.publication_id::text AS publication_id,
       l.created_at,
       COALESCE(COUNT(c.id), 0) AS click_count
     FROM creator_tracking_links l
     LEFT JOIN creator_click_events c ON c.tracking_link_id = l.id
     WHERE l.partner_id = $1
     GROUP BY l.id
     ORDER BY l.created_at DESC`,
    [partnerId],
  )

  return result.rows
}

export async function createPartnerPublication(input: {
  partnerId: string
  trackingLinkId: string
  title: string
  platform: string
  contentType: string
  publishedUrl: string
  publishedAt?: string | null
  reportedMetrics?: Record<string, number | string | null>
}): Promise<{ id: string }> {
  await ensurePartnerProgramTables()

  const pool = getPool()
  const feeAmount = getDefaultContentFee(input.contentType)

  const result = await pool.query(
    `INSERT INTO creator_publications (
      partner_id,
      tracking_link_id,
      platform,
      content_type,
      title,
      published_url,
      published_at,
      fee_amount,
      reported_metrics,
      created_at,
      updated_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9::jsonb, NOW(), NOW())
    RETURNING id`,
    [
      input.partnerId,
      input.trackingLinkId,
      input.platform.trim(),
      input.contentType.trim(),
      input.title.trim(),
      input.publishedUrl,
      input.publishedAt || null,
      feeAmount,
      JSON.stringify(input.reportedMetrics || {}),
    ],
  )

  const publicationId = result.rows[0].id as string

  await pool.query(
    `UPDATE creator_tracking_links
     SET publication_id = $1, updated_at = NOW()
     WHERE id = $2 AND partner_id = $3`,
    [publicationId, input.trackingLinkId, input.partnerId],
  )

  return { id: publicationId }
}

export async function getPartnerPublications(partnerId: string) {
  await ensurePartnerProgramTables()

  const pool = getPool()
  const result = await pool.query(
    `SELECT
       p.id::text AS id,
       p.platform,
       p.content_type,
       p.title,
       p.published_url,
       p.published_at,
       p.review_status,
       p.fee_amount,
       p.fee_status,
       p.reported_metrics,
       p.created_at,
       l.short_code,
       COALESCE(COUNT(c.id), 0) AS click_count,
       COALESCE(COUNT(DISTINCT o.id), 0) AS order_count,
       COALESCE(SUM(o.subtotal), 0) AS sales_amount,
       COALESCE(SUM(o.partner_commission_amount), 0) AS commission_amount
     FROM creator_publications p
     LEFT JOIN creator_tracking_links l ON l.id = p.tracking_link_id
     LEFT JOIN creator_click_events c ON c.publication_id = p.id
     LEFT JOIN orders o ON o.partner_publication_id = p.id::text
     WHERE p.partner_id = $1
     GROUP BY p.id, l.short_code
     ORDER BY COALESCE(p.published_at, p.created_at) DESC`,
    [partnerId],
  )

  return result.rows
}

export async function getPartnerPayouts(partnerId: string) {
  await ensurePartnerProgramTables()

  const pool = getPool()
  const result = await pool.query(
    `SELECT
       id::text AS id,
       payout_number,
       currency,
       status,
       method,
       destination,
       content_fee_total,
       commission_total,
       total_amount,
       item_count,
       transaction_ref,
       created_at,
       paid_at
     FROM creator_payouts
     WHERE partner_id = $1
     ORDER BY created_at DESC
     LIMIT 20`,
    [partnerId],
  )

  return result.rows
}

export async function getPartnerDashboardData(partner: CreatorPartnerRow) {
  await ensurePartnerProgramTables()

  const pool = getPool()

  const [summaryResult, links, publications, commissions, payouts] = await Promise.all([
    pool.query(
      `SELECT
         (SELECT COUNT(*) FROM creator_tracking_links WHERE partner_id = $1) AS link_count,
         (SELECT COUNT(*) FROM creator_publications WHERE partner_id = $1) AS publication_count,
         (SELECT COUNT(*) FROM creator_click_events WHERE partner_id = $1) AS click_count,
         (SELECT COUNT(*) FROM creator_lead_events WHERE partner_id = $1) AS lead_count,
         (SELECT COUNT(*) FROM orders WHERE partner_id = $1::text) AS order_count,
         (SELECT COALESCE(SUM(subtotal), 0) FROM orders WHERE partner_id = $1::text) AS sales_amount,
         (SELECT COALESCE(SUM(partner_commission_amount), 0) FROM orders WHERE partner_id = $1::text) AS estimated_commission,
         (SELECT COALESCE(SUM(fee_amount), 0) FROM creator_publications WHERE partner_id = $1 AND fee_status <> 'reversed') AS content_fees,
         (SELECT COALESCE(SUM(fee_amount), 0) FROM creator_publications WHERE partner_id = $1 AND fee_status = 'approved') AS approved_content_fees,
         (SELECT COALESCE(SUM(commission_amount), 0) FROM creator_commissions WHERE partner_id = $1 AND status = 'approved') AS approved_commission,
         (SELECT COALESCE(SUM(commission_amount), 0) FROM creator_commissions WHERE partner_id = $1 AND status = 'pending') AS pending_commission,
         (SELECT COALESCE(SUM(total_amount), 0) FROM creator_payouts WHERE partner_id = $1 AND status = 'paid') AS paid_out_total,
         (SELECT COALESCE(SUM(total_amount), 0) FROM creator_payouts WHERE partner_id = $1 AND status = 'pending') AS pending_payout_total`,
      [partner.id],
    ),
    getPartnerLinks(partner.id),
    getPartnerPublications(partner.id),
    pool.query(
      `SELECT
         id::text AS id,
         order_number,
         currency,
         net_amount,
         commission_amount,
         status,
         created_at
       FROM creator_commissions
       WHERE partner_id = $1
       ORDER BY created_at DESC
       LIMIT 20`,
      [partner.id],
    ),
    getPartnerPayouts(partner.id),
  ])

  return {
    partner: {
      id: partner.id,
      name: partner.full_name,
      email: partner.email,
      website: partner.website,
      country: partner.country,
      status: partner.status,
      partnerCode: partner.partner_code,
      mainPlatform: partner.main_platform,
      expertise: parseJsonArray(partner.expertise),
      platformLinks: parseJsonArray(partner.platform_links),
      sampleWorkUrls: parseJsonArray(partner.sample_work_urls),
      topicPitch: partner.topic_pitch,
      message: partner.message,
      payoutMethod: partner.payout_method,
      payoutAccount: partner.payout_account,
      createdAt: partner.created_at,
      approvedAt: partner.approved_at,
    },
    summary: summaryResult.rows[0],
    links,
    publications,
    commissions: commissions.rows,
    payouts,
  }
}

export async function getAdminOverview() {
  await ensurePartnerProgramTables()

  const pool = getPool()

  const [summary, pendingApplications, publicationsToReview, topPublications, topPartners, payoutCandidates, payouts] = await Promise.all([
    pool.query(
      `SELECT
         (SELECT COUNT(*) FROM creator_partners) AS total_partners,
         (SELECT COUNT(*) FROM creator_partners WHERE status = 'pending') AS pending_partners,
         (SELECT COUNT(*) FROM creator_publications WHERE review_status IN ('submitted', 'under-review')) AS publications_to_review,
         (SELECT COUNT(*) FROM creator_click_events) AS total_clicks,
         (SELECT COUNT(*) FROM orders WHERE partner_id IS NOT NULL) AS partner_orders,
         (SELECT COALESCE(SUM(subtotal), 0) FROM orders WHERE partner_id IS NOT NULL) AS partner_sales,
         (SELECT COALESCE(SUM(partner_commission_amount), 0) FROM orders WHERE partner_id IS NOT NULL) AS estimated_commissions,
         (SELECT COALESCE(SUM(fee_amount), 0) FROM creator_publications WHERE fee_status = 'approved') AS approved_fees_ready,
         (SELECT COALESCE(SUM(commission_amount), 0) FROM creator_commissions WHERE status = 'approved') AS approved_commissions_ready,
         (SELECT COALESCE(SUM(total_amount), 0) FROM creator_payouts WHERE status = 'pending') AS pending_payout_total,
         (SELECT COALESCE(SUM(total_amount), 0) FROM creator_payouts WHERE status = 'paid') AS paid_out_total`,
    ),
    pool.query(
      `SELECT
         id::text AS id,
         full_name,
         email,
         status,
         partner_code,
         main_platform,
         created_at
       FROM creator_partners
       ORDER BY created_at DESC
       LIMIT 20`,
    ),
    pool.query(
      `SELECT
         p.id::text AS id,
         p.partner_id::text AS partner_id,
         cp.full_name AS partner_name,
         cp.partner_code,
         cp.email,
         p.title,
         p.platform,
         p.content_type,
         p.published_url,
         p.review_status,
         p.fee_amount,
         p.fee_status,
         p.created_at,
         COALESCE(COUNT(c.id), 0) AS click_count,
         COALESCE(COUNT(DISTINCT o.id), 0) AS order_count,
         COALESCE(SUM(o.subtotal), 0) AS sales_amount
       FROM creator_publications p
       JOIN creator_partners cp ON cp.id = p.partner_id
       LEFT JOIN creator_click_events c ON c.publication_id = p.id
       LEFT JOIN orders o ON o.partner_publication_id = p.id::text
       WHERE p.review_status IN ('submitted', 'under-review')
       GROUP BY p.id, cp.full_name, cp.partner_code, cp.email
       ORDER BY p.created_at DESC
       LIMIT 20`,
    ),
    pool.query(
      `SELECT
         p.id::text AS id,
         cp.full_name AS partner_name,
         p.title,
         p.platform,
         p.published_url,
         COALESCE(COUNT(c.id), 0) AS click_count,
         COALESCE(COUNT(DISTINCT o.id), 0) AS order_count,
         COALESCE(SUM(o.subtotal), 0) AS sales_amount
       FROM creator_publications p
       JOIN creator_partners cp ON cp.id = p.partner_id
       LEFT JOIN creator_click_events c ON c.publication_id = p.id
       LEFT JOIN orders o ON o.partner_publication_id = p.id::text
       GROUP BY p.id, cp.full_name
       ORDER BY sales_amount DESC, click_count DESC
       LIMIT 10`,
    ),
    pool.query(
      `SELECT
         cp.id::text AS id,
         cp.full_name,
         cp.partner_code,
         COALESCE(COUNT(DISTINCT o.id), 0) AS order_count,
         COALESCE(SUM(o.subtotal), 0) AS sales_amount,
         COALESCE(SUM(o.partner_commission_amount), 0) AS commission_amount
       FROM creator_partners cp
       LEFT JOIN orders o ON o.partner_id = cp.id::text
       GROUP BY cp.id
       ORDER BY sales_amount DESC, order_count DESC
       LIMIT 10`,
    ),
    pool.query(
      `WITH fee_candidates AS (
         SELECT
           partner_id::text AS partner_id,
           'USD'::text AS currency,
           COUNT(*) AS fee_count,
           COALESCE(SUM(fee_amount), 0) AS fee_total,
           0::bigint AS commission_count,
           0::numeric AS commission_total
         FROM creator_publications
         WHERE review_status = 'approved'
           AND fee_status = 'approved'
           AND fee_amount > 0
         GROUP BY partner_id
       ),
       commission_candidates AS (
         SELECT
           partner_id::text AS partner_id,
           currency,
           0::bigint AS fee_count,
           0::numeric AS fee_total,
           COUNT(*) AS commission_count,
           COALESCE(SUM(commission_amount), 0) AS commission_total
         FROM creator_commissions
         WHERE status = 'approved'
           AND commission_amount > 0
         GROUP BY partner_id, currency
       ),
       grouped AS (
         SELECT
           partner_id,
           currency,
           SUM(fee_count) AS fee_count,
           SUM(fee_total) AS fee_total,
           SUM(commission_count) AS commission_count,
           SUM(commission_total) AS commission_total
         FROM (
           SELECT * FROM fee_candidates
           UNION ALL
           SELECT * FROM commission_candidates
         ) candidates
         GROUP BY partner_id, currency
       )
       SELECT
         cp.id::text AS partner_id,
         cp.full_name,
         cp.email,
         cp.partner_code,
         cp.payout_method,
         cp.payout_account,
         grouped.currency,
         grouped.fee_count,
         grouped.fee_total,
         grouped.commission_count,
         grouped.commission_total,
         grouped.fee_total + grouped.commission_total AS total_due
       FROM grouped
       JOIN creator_partners cp ON cp.id::text = grouped.partner_id
       WHERE grouped.fee_total + grouped.commission_total > 0
       ORDER BY total_due DESC, cp.full_name ASC
       LIMIT 50`,
    ),
    pool.query(
      `SELECT
         p.id::text AS id,
         p.partner_id::text AS partner_id,
         cp.full_name,
         cp.partner_code,
         p.payout_number,
         p.currency,
         p.status,
         p.method,
         p.destination,
         p.content_fee_total,
         p.commission_total,
         p.total_amount,
         p.item_count,
         p.transaction_ref,
         p.created_at,
         p.paid_at
       FROM creator_payouts p
       JOIN creator_partners cp ON cp.id = p.partner_id
       ORDER BY p.created_at DESC
       LIMIT 30`,
    ),
  ])

  return {
    summary: summary.rows[0],
    pendingApplications: pendingApplications.rows,
    publicationsToReview: publicationsToReview.rows,
    topPublications: topPublications.rows,
    topPartners: topPartners.rows,
    payoutCandidates: payoutCandidates.rows,
    payouts: payouts.rows,
  }
}

export function isPartnerAdminEmail(email: string): boolean {
  const configured = (process.env.PARTNER_ADMIN_EMAILS || '')
    .split(',')
    .map((entry) => entry.trim().toLowerCase())
    .filter(Boolean)

  const normalized = email.toLowerCase().trim()
  return (
    configured.includes(normalized) ||
    normalized.endsWith('@machrio.com')
  )
}

export async function updatePartnerReviewStatus(input: {
  partnerId: string
  status: 'pending' | 'approved' | 'active' | 'paused' | 'rejected'
  notes?: string | null
}) {
  await ensurePartnerProgramTables()

  const pool = getPool()
  const result = await pool.query(
    `UPDATE creator_partners
     SET status = $2,
         notes = CASE
           WHEN $3::text IS NULL OR $3::text = '' THEN notes
           ELSE $3
         END,
         approved_at = CASE
           WHEN $2 IN ('approved', 'active') THEN COALESCE(approved_at, NOW())
           WHEN $2 = 'pending' THEN NULL
           ELSE approved_at
         END,
         updated_at = NOW()
     WHERE id::text = $1
     RETURNING *`,
    [input.partnerId, input.status, input.notes?.trim() || null],
  )

  return (result.rows[0] as CreatorPartnerRow | undefined) || null
}

export async function updatePublicationReviewStatus(input: {
  publicationId: string
  reviewStatus: 'submitted' | 'under-review' | 'approved' | 'rejected'
  feeAmount?: number | null
  notes?: string | null
}) {
  await ensurePartnerProgramTables()

  const pool = getPool()
  const nextFeeAmount =
    typeof input.feeAmount === 'number' && Number.isFinite(input.feeAmount)
      ? roundCurrency(Math.max(input.feeAmount, 0))
      : null

  const result = await pool.query(
    `UPDATE creator_publications
     SET review_status = $2,
         fee_amount = COALESCE($3, fee_amount),
         fee_status = CASE
           WHEN $2 = 'approved' AND COALESCE($3, fee_amount) > 0 THEN 'approved'
           WHEN $2 = 'approved' AND COALESCE($3, fee_amount) <= 0 THEN 'waived'
           WHEN $2 = 'rejected' THEN 'reversed'
           ELSE fee_status
         END,
         notes = CASE
           WHEN $4::text IS NULL OR $4::text = '' THEN notes
           ELSE $4
         END,
         approved_at = CASE
           WHEN $2 = 'approved' THEN COALESCE(approved_at, NOW())
           ELSE approved_at
         END,
         updated_at = NOW()
     WHERE id::text = $1
     RETURNING id::text AS id, partner_id::text AS partner_id, review_status, fee_amount, fee_status`,
    [input.publicationId, input.reviewStatus, nextFeeAmount, input.notes?.trim() || null],
  )

  return result.rows[0] || null
}

export async function recordPartnerClick(
  partnerCode: string,
  shortCode: string,
  headers: Headers,
): Promise<{
  targetUrl: string
  attribution: PartnerAttribution
}> {
  await ensurePartnerProgramTables()

  const pool = getPool()
  const result = await pool.query(
    `SELECT
       l.id::text AS tracking_link_id,
       l.publication_id::text AS publication_id,
       l.target_url,
       p.id::text AS partner_id,
       p.partner_code,
       p.status
     FROM creator_tracking_links l
     JOIN creator_partners p ON p.id = l.partner_id
     WHERE p.partner_code = $1
       AND l.short_code = $2
       AND l.link_status = 'active'
     LIMIT 1`,
    [partnerCode, shortCode],
  )

  if (result.rows.length === 0) {
    throw new Error('Tracking link not found')
  }

  const link = result.rows[0]
  if (!['approved', 'active'].includes(link.status as string)) {
    throw new Error('Partner is not active')
  }

  const clickId = crypto.randomBytes(8).toString('hex')
  const targetUrl = link.target_url as string
  const userAgent = headers.get('user-agent') || ''
  const referrer = headers.get('referer') || ''
  const ip = getClientIp(headers)
  const country = headers.get('x-vercel-ip-country') || headers.get('cf-ipcountry') || ''

  await pool.query(
    `INSERT INTO creator_click_events (
      click_id,
      partner_id,
      tracking_link_id,
      publication_id,
      short_code,
      target_url,
      referrer,
      user_agent,
      ip_hash,
      country,
      device_type,
      created_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW())`,
    [
      clickId,
      link.partner_id,
      link.tracking_link_id,
      link.publication_id || null,
      shortCode,
      targetUrl,
      referrer || null,
      userAgent || null,
      hashValue(ip),
      country || null,
      getDeviceType(userAgent),
    ],
  )

  return {
    targetUrl,
    attribution: {
      partnerId: link.partner_id as string,
      partnerCode: link.partner_code as string,
      trackingLinkId: link.tracking_link_id as string,
      publicationId: (link.publication_id as string | null) || null,
      clickId,
      attributedAt: new Date().toISOString(),
      targetUrl,
    },
  }
}

function getCommissionStatus(orderStatus?: string, paymentStatus?: string): string {
  if (paymentStatus === 'refunded' || orderStatus === 'refunded' || orderStatus === 'cancelled') {
    return 'reversed'
  }
  if (paymentStatus === 'paid' && ['confirmed', 'processing', 'shipped', 'delivered'].includes(orderStatus || '')) {
    return 'approved'
  }
  return 'pending'
}

function reconcileCommissionStatus(
  orderStatus?: string,
  paymentStatus?: string,
  currentStatus?: string | null,
): string {
  const computedStatus = getCommissionStatus(orderStatus, paymentStatus)

  if (computedStatus === 'reversed') return 'reversed'
  if (
    computedStatus === 'approved' &&
    currentStatus &&
    ['locked', 'paid'].includes(currentStatus)
  ) {
    return currentStatus
  }

  return computedStatus
}

export async function attachPartnerAttributionToOrder(input: {
  headers: Headers
  orderId: string
  orderNumber: string
  subtotal: number
  currency: string
  orderStatus: string
  paymentStatus: string
}): Promise<void> {
  await ensurePartnerProgramTables()

  const attribution = getPartnerAttributionFromHeaders(input.headers)
  if (!attribution) return

  const pool = getPool()
  const commissionAmount = roundCurrency(input.subtotal * PARTNER_COMMISSION_RATE)

  await pool.query(
    `UPDATE orders
     SET partner_id = $1,
         partner_code = $2,
         partner_tracking_link_id = $3,
         partner_publication_id = $4,
         partner_click_id = $5,
         partner_commission_rate = $6,
         partner_commission_amount = $7
     WHERE id::text = $8`,
    [
      attribution.partnerId,
      attribution.partnerCode,
      attribution.trackingLinkId,
      attribution.publicationId,
      attribution.clickId,
      PARTNER_COMMISSION_RATE,
      commissionAmount,
      input.orderId,
    ],
  )

  await pool.query(
    `INSERT INTO creator_commissions (
      partner_id,
      tracking_link_id,
      publication_id,
      click_id,
      order_id,
      order_number,
      currency,
      gross_amount,
      net_amount,
      commission_rate,
      commission_amount,
      status,
      created_at,
      updated_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $8, $9, $10, $11, NOW(), NOW())
    ON CONFLICT (order_id)
    DO UPDATE SET
      partner_id = EXCLUDED.partner_id,
      tracking_link_id = EXCLUDED.tracking_link_id,
      publication_id = EXCLUDED.publication_id,
      click_id = EXCLUDED.click_id,
      order_number = EXCLUDED.order_number,
      currency = EXCLUDED.currency,
      gross_amount = EXCLUDED.gross_amount,
      net_amount = EXCLUDED.net_amount,
      commission_rate = EXCLUDED.commission_rate,
      commission_amount = EXCLUDED.commission_amount,
      status = EXCLUDED.status,
      updated_at = NOW()`,
    [
      attribution.partnerId,
      attribution.trackingLinkId,
      attribution.publicationId,
      attribution.clickId,
      input.orderId,
      input.orderNumber,
      input.currency || 'USD',
      input.subtotal,
      PARTNER_COMMISSION_RATE,
      commissionAmount,
      getCommissionStatus(input.orderStatus, input.paymentStatus),
    ],
  )
}

export async function syncPartnerCommissionForOrderId(orderId: string): Promise<void> {
  await ensurePartnerProgramTables()

  const pool = getPool()
  const result = await pool.query(
    `SELECT
       id::text AS id,
       order_number,
       currency,
       subtotal,
       status,
       payment_status,
       (SELECT status FROM creator_commissions cc WHERE cc.order_id = orders.id::text LIMIT 1) AS current_commission_status,
       partner_id,
       partner_tracking_link_id,
       partner_publication_id,
       partner_click_id
     FROM orders
     WHERE id::text = $1
     LIMIT 1`,
    [orderId],
  )

  if (result.rows.length === 0) return
  const order = result.rows[0]
  if (!order.partner_id) return

  const subtotal = Number(order.subtotal || 0)
  const commissionAmount = roundCurrency(subtotal * PARTNER_COMMISSION_RATE)

  await pool.query(
    `INSERT INTO creator_commissions (
      partner_id,
      tracking_link_id,
      publication_id,
      click_id,
      order_id,
      order_number,
      currency,
      gross_amount,
      net_amount,
      commission_rate,
      commission_amount,
      status,
      created_at,
      updated_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $8, $9, $10, $11, NOW(), NOW())
    ON CONFLICT (order_id)
    DO UPDATE SET
      gross_amount = EXCLUDED.gross_amount,
      net_amount = EXCLUDED.net_amount,
      commission_rate = EXCLUDED.commission_rate,
      commission_amount = EXCLUDED.commission_amount,
      status = EXCLUDED.status,
      updated_at = NOW()`,
    [
      order.partner_id,
      order.partner_tracking_link_id,
      order.partner_publication_id,
      order.partner_click_id,
      order.id,
      order.order_number,
      order.currency || 'USD',
      subtotal,
      PARTNER_COMMISSION_RATE,
      commissionAmount,
      reconcileCommissionStatus(
        order.status as string,
        order.payment_status as string,
        (order.current_commission_status as string | null) || null,
      ),
    ],
  )
}

export async function attachPartnerAttributionToRfq(input: {
  headers: Headers
  rfqId: string
  customerEmail?: string | null
  customerCompany?: string | null
  sourcePage?: string | null
}): Promise<void> {
  await ensurePartnerProgramTables()

  const attribution = getPartnerAttributionFromHeaders(input.headers)
  if (!attribution) return

  const pool = getPool()

  await pool.query(
    `UPDATE rfq_submissions
     SET partner_id = $1,
         partner_code = $2,
         partner_tracking_link_id = $3,
         partner_publication_id = $4,
         partner_click_id = $5
     WHERE id::text = $6`,
    [
      attribution.partnerId,
      attribution.partnerCode,
      attribution.trackingLinkId,
      attribution.publicationId,
      attribution.clickId,
      input.rfqId,
    ],
  )

  await pool.query(
    `INSERT INTO creator_lead_events (
      partner_id,
      tracking_link_id,
      publication_id,
      click_id,
      rfq_id,
      customer_email,
      customer_company,
      source_page,
      created_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())`,
    [
      attribution.partnerId,
      attribution.trackingLinkId,
      attribution.publicationId,
      attribution.clickId,
      input.rfqId,
      input.customerEmail || null,
      input.customerCompany || null,
      input.sourcePage || null,
    ],
  )
}

export function buildPartnerShortUrl(partnerCode: string, shortCode: string): string {
  return `${PUBLIC_BASE_URL}/go/${partnerCode}/${shortCode}`
}

export async function createPartnerPayoutBatch(input: {
  adminEmail: string
  partnerId: string
  currency: string
  method?: string | null
  notes?: string | null
}) {
  await ensurePartnerProgramTables()

  const pool = getPool()
  const client = await pool.connect()

  try {
    await client.query('BEGIN')

    const partnerResult = await client.query(
      `SELECT id::text AS id, full_name, payout_method, payout_account
       FROM creator_partners
       WHERE id::text = $1
       LIMIT 1`,
      [input.partnerId],
    )

    if (partnerResult.rows.length === 0) {
      throw new Error('Partner not found')
    }

    const payoutCurrency = input.currency.toUpperCase().trim() || 'USD'

    const feeResult = await client.query(
      `SELECT
         id::text AS id,
         title,
         fee_amount
       FROM creator_publications
       WHERE partner_id::text = $1
         AND review_status = 'approved'
         AND fee_status = 'approved'
         AND fee_amount > 0
         AND $2 = 'USD'
       ORDER BY approved_at NULLS LAST, created_at ASC
       FOR UPDATE`,
      [input.partnerId, payoutCurrency],
    )

    const commissionResult = await client.query(
      `SELECT
         id::text AS id,
         order_number,
         commission_amount
       FROM creator_commissions
       WHERE partner_id::text = $1
         AND status = 'approved'
         AND currency = $2
         AND commission_amount > 0
       ORDER BY created_at ASC
       FOR UPDATE`,
      [input.partnerId, payoutCurrency],
    )

    const contentFeeTotal = roundCurrency(
      feeResult.rows.reduce((sum, row) => sum + Number(row.fee_amount || 0), 0),
    )
    const commissionTotal = roundCurrency(
      commissionResult.rows.reduce(
        (sum, row) => sum + Number(row.commission_amount || 0),
        0,
      ),
    )
    const totalAmount = roundCurrency(contentFeeTotal + commissionTotal)
    const itemCount = feeResult.rows.length + commissionResult.rows.length

    if (itemCount === 0 || totalAmount <= 0) {
      throw new Error('No approved payout items available for this partner and currency')
    }

    const payoutNumber = await generateUniquePayoutNumber()
    const partner = partnerResult.rows[0]
    const payoutResult = await client.query(
      `INSERT INTO creator_payouts (
         partner_id,
         payout_number,
         currency,
         status,
         method,
         destination,
         content_fee_total,
         commission_total,
         total_amount,
         item_count,
         notes,
         created_by_email,
         created_at,
         updated_at
       ) VALUES (
         $1, $2, $3, 'pending', $4, $5, $6, $7, $8, $9, $10, $11, NOW(), NOW()
       )
       RETURNING id::text AS id, payout_number`,
      [
        input.partnerId,
        payoutNumber,
        payoutCurrency,
        input.method?.trim() || partner.payout_method || null,
        partner.payout_account || null,
        contentFeeTotal,
        commissionTotal,
        totalAmount,
        itemCount,
        input.notes?.trim() || null,
        input.adminEmail,
      ],
    )

    const payoutId = payoutResult.rows[0].id as string

    for (const row of feeResult.rows) {
      await client.query(
        `INSERT INTO creator_payout_items (
           payout_id,
           partner_id,
           item_type,
           source_id,
           source_label,
           amount,
           currency,
           created_at
         ) VALUES ($1, $2, 'content_fee', $3, $4, $5, $6, NOW())`,
        [
          payoutId,
          input.partnerId,
          row.id,
          row.title || 'Content fee',
          row.fee_amount,
          payoutCurrency,
        ],
      )
    }

    for (const row of commissionResult.rows) {
      await client.query(
        `INSERT INTO creator_payout_items (
           payout_id,
           partner_id,
           item_type,
           source_id,
           source_label,
           amount,
           currency,
           created_at
         ) VALUES ($1, $2, 'commission', $3, $4, $5, $6, NOW())`,
        [
          payoutId,
          input.partnerId,
          row.id,
          row.order_number || 'Commission',
          row.commission_amount,
          payoutCurrency,
        ],
      )
    }

    if (feeResult.rows.length > 0) {
      await client.query(
        `UPDATE creator_publications
         SET fee_status = 'locked', updated_at = NOW()
         WHERE id::text = ANY($1::text[])`,
        [feeResult.rows.map((row) => row.id as string)],
      )
    }

    if (commissionResult.rows.length > 0) {
      await client.query(
        `UPDATE creator_commissions
         SET status = 'locked', updated_at = NOW()
         WHERE id::text = ANY($1::text[])`,
        [commissionResult.rows.map((row) => row.id as string)],
      )
    }

    await client.query('COMMIT')

    return {
      id: payoutId,
      payoutNumber: payoutResult.rows[0].payout_number as string,
      totalAmount,
      currency: payoutCurrency,
    }
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
  }
}

export async function updatePartnerPayoutStatus(input: {
  payoutId: string
  status: 'paid' | 'cancelled'
  transactionRef?: string | null
  notes?: string | null
}) {
  await ensurePartnerProgramTables()

  const pool = getPool()
  const client = await pool.connect()

  try {
    await client.query('BEGIN')

    const payoutResult = await client.query(
      `SELECT
         id::text AS id,
         payout_number,
         status,
         transaction_ref,
         paid_at
       FROM creator_payouts
       WHERE id::text = $1
       LIMIT 1`,
      [input.payoutId],
    )

    if (payoutResult.rows.length === 0) {
      throw new Error('Payout batch not found')
    }

    const currentStatus = payoutResult.rows[0].status as string
    if (currentStatus === input.status) {
      await client.query('COMMIT')
      return payoutResult.rows[0] || null
    }

    if (currentStatus !== 'pending') {
      throw new Error(
        `Only pending payout batches can be updated (current status: ${currentStatus})`,
      )
    }

    const itemsResult = await client.query(
      `SELECT item_type, source_id
       FROM creator_payout_items
       WHERE payout_id::text = $1`,
      [input.payoutId],
    )

    const contentFeeIds = itemsResult.rows
      .filter((row) => row.item_type === 'content_fee')
      .map((row) => row.source_id as string)
    const commissionIds = itemsResult.rows
      .filter((row) => row.item_type === 'commission')
      .map((row) => row.source_id as string)

    if (input.status === 'paid') {
      if (contentFeeIds.length > 0) {
        await client.query(
          `UPDATE creator_publications
           SET fee_status = 'paid', updated_at = NOW()
           WHERE id::text = ANY($1::text[])`,
          [contentFeeIds],
        )
      }

      if (commissionIds.length > 0) {
        await client.query(
          `UPDATE creator_commissions
           SET status = 'paid', paid_at = NOW(), updated_at = NOW()
           WHERE id::text = ANY($1::text[])`,
          [commissionIds],
        )
      }
    } else if (input.status === 'cancelled') {
      if (contentFeeIds.length > 0) {
        await client.query(
          `UPDATE creator_publications
           SET fee_status = 'approved', updated_at = NOW()
           WHERE id::text = ANY($1::text[])
             AND fee_status = 'locked'`,
          [contentFeeIds],
        )
      }

      if (commissionIds.length > 0) {
        await client.query(
          `UPDATE creator_commissions
           SET status = 'approved', updated_at = NOW()
           WHERE id::text = ANY($1::text[])
             AND status = 'locked'`,
          [commissionIds],
        )
      }
    }

    const updatedPayout = await client.query(
      `UPDATE creator_payouts
       SET status = $2,
           transaction_ref = CASE
             WHEN $3::text IS NULL OR $3::text = '' THEN transaction_ref
             ELSE $3
           END,
           notes = CASE
             WHEN $4::text IS NULL OR $4::text = '' THEN notes
             ELSE $4
           END,
           paid_at = CASE
             WHEN $2 = 'paid' THEN COALESCE(paid_at, NOW())
             ELSE NULL
           END,
           updated_at = NOW()
       WHERE id::text = $1
       RETURNING id::text AS id, payout_number, status, transaction_ref, paid_at`,
      [
        input.payoutId,
        input.status,
        input.transactionRef?.trim() || null,
        input.notes?.trim() || null,
      ],
    )

    await client.query('COMMIT')
    return updatedPayout.rows[0] || null
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
  }
}

export async function getPartnerPayoutDetail(
  payoutId: string,
): Promise<PartnerPayoutDetail | null> {
  await ensurePartnerProgramTables()

  const pool = getPool()
  const payoutResult = await pool.query(
    `SELECT
       p.id::text AS id,
       p.partner_id::text AS partner_id,
       cp.full_name AS partner_name,
       cp.email AS partner_email,
       cp.partner_code,
       p.payout_number,
       p.currency,
       p.status,
       p.method,
       p.destination,
       p.content_fee_total,
       p.commission_total,
       p.total_amount,
       p.item_count,
       p.notes,
       p.created_by_email,
       p.transaction_ref,
       p.created_at,
       p.updated_at,
       p.paid_at
     FROM creator_payouts p
     JOIN creator_partners cp ON cp.id = p.partner_id
     WHERE p.id::text = $1
     LIMIT 1`,
    [payoutId],
  )

  if (payoutResult.rows.length === 0) {
    return null
  }

  const itemsResult = await pool.query(
    `SELECT
       i.id::text AS id,
       i.item_type,
       i.source_id,
       i.source_label,
       i.amount,
       i.currency,
       i.created_at,
       pub.published_url,
       pub.fee_status AS publication_fee_status,
       comm.order_id,
       comm.order_number,
       comm.status AS commission_status,
       comm.gross_amount,
       comm.net_amount,
       comm.commission_rate,
       comm.commission_amount
     FROM creator_payout_items i
     LEFT JOIN creator_publications pub
       ON i.item_type = 'content_fee'
      AND pub.id::text = i.source_id
     LEFT JOIN creator_commissions comm
       ON i.item_type = 'commission'
      AND comm.id::text = i.source_id
     WHERE i.payout_id::text = $1
     ORDER BY
       CASE WHEN i.item_type = 'content_fee' THEN 0 ELSE 1 END,
       i.created_at ASC,
       i.id ASC`,
    [payoutId],
  )

  const payout = payoutResult.rows[0]

  return {
    payout: {
      id: String(payout.id),
      partnerId: String(payout.partner_id),
      partnerName: String(payout.partner_name),
      partnerEmail: String(payout.partner_email),
      partnerCode: String(payout.partner_code),
      payoutNumber: String(payout.payout_number),
      currency: String(payout.currency || 'USD'),
      status: String(payout.status),
      method: payout.method ? String(payout.method) : null,
      destination: payout.destination ? String(payout.destination) : null,
      contentFeeTotal: toNullableNumber(payout.content_fee_total) || 0,
      commissionTotal: toNullableNumber(payout.commission_total) || 0,
      totalAmount: toNullableNumber(payout.total_amount) || 0,
      itemCount: Number(payout.item_count || 0),
      notes: payout.notes ? String(payout.notes) : null,
      createdByEmail: payout.created_by_email
        ? String(payout.created_by_email)
        : null,
      transactionRef: payout.transaction_ref ? String(payout.transaction_ref) : null,
      createdAt: payout.created_at ? String(payout.created_at) : null,
      updatedAt: payout.updated_at ? String(payout.updated_at) : null,
      paidAt: payout.paid_at ? String(payout.paid_at) : null,
    },
    items: itemsResult.rows.map((row) => ({
      id: String(row.id),
      itemType: String(row.item_type),
      sourceId: String(row.source_id),
      sourceLabel: row.source_label ? String(row.source_label) : null,
      amount: toNullableNumber(row.amount) || 0,
      currency: String(row.currency || payout.currency || 'USD'),
      createdAt: row.created_at ? String(row.created_at) : null,
      sourceStatus:
        row.item_type === 'content_fee'
          ? row.publication_fee_status
            ? String(row.publication_fee_status)
            : null
          : row.commission_status
            ? String(row.commission_status)
            : null,
      publicationUrl: row.published_url ? String(row.published_url) : null,
      orderId: row.order_id ? String(row.order_id) : null,
      orderNumber: row.order_number ? String(row.order_number) : null,
      grossAmount: toNullableNumber(row.gross_amount),
      netAmount: toNullableNumber(row.net_amount),
      commissionRate: toNullableNumber(row.commission_rate),
      commissionAmount: toNullableNumber(row.commission_amount),
    })),
  }
}

export function buildPartnerPayoutExportCsv(detail: PartnerPayoutDetail): {
  filename: string
  csv: string
} {
  const headers = [
    'payout_number',
    'payout_status',
    'batch_currency',
    'batch_created_at',
    'batch_paid_at',
    'partner_code',
    'partner_name',
    'partner_email',
    'payment_method',
    'payment_destination',
    'transaction_ref',
    'created_by_email',
    'content_fee_total',
    'commission_total',
    'batch_total',
    'batch_notes',
    'item_sequence',
    'item_type',
    'source_id',
    'source_label',
    'source_status',
    'publication_url',
    'order_id',
    'order_number',
    'gross_amount',
    'net_amount',
    'commission_rate',
    'commission_amount',
    'item_amount',
    'item_currency',
    'item_created_at',
  ]

  const rows = (detail.items.length > 0 ? detail.items : [null]).map((item, index) =>
    [
      detail.payout.payoutNumber,
      detail.payout.status,
      detail.payout.currency,
      formatTimestampForExport(detail.payout.createdAt),
      formatTimestampForExport(detail.payout.paidAt),
      detail.payout.partnerCode,
      detail.payout.partnerName,
      detail.payout.partnerEmail,
      detail.payout.method || '',
      detail.payout.destination || '',
      detail.payout.transactionRef || '',
      detail.payout.createdByEmail || '',
      detail.payout.contentFeeTotal.toFixed(2),
      detail.payout.commissionTotal.toFixed(2),
      detail.payout.totalAmount.toFixed(2),
      detail.payout.notes || '',
      item ? String(index + 1) : '',
      item?.itemType || '',
      item?.sourceId || '',
      item?.sourceLabel || '',
      item?.sourceStatus || '',
      item?.publicationUrl || '',
      item?.orderId || '',
      item?.orderNumber || '',
      item?.grossAmount != null ? item.grossAmount.toFixed(2) : '',
      item?.netAmount != null ? item.netAmount.toFixed(2) : '',
      item?.commissionRate != null ? item.commissionRate.toFixed(4) : '',
      item?.commissionAmount != null ? item.commissionAmount.toFixed(2) : '',
      item ? item.amount.toFixed(2) : '',
      item?.currency || detail.payout.currency,
      formatTimestampForExport(item?.createdAt),
    ].map(csvCell).join(','),
  )

  const exportDate = formatTimestampForExport(
    detail.payout.createdAt || new Date().toISOString(),
  ).slice(0, 10)
  const filename = `Machrio_Payout_${sanitizeFileToken(
    detail.payout.payoutNumber,
    'batch',
  )}_${exportDate.replace(/-/g, '')}.csv`

  return {
    filename,
    csv: `\uFEFF${headers.map(csvCell).join(',')}\n${rows.join('\n')}`,
  }
}
