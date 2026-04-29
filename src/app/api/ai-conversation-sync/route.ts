import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'

import {
  buildConversationDisplayTitle,
  deriveConversationInsights,
  detectConversationType,
  normalizeConversationMessage,
  type ConversationMessage,
  type ConversationUserData,
} from '@/lib/ai-conversation-insights'

type ExistingConversationDoc = {
  id: string
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
  assignedTo?: string
  messages?: ConversationMessage[]
  userAgent?: string
  referrer?: string
}

const AI_CONVERSATIONS_COLLECTION = 'ai-conversations'
const DEFAULT_EXTERNAL_CONVERSATION_SYNC_PATH = '/api/ai-conversations/ingest-snapshot'
const LEGACY_EXTERNAL_CONVERSATION_SYNC_PATH = '/api/ai-conversations'
const DEFAULT_PRODUCTION_ADMIN_API_BASE_URL = 'https://machrio-admin-production.up.railway.app'
const PRODUCTION_SITE_HOSTNAMES = new Set([
  'machrio.com',
  'www.machrio.com',
  'machrio-production.up.railway.app',
])

type PayloadConversationStore = {
  find(args: {
    collection: string
    where: Record<string, unknown>
    limit: number
    depth: number
    overrideAccess: boolean
  }): Promise<{ docs?: unknown[] }>
  update(args: {
    collection: string
    id: string
    data: Record<string, unknown>
    overrideAccess: boolean
  }): Promise<{ id: string }>
  create(args: {
    collection: string
    data: Record<string, unknown>
    overrideAccess: boolean
  }): Promise<{ id: string }>
}

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

function toIsoString(value: string | undefined): string {
  if (!value || Number.isNaN(Date.parse(value))) {
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
  const payload = await getPayload({ config })
  const conversationStore = payload as unknown as PayloadConversationStore
  const existingResult = await conversationStore.find({
    collection: AI_CONVERSATIONS_COLLECTION,
    where: {
      sessionId: {
        equals: snapshot.sessionId,
      },
    },
    limit: 1,
    depth: 0,
    overrideAccess: true,
  })

  const existingDoc = (existingResult.docs?.[0] || null) as ExistingConversationDoc | null
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

  const data = {
    displayTitle,
    sessionId: snapshot.sessionId,
    status: existingDoc?.status || 'new',
    assignedTo: existingDoc?.assignedTo,
    notes: existingDoc?.notes,
    conversationType,
    startedAt: toIsoString(startedAt),
    lastMessageAt: toIsoString(lastMessageAt),
    messageCount: mergedMessages.length,
    purchaseMode: insights.purchaseMode,
    firstSourcePage,
    firstSourceUrl,
    latestSourcePage: latestSourcePage || firstSourcePage,
    latestSourceUrl: latestSourceUrl || firstSourceUrl,
    user: mergedUser,
    latestUserNeed: insights.latestUserNeed,
    quantitySignal: insights.quantitySignal,
    deliverySignal: insights.deliverySignal,
    contactEmail: mergedUser.userEmail || insights.contactEmail,
    contactPhone: mergedUser.userPhone || insights.contactPhone,
    salesSummary: insights.salesSummary,
    mentionedSkus: insights.mentionedSkus.map((value) => ({ value })),
    recommendedProducts: insights.recommendedProducts.map((product) => ({
      productId: product.id,
      name: product.name,
      sku: product.sku,
      price: product.price,
    })),
    messages: mergedMessages.map((message) => ({
      role: message.role,
      content: message.content,
      timestamp: message.timestamp ? toIsoString(message.timestamp) : new Date().toISOString(),
      products: (message.products || []).map((product) => ({
        id: product.id,
        name: product.name,
        sku: product.sku,
        price: product.price,
      })),
    })),
    userAgent,
    referrer,
    lastCapturedAt: toIsoString(
      typeof snapshot.metadata.timestamp === 'string' ? snapshot.metadata.timestamp : new Date().toISOString(),
    ),
  }

  const doc = existingDoc
    ? await conversationStore.update({
        collection: AI_CONVERSATIONS_COLLECTION,
        id: existingDoc.id,
        data,
        overrideAccess: true,
      })
    : await conversationStore.create({
        collection: AI_CONVERSATIONS_COLLECTION,
        data,
        overrideAccess: true,
      })

  return {
    id: doc.id,
    sessionId: snapshot.sessionId,
    status: existingDoc ? 'updated' : 'created',
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
