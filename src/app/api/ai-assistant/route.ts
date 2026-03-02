import { NextResponse } from 'next/server'
import { processConversation, ChatMessage } from '@/lib/ai/chat'

export async function POST(request: Request) {
  try {
    const { messages, message, conversationHistory } = await request.json()

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

    // Check if API key is configured
    const apiKey = process.env.OPENROUTER_API_KEY || process.env.OPENAI_API_KEY || process.env.ANTHROPIC_API_KEY
    
    if (!apiKey) {
      // Fall back to mock response if no API key
      return NextResponse.json({
        reply: generateFallbackResponse(userMessage),
        mode: 'fallback',
      })
    }

    // Process with real AI
    const result = await processConversation(userMessage, history)

    return NextResponse.json({
      reply: result.response,
      response: result.response,
      toolResults: result.toolResults,
      mode: 'ai',
    })
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
function generateFallbackResponse(input: string): string {
  const lower = input.toLowerCase()

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
      `• Same-day shipping on orders before 3PM EST\n` +
      `• Standard delivery: 3-5 business days\n` +
      `• Express: 1-2 business days\n` +
      `• Free shipping on orders over $99\n\n` +
      `Need to check stock on a specific item?`
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
