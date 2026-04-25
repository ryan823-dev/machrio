export interface RfqDraftProduct {
  id?: string
  name: string
  sku?: string
  price?: string
}

export interface RfqDraftMessage {
  role: 'user' | 'assistant'
  content: string
  products?: RfqDraftProduct[]
}

export interface RfqDraftRequirementSheet {
  category?: string
  useCase?: string
  keySpecs?: string[]
  qty?: string
  delivery?: string
  purchaseMode?: 'buy-online' | 'rfq' | 'both'
  shortlist: RfqDraftProduct[]
}

export interface RfqDraft {
  source: 'ai-assistant' | 'hero-ai' | 'empty-category'
  sessionId?: string
  sourcePage?: string
  sourceUrl?: string
  products: string
  quantity: string
  timeline: string
  message: string
  createdAt: string
  updatedAt: string
}

const RFQ_DRAFT_STORAGE_KEY = 'machrio_rfq_draft'

function dedupeProducts(products: RfqDraftProduct[]): RfqDraftProduct[] {
  const seen = new Set<string>()

  return products.filter((product) => {
    const key = `${product.sku || ''}::${product.name}`.toLowerCase()
    if (seen.has(key)) {
      return false
    }

    seen.add(key)
    return true
  })
}

function formatCategorySlug(value: string): string {
  return value
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase())
}

function buildProductLabel(product: RfqDraftProduct): string {
  const skuPart = product.sku ? ` (${product.sku})` : ''
  const pricePart = product.price ? ` - ${product.price}` : ''
  return `${product.name}${skuPart}${pricePart}`
}

export function buildRfqDraftFromConversation(input: {
  source: RfqDraft['source']
  sessionId?: string
  sourcePage?: string
  sourceUrl?: string
  messages: RfqDraftMessage[]
  requirementSheet?: RfqDraftRequirementSheet
}): RfqDraft | null {
  const userMessages = input.messages
    .filter((message) => message.role === 'user')
    .map((message) => message.content.trim())
    .filter(Boolean)

  const suggestedProducts = dedupeProducts([
    ...(input.requirementSheet?.shortlist || []),
    ...input.messages.flatMap((message) => message.products || []),
  ])

  if (userMessages.length === 0 && suggestedProducts.length === 0) {
    return null
  }

  const now = new Date().toISOString()
  const productLabels = suggestedProducts.map(buildProductLabel)
  const lines: string[] = []

  lines.push('AI conversation context:')

  if (input.sourcePage) {
    lines.push(`- Source page: ${input.sourcePage}`)
  }

  if (input.requirementSheet?.category) {
    lines.push(`- Category: ${formatCategorySlug(input.requirementSheet.category)}`)
  }

  if (input.requirementSheet?.useCase) {
    lines.push(`- Use case: ${input.requirementSheet.useCase}`)
  }

  if (input.requirementSheet?.keySpecs?.length) {
    lines.push(`- Key specs: ${input.requirementSheet.keySpecs.join(', ')}`)
  }

  if (input.requirementSheet?.purchaseMode) {
    lines.push(`- Purchase mode: ${input.requirementSheet.purchaseMode}`)
  }

  if (userMessages.length > 0) {
    lines.push('', 'User requirements from AI conversation:')
    userMessages.slice(-5).forEach((message, index) => {
      lines.push(`${index + 1}. ${message}`)
    })
  }

  if (productLabels.length > 0) {
    lines.push('', 'AI-suggested products or shortlist:')
    productLabels.slice(0, 10).forEach((label) => {
      lines.push(`- ${label}`)
    })
  }

  return {
    source: input.source,
    sessionId: input.sessionId,
    sourcePage: input.sourcePage,
    sourceUrl: input.sourceUrl,
    products: productLabels
      .slice(0, 8)
      .map((label) => label.replace(/\s+-\s+\$.*$/, ''))
      .join(', '),
    quantity: input.requirementSheet?.qty || '',
    timeline: input.requirementSheet?.delivery || '',
    message: lines.join('\n').trim(),
    createdAt: now,
    updatedAt: now,
  }
}

export function saveRfqDraft(draft: RfqDraft): void {
  if (typeof window === 'undefined') return

  window.localStorage.setItem(RFQ_DRAFT_STORAGE_KEY, JSON.stringify(draft))
}

export function getRfqDraft(): RfqDraft | null {
  if (typeof window === 'undefined') return null

  const stored = window.localStorage.getItem(RFQ_DRAFT_STORAGE_KEY)
  if (!stored) return null

  try {
    return JSON.parse(stored) as RfqDraft
  } catch {
    return null
  }
}

export function clearRfqDraft(): void {
  if (typeof window === 'undefined') return

  window.localStorage.removeItem(RFQ_DRAFT_STORAGE_KEY)
}
