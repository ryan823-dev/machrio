export type ConversationRole = 'user' | 'assistant' | 'system'

export interface TrackedProduct {
  id: string
  name: string
  sku: string
  price?: string
}

export interface ConversationMessage {
  role: ConversationRole
  content: string
  products?: TrackedProduct[]
  timestamp?: string
}

export interface ConversationUserData {
  userId?: string
  userName?: string
  userEmail?: string
  userPhone?: string
  userCompany?: string
}

export interface ConversationInsights {
  latestUserNeed: string
  purchaseMode: 'unknown' | 'buy-online' | 'rfq' | 'both'
  quantitySignal?: string
  deliverySignal?: string
  contactEmail?: string
  contactPhone?: string
  mentionedSkus: string[]
  recommendedProducts: TrackedProduct[]
  salesSummary: string
}

const CONVERSATION_TYPE_KEYWORDS = {
  product_inquiry: ['product', 'item', 'buy', 'price', 'cost', 'quote', '产品', '采购', '买', '价格', '型号'],
  rfq_inquiry: ['bulk', 'rfq', 'wholesale', 'large quantity', 'b2b', '询价', '报价', '批量', '大货', '采购单'],
  shipping_inquiry: ['shipping', 'delivery', 'track', 'lead time', '发货', '交期', '运费', '物流'],
  returns_support: ['return', 'refund', 'exchange', '退货', '退款', '换货'],
  technical_support: ['how to', 'help', 'issue', 'problem', 'spec', 'compatible', '怎么', '帮助', '问题', '规格', '兼容'],
} as const

const QUANTITY_PATTERNS = [
  /\b(?:qty|quantity|order|need|need about|need around)\s*[:=]?\s*(\d[\d,.\s]*(?:pcs?|pieces?|units?|boxes?|cartons?|packs?|rolls?|pairs?|sets?|cases?|kg|g|lb|lbs|pallets?))/i,
  /\b(\d[\d,.\s]*(?:pcs?|pieces?|units?|boxes?|cartons?|packs?|rolls?|pairs?|sets?|cases?|kg|g|lb|lbs|pallets?))\b/i,
  /(\d[\d,.\s]*(?:个|件|箱|包|卷|套|双|公斤|千克|吨))/,
]

const DELIVERY_PATTERNS = [
  /\b(?:delivery|deliver|ship|shipping|lead time|arrival|arrive|need by|by)\b[^.!?\n]{0,80}/i,
  /(?:交期|发货|送达|到货|急需|本周|下周|月底|几天内)[^。！？\n]{0,80}/,
]

const SKU_PATTERN = /\b[A-Z0-9-]{4,}\b/g
const EMAIL_PATTERN = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i
const PHONE_PATTERN =
  /(?:(?:\+?\d{1,3}[\s-]?)?(?:\(?\d{2,4}\)?[\s-]?)?\d{3,4}[\s-]?\d{4,})(?:\s*(?:ext|x)\s*\d+)?/i

function clamp(value: string, maxLength: number): string {
  if (value.length <= maxLength) return value
  return `${value.slice(0, maxLength - 1)}…`
}

function uniqueStrings(values: Array<string | undefined | null>): string[] {
  return [...new Set(values.map((value) => (value || '').trim()).filter(Boolean))]
}

function normalizeProduct(product: Partial<TrackedProduct> | null | undefined): TrackedProduct | null {
  if (!product?.id || !product?.name || !product?.sku) return null

  return {
    id: String(product.id),
    name: clamp(String(product.name).trim(), 200),
    sku: clamp(String(product.sku).trim(), 80),
    price: product.price ? clamp(String(product.price).trim(), 80) : undefined,
  }
}

export function normalizeConversationMessage(
  message: Partial<ConversationMessage> | null | undefined,
): ConversationMessage | null {
  if (!message || typeof message.content !== 'string') return null

  const content = clamp(message.content.trim(), 5000)
  if (!content) return null

  const role: ConversationRole =
    message.role === 'assistant' || message.role === 'system' ? message.role : 'user'

  const normalizedProducts = Array.isArray(message.products)
    ? message.products.map((product) => normalizeProduct(product)).filter((product): product is TrackedProduct => Boolean(product))
    : undefined

  return {
    role,
    content,
    products: normalizedProducts?.length ? normalizedProducts : undefined,
    timestamp: message.timestamp && !Number.isNaN(Date.parse(message.timestamp))
      ? new Date(message.timestamp).toISOString()
      : new Date().toISOString(),
  }
}

export function detectConversationType(messages: ConversationMessage[]): string {
  const userText = messages
    .filter((message) => message.role === 'user')
    .map((message) => message.content.toLowerCase())
    .join(' ')

  if (!userText) return 'general'

  for (const [type, keywords] of Object.entries(CONVERSATION_TYPE_KEYWORDS)) {
    if (keywords.some((keyword) => userText.includes(keyword))) {
      return type
    }
  }

  return 'general'
}

function extractLatestUserNeed(messages: ConversationMessage[]): string {
  const lastUserMessage = [...messages].reverse().find((message) => message.role === 'user')
  return lastUserMessage ? clamp(lastUserMessage.content, 280) : ''
}

function extractPurchaseMode(messages: ConversationMessage[]): ConversationInsights['purchaseMode'] {
  const allText = messages.map((message) => message.content.toLowerCase()).join(' ')
  const mentionsRFQ =
    /(rfq|quote|wholesale|bulk|询价|报价|批量|大货)/i.test(allText)
  const mentionsBuyOnline =
    /(buy online|add to cart|checkout|purchase now|下单|加入购物车|立即购买)/i.test(allText)

  if (mentionsRFQ && mentionsBuyOnline) return 'both'
  if (mentionsRFQ) return 'rfq'
  if (mentionsBuyOnline) return 'buy-online'
  return 'unknown'
}

function extractSignal(messages: ConversationMessage[], patterns: RegExp[]): string | undefined {
  const userMessages = [...messages].reverse().filter((message) => message.role === 'user')

  for (const message of userMessages) {
    for (const pattern of patterns) {
      const match = message.content.match(pattern)
      if (match) {
        return clamp(match[0].trim(), 120)
      }
    }
  }

  return undefined
}

function extractEmail(messages: ConversationMessage[]): string | undefined {
  const text = messages.map((message) => message.content).join('\n')
  const match = text.match(EMAIL_PATTERN)
  return match ? match[0].toLowerCase() : undefined
}

function extractPhone(messages: ConversationMessage[]): string | undefined {
  const text = messages.map((message) => message.content).join('\n')
  const matches = text.match(new RegExp(PHONE_PATTERN.source, 'gi')) || []
  const candidate = matches.find((value) => value.replace(/\D/g, '').length >= 7)
  return candidate ? clamp(candidate.trim(), 40) : undefined
}

function extractMentionedSkus(messages: ConversationMessage[]): string[] {
  const text = messages.map((message) => message.content).join('\n').toUpperCase()
  return uniqueStrings(
    Array.from(text.matchAll(SKU_PATTERN))
      .map((match) => match[0])
      .filter((token) => /[A-Z]/.test(token) && /\d/.test(token)),
  ).slice(0, 12)
}

function extractRecommendedProducts(messages: ConversationMessage[]): TrackedProduct[] {
  const products = messages
    .filter((message) => message.role === 'assistant')
    .flatMap((message) => message.products || [])

  const seen = new Set<string>()
  const result: TrackedProduct[] = []

  for (const product of products) {
    const key = `${product.id}:${product.sku}`
    if (seen.has(key)) continue
    seen.add(key)
    result.push(product)
  }

  return result.slice(0, 12)
}

export function buildSalesSummary(
  conversationType: string,
  insights: Omit<ConversationInsights, 'salesSummary'>,
): string {
  const parts = [
    `类型: ${conversationType}`,
    insights.latestUserNeed ? `需求: ${insights.latestUserNeed}` : '',
    insights.quantitySignal ? `数量信号: ${insights.quantitySignal}` : '',
    insights.deliverySignal ? `交付信号: ${insights.deliverySignal}` : '',
    insights.purchaseMode !== 'unknown' ? `采购方式: ${insights.purchaseMode}` : '',
    insights.contactEmail ? `邮箱: ${insights.contactEmail}` : '',
    insights.contactPhone ? `电话: ${insights.contactPhone}` : '',
    insights.recommendedProducts.length > 0 ? `推荐商品数: ${insights.recommendedProducts.length}` : '',
  ].filter(Boolean)

  return clamp(parts.join(' | '), 600)
}

export function deriveConversationInsights(
  messages: ConversationMessage[],
  conversationType: string,
): ConversationInsights {
  const baseInsights = {
    latestUserNeed: extractLatestUserNeed(messages),
    purchaseMode: extractPurchaseMode(messages),
    quantitySignal: extractSignal(messages, QUANTITY_PATTERNS),
    deliverySignal: extractSignal(messages, DELIVERY_PATTERNS),
    contactEmail: extractEmail(messages),
    contactPhone: extractPhone(messages),
    mentionedSkus: extractMentionedSkus(messages),
    recommendedProducts: extractRecommendedProducts(messages),
  }

  return {
    ...baseInsights,
    salesSummary: buildSalesSummary(conversationType, baseInsights),
  }
}

export function buildConversationDisplayTitle(input: {
  sessionId: string
  user?: Partial<ConversationUserData> | null
  latestUserNeed?: string
  sourcePage?: string
}): string {
  const owner =
    input.user?.userCompany ||
    input.user?.userEmail ||
    input.user?.userName

  if (owner && input.latestUserNeed) {
    return clamp(`${owner} - ${input.latestUserNeed}`, 120)
  }

  if (owner) {
    return clamp(`${owner} - ${input.sourcePage || 'AI conversation'}`, 120)
  }

  if (input.latestUserNeed) {
    return clamp(input.latestUserNeed, 120)
  }

  if (input.sourcePage) {
    return clamp(input.sourcePage, 120)
  }

  return `Session ${input.sessionId.slice(-8)}`
}
