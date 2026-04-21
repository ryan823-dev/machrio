import { NextResponse } from 'next/server'
import { processConversation, ChatMessage } from '@/lib/ai/chat'
import { getConfiguredProviderConfigs } from '@/lib/ai/config'

export async function POST(request: Request) {
  try {
    const { messages, message, conversationHistory, source, categoryName, categoryPath } = await request.json()

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
      // Fall back to mock response if no API key
      return NextResponse.json({
        reply: generateFallbackResponse(userMessage, source),
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

      return NextResponse.json({
        reply: generateFallbackResponse(userMessage, source),
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

// Fallback response when API is not configured
function generateFallbackResponse(input: string, source?: string): string {
  const lower = input.toLowerCase()

  // Empty category page: supply-chain-oriented responses
  if (source === 'empty-category') {
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

  if (lower.includes('glove') || lower.includes('ppe') || lower.includes('safety')) {
    return `We have a wide selection of safety gloves and PPE:\n\n` +
      `• **Nitrile Exam Gloves** (MRO-GL-001) - $12.99/box\n` +
      `• **Cut-Resistant Gloves, ANSI A4** (MRO-GL-002) - $18.49/pair\n` +
      `• **Chemical-Resistant Neoprene** (MRO-GL-003) - $24.99/pair\n\n` +
      `Would you like me to add any of these to your cart, or need bulk pricing?`
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
      `• Available routes can include U.S. warehouse, DDP air, and DDP sea\n` +
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

  return `Hi! I'm the Machrio AI Sourcing Assistant. I can help you:\n\n` +
    `• **Find products** - Tell me what you need\n` +
    `• **Add to cart** - Quick ordering\n` +
    `• **Get bulk quotes** - RFQ for volume pricing\n` +
    `• **Answer questions** - Shipping, returns, specs\n\n` +
    `What can I help you with today?`
}
