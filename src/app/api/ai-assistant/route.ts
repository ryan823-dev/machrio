import { NextResponse } from 'next/server'
import { processConversation, ChatMessage } from '@/lib/ai/chat'
import { getConfiguredProviderConfigs } from '@/lib/ai/config'

const AI_PROXY_HEADER = 'x-machrio-ai-proxy'
const DEFAULT_AI_ASSISTANT_PROXY_URL = 'https://machrio.vercel.app/api/ai-assistant'

interface AIAssistantRequestPayload {
  messages?: ChatMessage[]
  message?: string
  conversationHistory?: ChatMessage[]
  source?: string
  categoryName?: string
  categoryPath?: string
}

export async function POST(request: Request) {
  try {
    const payload = await request.json() as AIAssistantRequestPayload
    const { messages, message, conversationHistory, source, categoryName, categoryPath } = payload

    // Support both formats: { messages: [...] } or { message: "string" } or { message, conversationHistory }
    let history: ChatMessage[] = []
    let userMessage: string

    if (message && typeof message === 'string') {
      // Simple format or EmptyStateAIDialog format
      userMessage = message
      if (Array.isArray(conversationHistory)) {
        history = conversationHistory as ChatMessage[]
      }
    } else if (messages && Array.isArray(messages)) {
      // Full format: conversation history
      const lastMsg = messages[messages.length - 1]
      userMessage = lastMsg?.content || ''
      history = messages.slice(0, -1) as ChatMessage[]
    } else {
      return NextResponse.json(
        { error: 'Invalid request format. Provide either "message" or "messages" array.' },
        { status: 400 },
      )
    }

    if (!userMessage.trim()) {
      return NextResponse.json(
        { error: 'Message cannot be empty' },
        { status: 400 },
      )
    }

    // Inject system context for empty category pages
    if (source === 'empty-category' && categoryName) {
      const path = categoryPath ? ` (${categoryPath} > ${categoryName})` : ` (${categoryName})`
      const categoryContext: ChatMessage = {
        role: 'system',
        content: `[CONTEXT: User is on an empty category page for "${categoryName}"${path}. This category doesn't have products listed yet, but Machrio can absolutely source them through our supplier network. Your goal: understand what they need (specs, quantities, brands, certifications, timeline), then guide them to submit an RFQ. NEVER say "we don't have" or "not available" — say "we can source this for you." Be a confident sourcing expert. After 2-3 exchanges, suggest submitting a quote request.]`,
      }
      history = [categoryContext, ...history]
    }

    // If any provider is configured, we will try them in order in the chat layer.
    const configuredProviders = getConfiguredProviderConfigs()
    
    if (configuredProviders.length === 0) {
      const proxiedResponse = await proxyAIRequest(payload, request)
      if (proxiedResponse) {
        return NextResponse.json(proxiedResponse)
      }

      // Fall back to mock response if no API key
      return NextResponse.json({
        reply: generateFallbackResponse(userMessage, source, history),
        mode: 'fallback',
      })
    }

    try {
      // Process with real AI
      const result = await processConversation(userMessage, history)

      return NextResponse.json({
        reply: result.response,
        response: result.response,
        toolResults: result.toolResults,
        mode: 'ai',
      })
    } catch (error) {
      console.error('AI assistant provider error:', error)

      const proxiedResponse = await proxyAIRequest(payload, request)
      if (proxiedResponse) {
        return NextResponse.json(proxiedResponse)
      }

      return NextResponse.json({
        reply: generateFallbackResponse(userMessage, source, history),
        mode: 'fallback',
        warning: error instanceof Error ? error.message : 'Unknown AI provider error',
      })
    }
  } catch (error) {
    console.error('AI assistant error:', error)
    
    // Return a helpful error message
    return NextResponse.json({
      reply: "I'm having trouble connecting right now. Please try again in a moment, or email our team at sales@machrio.com.",
      error: error instanceof Error ? error.message : 'Unknown error',
      mode: 'error',
    })
  }
}

function getAIProxyUrl(): string | null {
  const configuredUrl = process.env.AI_ASSISTANT_PROXY_URL?.trim()
  if (configuredUrl) {
    return configuredUrl
  }

  return process.env.NODE_ENV === 'production'
    ? DEFAULT_AI_ASSISTANT_PROXY_URL
    : null
}

// When the current host cannot reach a working provider, forward the request to
// the Vercel production API that already has the AI credentials configured.
async function proxyAIRequest(
  payload: AIAssistantRequestPayload,
  request: Request,
): Promise<Record<string, unknown> | null> {
  if (request.headers.get(AI_PROXY_HEADER) === '1') {
    return null
  }

  const proxyUrl = getAIProxyUrl()
  if (!proxyUrl) {
    return null
  }

  try {
    const currentHost = new URL(request.url).host
    const proxyHost = new URL(proxyUrl).host

    if (currentHost === proxyHost) {
      return null
    }

    const response = await fetch(proxyUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        [AI_PROXY_HEADER]: '1',
      },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      console.error('AI assistant proxy failed with status:', response.status)
      return null
    }

    const data = await response.json() as Record<string, unknown>
    const reply = typeof data.reply === 'string'
      ? data.reply
      : typeof data.response === 'string'
        ? data.response
        : ''

    if (!reply.trim()) {
      return null
    }

    return {
      ...data,
      reply,
      response: typeof data.response === 'string' ? data.response : reply,
      mode: 'ai',
      proxied: true,
    }
  } catch (error) {
    console.error('AI assistant proxy error:', error)
    return null
  }
}

function getLastAssistantMessage(history: ChatMessage[]): string {
  for (let index = history.length - 1; index >= 0; index -= 1) {
    if (history[index]?.role === 'assistant') {
      return history[index]?.content || ''
    }
  }

  return ''
}

function isAffirmativeReply(input: string): boolean {
  const normalized = input.trim().toLowerCase()
  return [
    'yes',
    'y',
    'yeah',
    'yep',
    'sure',
    'ok',
    'okay',
    'please',
    'go ahead',
    'sounds good',
    'do it',
  ].includes(normalized)
}

function isNegativeReply(input: string): boolean {
  const normalized = input.trim().toLowerCase()
  return ['no', 'nope', 'not now'].includes(normalized)
}

// Fallback response when AI providers are unavailable.
// This fallback is intentionally stateful enough to avoid breaking a simple multi-turn conversation.
function generateFallbackResponse(input: string, source?: string, history: ChatMessage[] = []): string {
  const lower = input.toLowerCase()
  const lastAssistantMessage = getLastAssistantMessage(history)
  const lastAssistantLower = lastAssistantMessage.toLowerCase()
  const saidYes = isAffirmativeReply(input)
  const saidNo = isNegativeReply(input)

  // Empty category page: supply-chain-oriented responses
  if (source === 'empty-category') {
    if (saidYes && (lastAssistantLower.includes('submit an rfq') || lastAssistantLower.includes('quote'))) {
      return `Great. To prepare the quote, please send:\n\n` +
        `• product name or part number\n` +
        `• quantity needed\n` +
        `• key specs or required certifications\n` +
        `• target delivery country and timeline\n\n` +
        `If you already have a list or spec sheet, you can upload it and our team can quote from that.`
    }

    if (lower.includes('quote') || lower.includes('rfq') || lower.includes('bulk') || lower.includes('price')) {
      return `Absolutely! For bulk and custom orders, here's how we work:\n\n` +
        `1. **Tell me** what you need — product specs, quantities, brand preferences\n` +
        `2. **Submit an RFQ** — our sourcing team gets to work immediately\n` +
        `3. **Receive your quote** — competitive pricing delivered within 24 hours\n\n` +
        `What specific products and quantities are you looking for? Or if you have a procurement list, feel free to upload it.`
    }

    if (lower.includes('upload') || lower.includes('list') || lower.includes('file') || lower.includes('document') || lower.includes('spec')) {
      return `Great — you can upload your spec sheet, BOM, or procurement list using the upload area below the chat.\n\n` +
        `We accept PDF, Excel, CSV, and Word formats. Once uploaded, I'd recommend submitting a quick RFQ so our sourcing specialists can review everything and get back to you with pricing.\n\n` +
        `Go ahead and drop your file below!`
    }

    return `Thanks for your interest! We can absolutely source this for you.\n\n` +
      `To prepare the most accurate quote, it would help to know:\n\n` +
      `• **Product specs** — size, material, ratings, part numbers\n` +
      `• **Quantity** — how many units do you need?\n` +
      `• **Brand preference** — any specific brands, or open to alternatives?\n` +
      `• **Timeline** — when do you need delivery?\n\n` +
      `Share these details and I'll get you a competitive quote. Or you can upload a procurement list below.`
  }

  if (saidYes) {
    if (
      lastAssistantLower.includes('add any of these to your cart')
      || lastAssistantLower.includes('need bulk pricing')
      || lastAssistantLower.includes('add to your cart')
    ) {
      return `Happy to help. Which path do you want?\n\n` +
        `• **Add to cart** — tell me the glove option and quantity\n` +
        `• **Bulk pricing** — tell me the estimated quantity and any required specs\n\n` +
        `For example: "Cut-resistant gloves, 20 pairs" or "Need 300 pairs with ANSI A4".`
    }

    if (
      lastAssistantLower.includes('chemical handling')
      || lastAssistantLower.includes('cut protection')
      || lastAssistantLower.includes('general assembly')
    ) {
      return `Which glove job best matches your need: chemical handling, cut protection, or general assembly? If you already know the quantity or size range, send that too.`
    }

    return `Tell me the product or job you need help with, and include quantity or specs if you know them.`
  }

  if (saidNo) {
    return `No problem. Tell me what product you want to find, or ask about shipping, returns, quotes, or order help.`
  }

  if (lower.includes('glove') || lower.includes('ppe') || lower.includes('safety')) {
    return `I can help with gloves. What is the main job: **chemical handling**, **cut protection**, or **general assembly**?\n\n` +
      `If you already know the quantity, size range, or certification requirement, send that too and I can guide you faster.`
  }

  if (lower.includes('quote') || lower.includes('rfq') || lower.includes('bulk') || lower.includes('price')) {
    return `I can help you get a quote! For bulk orders:\n\n` +
      `1. Tell me the products and quantities you need\n` +
      `2. I'll add them to your RFQ list\n` +
      `3. Submit for custom pricing within 24 hours\n\n` +
      `What products are you looking for?`
  }

  if (lower.includes('shipping') || lower.includes('deliver')) {
    return `**Machrio Shipping:**\n\n` +
      `• Shipping is quoted live from item weight, destination, and shipping method\n` +
      `• Available routes currently include DDP air and DDP sea\n` +
      `• Method-specific free-shipping thresholds may apply when configured\n` +
      `• If no live rate is available, our team can confirm freight manually\n\n` +
      `Need help checking shipping for a specific destination or order size?`
  }

  if (lower.includes('return') || lower.includes('refund')) {
    return `**Return Policy:**\n\n` +
      `• 30-day hassle-free returns\n` +
      `• Full refund on unopened products\n` +
      `• Free replacement for defective items\n\n` +
      `Need to start a return? Visit our Help Center.`
  }

  if (lower.includes('bearing') || /[a-z0-9]+-[a-z0-9]+/i.test(input)) {
    return `If you have a part number or bearing code, send it exactly as printed. If you also know quantity or brand preference, include that and I can guide you to the fastest next step.`
  }

  return `Hi! I'm the Machrio AI Sourcing Assistant. I can help you:\n\n` +
    `• **Find products** — tell me the product, use case, or part number\n` +
    `• **Get bulk quotes** — send quantity and key specs\n` +
    `• **Answer buying questions** — shipping, returns, lead time, and order help\n\n` +
    `What are you trying to buy today?`
}
