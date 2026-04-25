import { NextRequest, NextResponse } from 'next/server'
import type { PoolClient } from 'pg'

import {
  buildConversationDisplayTitle,
  deriveConversationInsights,
  detectConversationType,
  normalizeConversationMessage,
  type ConversationMessage,
  type ConversationUserData,
} from '@/lib/ai-conversation-insights'
import { getPool } from '@/lib/db'

type ExistingConversationDoc = {
  id: number
  sessionId: string
  status?: string
  user?: ConversationUserData
  firstSourcePage?: string
  firstSourceUrl?: string
  latestSourcePage?: string
  latestSourceUrl?: string
  startedAt?: string
  lastMessageAt?: string
  notes?: string
  assignedTo?: number | null
  messages?: ConversationMessage[]
  userAgent?: string
  referrer?: string
}

const DEFAULT_EXTERNAL_CONVERSATION_SYNC_PATH = '/api/ai-conversations/ingest-snapshot'
const LEGACY_EXTERNAL_CONVERSATION_SYNC_PATH = '/api/ai-conversations'
const DEFAULT_PRODUCTION_ADMIN_API_BASE_URL = 'https://machrio-admin-production.up.railway.app'
const EXTERNAL_SYNC_TIMEOUT_MS = 3000
const AI_CONVERSATION_SCHEMA_READY_KEY = '__aiConversationSchemaReady'
const PRODUCTION_SITE_HOSTNAMES = new Set([
  'machrio.com',
  'www.machrio.com',
  'machrio-production.up.railway.app',
])

type SaveConversationResponse = {
  id: string
  sessionId: string
  status: string
  message?: string
}

type NormalizedConversationSnapshot = {
  sessionId: string
  messages: ConversationMessage[]
  user?: Partial<ConversationUserData>
  sourcePage?: string
  sourceUrl?: string
  conversationType: string
  metadata: Record<string, unknown>
}

type ConversationRow = {
  id: number
  status: string | null
  assigned_to_id: number | null
  notes: string | null
  first_source_page: string | null
  first_source_url: string | null
  latest_source_page: string | null
  latest_source_url: string | null
  started_at: Date | string | null
  user_user_id: string | null
  user_user_name: string | null
  user_user_email: string | null
  user_user_phone: string | null
  user_user_company: string | null
  user_agent: string | null
  referrer: string | null
}

type MessageRow = {
  id: string
  role: ConversationMessage['role'] | null
  content: string | null
  timestamp: Date | string | null
}

type MessageProductRow = {
  _parent_id: string
  product_id: string | null
  name: string | null
  sku: string | null
  price: string | null
}

function toIsoString(value: Date | string | null | undefined): string {
  if (!value) {
    return new Date().toISOString()
  }

  if (value instanceof Date) {
    return value.toISOString()
  }

  if (Number.isNaN(Date.parse(value))) {
    return new Date().toISOString()
  }

  return new Date(value).toISOString()
}

function messageFingerprint(message: ConversationMessage): string {
  return `${message.role}|${message.timestamp || ''}|${message.content}`
}

function mergeMessages(
  existingMessages: ConversationMessage[] = [],
  incomingMessages: ConversationMessage[] = [],
): ConversationMessage[] {
  const normalizedExisting = existingMessages
    .map((message) => normalizeConversationMessage(message))
    .filter((message): message is ConversationMessage => Boolean(message))

  const seen = new Set(normalizedExisting.map((message) => messageFingerprint(message)))
  const merged = [...normalizedExisting]

  for (const message of incomingMessages) {
    const fingerprint = messageFingerprint(message)
    if (seen.has(fingerprint)) continue
    seen.add(fingerprint)
    merged.push(message)
  }

  return merged.sort((left, right) => {
    const leftTime = left.timestamp ? Date.parse(left.timestamp) : 0
    const rightTime = right.timestamp ? Date.parse(right.timestamp) : 0
    return leftTime - rightTime
  })
}

function mergeUserData(
  existingUser: ConversationUserData | undefined,
  incomingUser: Partial<ConversationUserData> | undefined,
  derivedEmail?: string,
  derivedPhone?: string,
): ConversationUserData {
  return {
    userId: incomingUser?.userId || existingUser?.userId,
    userName: incomingUser?.userName || existingUser?.userName,
    userEmail: incomingUser?.userEmail || existingUser?.userEmail || derivedEmail,
    userPhone: incomingUser?.userPhone || existingUser?.userPhone || derivedPhone,
    userCompany: incomingUser?.userCompany || existingUser?.userCompany,
  }
}

function normalizeConversationType(value: unknown, fallbackMessages: ConversationMessage[]): string {
  const allowedTypes = new Set([
    'product_inquiry',
    'rfq_inquiry',
    'shipping_inquiry',
    'returns_support',
    'technical_support',
    'general',
  ])

  if (typeof value === 'string' && allowedTypes.has(value)) {
    return value
  }

  return detectConversationType(fallbackMessages)
}

function isAbsoluteUrl(value: string): boolean {
  return /^https?:\/\//i.test(value)
}

function normalizeSyncPath(path: string): string {
  if (isAbsoluteUrl(path)) {
    return path
  }

  return path.startsWith('/') ? path : `/${path}`
}

function buildAdminApiUrl(baseUrl: string, path: string): string {
  const normalizedBaseUrl = baseUrl.replace(/\/$/, '')
  const normalizedPath = normalizeSyncPath(path)

  if (isAbsoluteUrl(normalizedPath)) {
    return normalizedPath
  }

  if (normalizedBaseUrl.endsWith('/api') && normalizedPath.startsWith('/api/')) {
    return `${normalizedBaseUrl}${normalizedPath.slice(4)}`
  }

  return `${normalizedBaseUrl}${normalizedPath}`
}

function looksLikeConversationEndpoint(url: string): boolean {
  return /\/api\/ai-conversations(?:\/ingest-snapshot)?\/?$/i.test(url)
}

function getRequestHost(request: NextRequest): string {
  const forwardedHost = request.headers.get('x-forwarded-host')
  if (forwardedHost) {
    return forwardedHost.split(',')[0]?.trim() || request.nextUrl.hostname
  }

  return request.headers.get('host') || request.nextUrl.hostname
}

function getAdminApiBaseUrl(request: NextRequest): string | null {
  const configuredBaseUrl =
    process.env.ADMIN_API_URL?.trim() ||
    process.env.NEXT_PUBLIC_ADMIN_API_URL?.trim()

  if (configuredBaseUrl) {
    return configuredBaseUrl
  }

  const requestHost = getRequestHost(request).toLowerCase()
  if (PRODUCTION_SITE_HOSTNAMES.has(requestHost)) {
    return DEFAULT_PRODUCTION_ADMIN_API_BASE_URL
  }

  return null
}

function getAdminConversationTargets(request: NextRequest): string[] {
  const adminApiBaseUrl = getAdminApiBaseUrl(request)
  const customConversationPath =
    process.env.ADMIN_API_CONVERSATION_PATH?.trim() ||
    process.env.NEXT_PUBLIC_ADMIN_API_CONVERSATION_PATH?.trim()

  if (!adminApiBaseUrl) {
    return []
  }

  if (looksLikeConversationEndpoint(adminApiBaseUrl)) {
    return [adminApiBaseUrl.replace(/\/$/, '')]
  }

  const candidatePaths = customConversationPath
    ? [customConversationPath]
    : [DEFAULT_EXTERNAL_CONVERSATION_SYNC_PATH, LEGACY_EXTERNAL_CONVERSATION_SYNC_PATH]

  return Array.from(
    new Set(candidatePaths.map((path) => buildAdminApiUrl(adminApiBaseUrl, path))),
  )
}

function normalizeSnapshotBody(body: unknown): {
  snapshot: NormalizedConversationSnapshot | null
  error?: string
} {
  const rawBody = body && typeof body === 'object' ? (body as Record<string, unknown>) : {}
  const sessionId = typeof rawBody.sessionId === 'string' ? rawBody.sessionId.trim() : ''
  const normalizedMessages = Array.isArray(rawBody.messages)
    ? rawBody.messages
        .map((message) => normalizeConversationMessage(message as ConversationMessage))
        .filter((message): message is ConversationMessage => Boolean(message))
    : []

  if (!sessionId) {
    return { snapshot: null, error: 'sessionId is required' }
  }

  if (normalizedMessages.length === 0) {
    return { snapshot: null, error: 'messages are required' }
  }

  const rawUser =
    rawBody.user && typeof rawBody.user === 'object' && !Array.isArray(rawBody.user)
      ? (rawBody.user as Partial<ConversationUserData>)
      : undefined

  const rawMetadata =
    rawBody.metadata && typeof rawBody.metadata === 'object' && !Array.isArray(rawBody.metadata)
      ? (rawBody.metadata as Record<string, unknown>)
      : {}

  return {
    snapshot: {
      sessionId,
      messages: normalizedMessages,
      user: rawUser,
      sourcePage: typeof rawBody.sourcePage === 'string' ? rawBody.sourcePage : undefined,
      sourceUrl: typeof rawBody.sourceUrl === 'string' ? rawBody.sourceUrl : undefined,
      conversationType: normalizeConversationType(rawBody.conversationType, normalizedMessages),
      metadata: {
        ...rawMetadata,
        timestamp:
          typeof rawMetadata.timestamp === 'string' && !Number.isNaN(Date.parse(rawMetadata.timestamp))
            ? new Date(rawMetadata.timestamp).toISOString()
            : new Date().toISOString(),
      },
    },
  }
}

function isConversationSchemaReady(): boolean {
  return Boolean((globalThis as Record<string, unknown>)[AI_CONVERSATION_SCHEMA_READY_KEY])
}

function markConversationSchemaReady(): void {
  ;(globalThis as Record<string, unknown>)[AI_CONVERSATION_SCHEMA_READY_KEY] = true
}

async function ensureConversationSchema(client: PoolClient): Promise<void> {
  if (isConversationSchemaReady()) {
    return
  }

  await client.query(`
    DO $$ BEGIN
      CREATE TYPE "public"."enum_ai_conversations_messages_role" AS ENUM('user', 'assistant', 'system');
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;
    DO $$ BEGIN
      CREATE TYPE "public"."enum_ai_conversations_status" AS ENUM('new', 'reviewed', 'follow_up', 'resolved');
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;
    DO $$ BEGIN
      CREATE TYPE "public"."enum_ai_conversations_conversation_type" AS ENUM('product_inquiry', 'rfq_inquiry', 'shipping_inquiry', 'returns_support', 'technical_support', 'general');
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;
    DO $$ BEGIN
      CREATE TYPE "public"."enum_ai_conversations_purchase_mode" AS ENUM('unknown', 'buy-online', 'rfq', 'both');
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;

    CREATE TABLE IF NOT EXISTS "ai_conversations" (
      "id" serial PRIMARY KEY NOT NULL,
      "display_title" varchar,
      "session_id" varchar NOT NULL,
      "status" "enum_ai_conversations_status" DEFAULT 'new' NOT NULL,
      "conversation_type" "enum_ai_conversations_conversation_type",
      "assigned_to_id" integer,
      "started_at" timestamp(3) with time zone,
      "last_message_at" timestamp(3) with time zone,
      "message_count" numeric,
      "purchase_mode" "enum_ai_conversations_purchase_mode",
      "first_source_page" varchar,
      "first_source_url" varchar,
      "latest_source_page" varchar,
      "latest_source_url" varchar,
      "user_user_id" varchar,
      "user_user_name" varchar,
      "user_user_email" varchar,
      "user_user_phone" varchar,
      "user_user_company" varchar,
      "latest_user_need" varchar,
      "quantity_signal" varchar,
      "delivery_signal" varchar,
      "contact_email" varchar,
      "contact_phone" varchar,
      "sales_summary" varchar,
      "user_agent" varchar,
      "referrer" varchar,
      "last_captured_at" timestamp(3) with time zone,
      "notes" varchar,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    );

    CREATE TABLE IF NOT EXISTS "ai_conversations_mentioned_skus" (
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL,
      "id" varchar PRIMARY KEY NOT NULL,
      "value" varchar
    );

    CREATE TABLE IF NOT EXISTS "ai_conversations_recommended_products" (
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL,
      "id" varchar PRIMARY KEY NOT NULL,
      "product_id" varchar,
      "name" varchar,
      "sku" varchar,
      "price" varchar
    );

    CREATE TABLE IF NOT EXISTS "ai_conversations_messages" (
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL,
      "id" varchar PRIMARY KEY NOT NULL,
      "role" "enum_ai_conversations_messages_role",
      "timestamp" timestamp(3) with time zone,
      "content" varchar
    );

    CREATE TABLE IF NOT EXISTS "ai_conversations_messages_products" (
      "_order" integer NOT NULL,
      "_parent_id" varchar NOT NULL,
      "id" varchar PRIMARY KEY NOT NULL,
      "product_id" varchar,
      "name" varchar,
      "sku" varchar,
      "price" varchar
    );

    DO $$ BEGIN
      ALTER TABLE "ai_conversations_mentioned_skus"
      ADD CONSTRAINT "ai_conversations_mentioned_skus_parent_id_fk"
      FOREIGN KEY ("_parent_id") REFERENCES "public"."ai_conversations"("id") ON DELETE cascade ON UPDATE no action;
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;
    DO $$ BEGIN
      ALTER TABLE "ai_conversations_recommended_products"
      ADD CONSTRAINT "ai_conversations_recommended_products_parent_id_fk"
      FOREIGN KEY ("_parent_id") REFERENCES "public"."ai_conversations"("id") ON DELETE cascade ON UPDATE no action;
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;
    DO $$ BEGIN
      ALTER TABLE "ai_conversations_messages"
      ADD CONSTRAINT "ai_conversations_messages_parent_id_fk"
      FOREIGN KEY ("_parent_id") REFERENCES "public"."ai_conversations"("id") ON DELETE cascade ON UPDATE no action;
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;
    DO $$ BEGIN
      ALTER TABLE "ai_conversations_messages_products"
      ADD CONSTRAINT "ai_conversations_messages_products_parent_id_fk"
      FOREIGN KEY ("_parent_id") REFERENCES "public"."ai_conversations_messages"("id") ON DELETE cascade ON UPDATE no action;
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;
    DO $$ BEGIN
      ALTER TABLE "ai_conversations"
      ADD CONSTRAINT "ai_conversations_assigned_to_id_users_id_fk"
      FOREIGN KEY ("assigned_to_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;

    CREATE UNIQUE INDEX IF NOT EXISTS "ai_conversations_session_id_idx" ON "ai_conversations" USING btree ("session_id");
    CREATE INDEX IF NOT EXISTS "ai_conversations_assigned_to_idx" ON "ai_conversations" USING btree ("assigned_to_id");
    CREATE INDEX IF NOT EXISTS "ai_conversations_updated_at_idx" ON "ai_conversations" USING btree ("updated_at");
    CREATE INDEX IF NOT EXISTS "ai_conversations_created_at_idx" ON "ai_conversations" USING btree ("created_at");
    CREATE INDEX IF NOT EXISTS "ai_conversations_mentioned_skus_order_idx" ON "ai_conversations_mentioned_skus" USING btree ("_order");
    CREATE INDEX IF NOT EXISTS "ai_conversations_mentioned_skus_parent_id_idx" ON "ai_conversations_mentioned_skus" USING btree ("_parent_id");
    CREATE INDEX IF NOT EXISTS "ai_conversations_recommended_products_order_idx" ON "ai_conversations_recommended_products" USING btree ("_order");
    CREATE INDEX IF NOT EXISTS "ai_conversations_recommended_products_parent_id_idx" ON "ai_conversations_recommended_products" USING btree ("_parent_id");
    CREATE INDEX IF NOT EXISTS "ai_conversations_messages_order_idx" ON "ai_conversations_messages" USING btree ("_order");
    CREATE INDEX IF NOT EXISTS "ai_conversations_messages_parent_id_idx" ON "ai_conversations_messages" USING btree ("_parent_id");
    CREATE INDEX IF NOT EXISTS "ai_conversations_messages_products_order_idx" ON "ai_conversations_messages_products" USING btree ("_order");
    CREATE INDEX IF NOT EXISTS "ai_conversations_messages_products_parent_id_idx" ON "ai_conversations_messages_products" USING btree ("_parent_id");
  `)

  markConversationSchemaReady()
}

function buildChildRowId(sessionId: string, kind: string, index: number, childIndex?: number): string {
  const parts = [sessionId, kind, String(index)]
  if (typeof childIndex === 'number') {
    parts.push(String(childIndex))
  }

  return parts.join('_').slice(0, 120)
}

async function loadExistingConversation(
  client: PoolClient,
  sessionId: string,
): Promise<ExistingConversationDoc | null> {
  const conversationResult = await client.query<ConversationRow>(
    `
      SELECT
        id,
        status,
        assigned_to_id,
        notes,
        first_source_page,
        first_source_url,
        latest_source_page,
        latest_source_url,
        started_at,
        user_user_id,
        user_user_name,
        user_user_email,
        user_user_phone,
        user_user_company,
        user_agent,
        referrer
      FROM ai_conversations
      WHERE session_id = $1
      LIMIT 1
    `,
    [sessionId],
  )

  const row = conversationResult.rows[0]
  if (!row) {
    return null
  }

  const messageResult = await client.query<MessageRow>(
    `
      SELECT id, role, content, timestamp
      FROM ai_conversations_messages
      WHERE _parent_id = $1
      ORDER BY _order ASC
    `,
    [row.id],
  )

  const messageIds = messageResult.rows.map((message) => message.id)
  const messageProductRows =
    messageIds.length > 0
      ? (
          await client.query<MessageProductRow>(
            `
              SELECT _parent_id, product_id, name, sku, price
              FROM ai_conversations_messages_products
              WHERE _parent_id = ANY($1::varchar[])
              ORDER BY _parent_id ASC, _order ASC
            `,
            [messageIds],
          )
        ).rows
      : []

  const productsByMessageId = new Map<string, NonNullable<ConversationMessage['products']>>()

  for (const productRow of messageProductRows) {
    if (!productRow.product_id || !productRow.name || !productRow.sku) {
      continue
    }

    const products = productsByMessageId.get(productRow._parent_id) || []
    products.push({
      id: productRow.product_id,
      name: productRow.name,
      sku: productRow.sku,
      price: productRow.price || undefined,
    })
    productsByMessageId.set(productRow._parent_id, products)
  }

  return {
    id: row.id,
    sessionId,
    status: row.status || undefined,
    assignedTo: row.assigned_to_id,
    notes: row.notes || undefined,
    firstSourcePage: row.first_source_page || undefined,
    firstSourceUrl: row.first_source_url || undefined,
    latestSourcePage: row.latest_source_page || undefined,
    latestSourceUrl: row.latest_source_url || undefined,
    startedAt: row.started_at || undefined,
    userAgent: row.user_agent || undefined,
    referrer: row.referrer || undefined,
    user: {
      userId: row.user_user_id || undefined,
      userName: row.user_user_name || undefined,
      userEmail: row.user_user_email || undefined,
      userPhone: row.user_user_phone || undefined,
      userCompany: row.user_user_company || undefined,
    },
    messages: messageResult.rows.map((message) => ({
      role: message.role || 'user',
      content: message.content || '',
      timestamp: message.timestamp || undefined,
      products: productsByMessageId.get(message.id),
    })),
  }
}

async function parseSaveConversationResponse(
  response: Response,
  sessionId: string,
): Promise<SaveConversationResponse> {
  const contentType = response.headers.get('content-type') || ''

  if (contentType.includes('application/json')) {
    const json = (await response.json().catch(() => null)) as Partial<SaveConversationResponse> | null

    return {
      id: typeof json?.id === 'string' && json.id ? json.id : sessionId,
      sessionId: typeof json?.sessionId === 'string' && json.sessionId ? json.sessionId : sessionId,
      status: typeof json?.status === 'string' && json.status ? json.status : 'saved',
      message: typeof json?.message === 'string' ? json.message : undefined,
    }
  }

  const text = await response.text().catch(() => '')

  return {
    id: sessionId,
    sessionId,
    status: 'saved',
    message: text || undefined,
  }
}

async function readErrorResponse(response: Response): Promise<string> {
  return (await response.text().catch(() => '')) || response.statusText || 'Unknown error'
}

async function saveConversationLocally(
  snapshot: NormalizedConversationSnapshot,
): Promise<SaveConversationResponse> {
  const pool = getPool()
  const client = await pool.connect()

  try {
    await client.query('BEGIN')
    await ensureConversationSchema(client)

    const existingDoc = await loadExistingConversation(client, snapshot.sessionId)
    const mergedMessages = mergeMessages(existingDoc?.messages, snapshot.messages)
    const conversationType = normalizeConversationType(snapshot.conversationType, mergedMessages)
    const insights = deriveConversationInsights(mergedMessages, conversationType)
    const mergedUser = mergeUserData(existingDoc?.user, snapshot.user, insights.contactEmail, insights.contactPhone)
    const startedAt = existingDoc?.startedAt || mergedMessages[0]?.timestamp || new Date().toISOString()
    const lastMessageAt = mergedMessages[mergedMessages.length - 1]?.timestamp || new Date().toISOString()
    const latestSourcePage = snapshot.sourcePage || existingDoc?.latestSourcePage
    const latestSourceUrl = snapshot.sourceUrl || existingDoc?.latestSourceUrl
    const firstSourcePage = existingDoc?.firstSourcePage || latestSourcePage || 'unknown'
    const firstSourceUrl = existingDoc?.firstSourceUrl || latestSourceUrl || 'unknown'
    const userAgent =
      (typeof snapshot.metadata.userAgent === 'string' && snapshot.metadata.userAgent) || existingDoc?.userAgent
    const referrer =
      (typeof snapshot.metadata.referrer === 'string' && snapshot.metadata.referrer) || existingDoc?.referrer
    const displayTitle = buildConversationDisplayTitle({
      sessionId: snapshot.sessionId,
      user: mergedUser,
      latestUserNeed: insights.latestUserNeed,
      sourcePage: latestSourcePage || firstSourcePage,
    })

    const conversationResult = await client.query<{ id: number }>(
      `
        INSERT INTO ai_conversations (
          display_title,
          session_id,
          status,
          conversation_type,
          assigned_to_id,
          started_at,
          last_message_at,
          message_count,
          purchase_mode,
          first_source_page,
          first_source_url,
          latest_source_page,
          latest_source_url,
          user_user_id,
          user_user_name,
          user_user_email,
          user_user_phone,
          user_user_company,
          latest_user_need,
          quantity_signal,
          delivery_signal,
          contact_email,
          contact_phone,
          sales_summary,
          user_agent,
          referrer,
          last_captured_at,
          notes
        )
        VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9,
          $10, $11, $12, $13, $14, $15, $16, $17, $18,
          $19, $20, $21, $22, $23, $24, $25, $26, $27, $28
        )
        ON CONFLICT (session_id) DO UPDATE SET
          display_title = EXCLUDED.display_title,
          status = EXCLUDED.status,
          conversation_type = EXCLUDED.conversation_type,
          assigned_to_id = EXCLUDED.assigned_to_id,
          started_at = EXCLUDED.started_at,
          last_message_at = EXCLUDED.last_message_at,
          message_count = EXCLUDED.message_count,
          purchase_mode = EXCLUDED.purchase_mode,
          first_source_page = EXCLUDED.first_source_page,
          first_source_url = EXCLUDED.first_source_url,
          latest_source_page = EXCLUDED.latest_source_page,
          latest_source_url = EXCLUDED.latest_source_url,
          user_user_id = EXCLUDED.user_user_id,
          user_user_name = EXCLUDED.user_user_name,
          user_user_email = EXCLUDED.user_user_email,
          user_user_phone = EXCLUDED.user_user_phone,
          user_user_company = EXCLUDED.user_user_company,
          latest_user_need = EXCLUDED.latest_user_need,
          quantity_signal = EXCLUDED.quantity_signal,
          delivery_signal = EXCLUDED.delivery_signal,
          contact_email = EXCLUDED.contact_email,
          contact_phone = EXCLUDED.contact_phone,
          sales_summary = EXCLUDED.sales_summary,
          user_agent = EXCLUDED.user_agent,
          referrer = EXCLUDED.referrer,
          last_captured_at = EXCLUDED.last_captured_at,
          notes = EXCLUDED.notes,
          updated_at = now()
        RETURNING id
      `,
      [
        displayTitle,
        snapshot.sessionId,
        existingDoc?.status || 'new',
        conversationType,
        existingDoc?.assignedTo || null,
        toIsoString(startedAt),
        toIsoString(lastMessageAt),
        mergedMessages.length,
        insights.purchaseMode,
        firstSourcePage,
        firstSourceUrl,
        latestSourcePage || firstSourcePage,
        latestSourceUrl || firstSourceUrl,
        mergedUser.userId || null,
        mergedUser.userName || null,
        mergedUser.userEmail || null,
        mergedUser.userPhone || null,
        mergedUser.userCompany || null,
        insights.latestUserNeed || null,
        insights.quantitySignal || null,
        insights.deliverySignal || null,
        mergedUser.userEmail || insights.contactEmail || null,
        mergedUser.userPhone || insights.contactPhone || null,
        insights.salesSummary || null,
        userAgent || null,
        referrer || null,
        toIsoString(
          typeof snapshot.metadata.timestamp === 'string' ? snapshot.metadata.timestamp : new Date().toISOString(),
        ),
        existingDoc?.notes || null,
      ],
    )

    const conversationId = conversationResult.rows[0]?.id
    if (!conversationId) {
      throw new Error('Failed to persist AI conversation')
    }

    await client.query(
      'DELETE FROM ai_conversations_messages_products WHERE _parent_id IN (SELECT id FROM ai_conversations_messages WHERE _parent_id = $1)',
      [conversationId],
    )
    await client.query('DELETE FROM ai_conversations_messages WHERE _parent_id = $1', [conversationId])
    await client.query('DELETE FROM ai_conversations_recommended_products WHERE _parent_id = $1', [conversationId])
    await client.query('DELETE FROM ai_conversations_mentioned_skus WHERE _parent_id = $1', [conversationId])

    for (const [index, sku] of insights.mentionedSkus.entries()) {
      await client.query(
        `
          INSERT INTO ai_conversations_mentioned_skus (_order, _parent_id, id, value)
          VALUES ($1, $2, $3, $4)
        `,
        [index + 1, conversationId, buildChildRowId(snapshot.sessionId, 'sku', index), sku],
      )
    }

    for (const [index, product] of insights.recommendedProducts.entries()) {
      await client.query(
        `
          INSERT INTO ai_conversations_recommended_products (_order, _parent_id, id, product_id, name, sku, price)
          VALUES ($1, $2, $3, $4, $5, $6, $7)
        `,
        [
          index + 1,
          conversationId,
          buildChildRowId(snapshot.sessionId, 'recommended', index),
          product.id,
          product.name,
          product.sku,
          product.price || null,
        ],
      )
    }

    for (const [messageIndex, message] of mergedMessages.entries()) {
      const messageRowId = buildChildRowId(snapshot.sessionId, 'message', messageIndex)

      await client.query(
        `
          INSERT INTO ai_conversations_messages (_order, _parent_id, id, role, timestamp, content)
          VALUES ($1, $2, $3, $4, $5, $6)
        `,
        [
          messageIndex + 1,
          conversationId,
          messageRowId,
          message.role,
          message.timestamp ? toIsoString(message.timestamp) : new Date().toISOString(),
          message.content,
        ],
      )

      for (const [productIndex, product] of (message.products || []).entries()) {
        await client.query(
          `
            INSERT INTO ai_conversations_messages_products (_order, _parent_id, id, product_id, name, sku, price)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
          `,
          [
            productIndex + 1,
            messageRowId,
            buildChildRowId(snapshot.sessionId, 'message_product', messageIndex, productIndex),
            product.id,
            product.name,
            product.sku,
            product.price || null,
          ],
        )
      }
    }

    await client.query('COMMIT')

    return {
      id: String(conversationId),
      sessionId: snapshot.sessionId,
      status: existingDoc ? 'updated' : 'created',
    }
  } catch (error) {
    await client.query('ROLLBACK').catch(() => null)
    throw error
  } finally {
    client.release()
  }
}

async function saveConversationExternally(
  snapshot: NormalizedConversationSnapshot,
  request: NextRequest,
): Promise<SaveConversationResponse | null> {
  const targets = getAdminConversationTargets(request)
  if (targets.length === 0) {
    return null
  }

  const authorizationToken =
    process.env.ADMIN_API_KEY?.trim() ||
    process.env.NEXT_PUBLIC_ADMIN_API_KEY?.trim()

  let lastError: { status?: number; text: string; url: string } | null = null

  for (const target of targets) {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), EXTERNAL_SYNC_TIMEOUT_MS)

    try {
      const response = await fetch(target, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(authorizationToken && {
            Authorization: `Bearer ${authorizationToken}`,
          }),
        },
        body: JSON.stringify(snapshot),
        cache: 'no-store',
        signal: controller.signal,
      })

      if (response.ok) {
        const result = await parseSaveConversationResponse(response, snapshot.sessionId)
        console.log('[ai-conversation-sync] mirrored conversation to admin backend:', {
          sessionId: snapshot.sessionId,
          target,
          status: result.status,
        })
        return result
      }

      const errorText = await readErrorResponse(response)
      lastError = {
        status: response.status,
        text: errorText,
        url: target,
      }

      console.error('[ai-conversation-sync] failed to mirror conversation to admin backend:', {
        sessionId: snapshot.sessionId,
        target,
        status: response.status,
        errorText,
      })
    } catch (error) {
      const errorText =
        error instanceof Error && error.name === 'AbortError'
          ? `Request timed out after ${EXTERNAL_SYNC_TIMEOUT_MS}ms`
          : error instanceof Error
            ? error.message
            : 'Unknown admin mirror error'

      lastError = {
        text: errorText,
        url: target,
      }

      console.error('[ai-conversation-sync] failed to mirror conversation to admin backend:', {
        sessionId: snapshot.sessionId,
        target,
        errorText,
      })
    } finally {
      clearTimeout(timeoutId)
    }
  }

  console.error('[ai-conversation-sync] exhausted admin sync targets without success:', {
    sessionId: snapshot.sessionId,
    targets,
    lastError,
  })

  return null
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { snapshot, error } = normalizeSnapshotBody(body)

    if (!snapshot) {
      return NextResponse.json({ error: error || 'Invalid conversation payload' }, { status: 400 })
    }

    const [localResult, externalResult] = await Promise.allSettled([
      saveConversationLocally(snapshot),
      saveConversationExternally(snapshot, request),
    ])

    if (localResult.status === 'rejected') {
      console.error('[ai-conversation-sync] local sync failed:', localResult.reason)
    }

    if (externalResult.status === 'rejected') {
      console.error('[ai-conversation-sync] admin mirror failed:', externalResult.reason)
    }

    const resolvedLocalResult = localResult.status === 'fulfilled' ? localResult.value : null
    const resolvedExternalResult =
      externalResult.status === 'fulfilled' ? externalResult.value : null

    if (!resolvedLocalResult && !resolvedExternalResult) {
      throw new Error('Failed to store conversation locally and failed to mirror it to admin backend')
    }

    const responsePayload = resolvedExternalResult || resolvedLocalResult

    return NextResponse.json({
      id: responsePayload?.id || snapshot.sessionId,
      sessionId: snapshot.sessionId,
      status: responsePayload?.status || 'saved',
      localStatus: resolvedLocalResult?.status || null,
      mirroredToAdmin: Boolean(resolvedExternalResult),
      externalStatus: resolvedExternalResult?.status || null,
    })
  } catch (error) {
    console.error('[ai-conversation-sync] failed:', error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to sync AI conversation',
      },
      { status: 500 },
    )
  }
}
