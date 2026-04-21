// AI Chat Service - handles communication with LLM providers
import {
  getConfiguredProviderConfigs,
  SYSTEM_PROMPT,
  getToolDefinitions,
  type ProviderConfig,
} from './config'
import { searchProducts, getPool } from '@/lib/db'

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant' | 'tool'
  content: string
  tool_calls?: ToolCall[]
  tool_call_id?: string
}

export interface ToolCall {
  id: string
  type: 'function'
  function: {
    name: string
    arguments: string
  }
}

export interface ChatCompletionResponse {
  content: string
  tool_calls?: ToolCall[]
  finish_reason: string
}

interface AnthropicMessage {
  role: 'user' | 'assistant'
  content: string
}

// Fallback product data (used when database returns no results)
const fallbackProducts = [
  // Safety
  { id: '1', name: 'Nitrile Exam Gloves, Powder-Free, Blue', sku: 'MRO-SF-001', price: '$12.99', priceUnit: 'per box of 100', inStock: true, availability: 'in-stock' },
  { id: '2', name: 'Cut-Resistant Gloves, ANSI A4', sku: 'MRO-SF-002', price: '$18.49', priceUnit: 'per pair', inStock: true, availability: 'in-stock' },
  { id: '3', name: 'Safety Glasses, Anti-Fog Clear Lens', sku: 'MRO-SF-003', price: '$8.99', priceUnit: 'per pair', inStock: true, availability: 'in-stock' },
  { id: '4', name: 'Hard Hat, ANSI Type I Class E', sku: 'MRO-SF-004', price: '$29.99', priceUnit: 'each', inStock: true, availability: 'in-stock' },
  // Adhesives & Sealants & Tape
  { id: '5', name: 'Super Glue, Industrial Grade, 20g', sku: 'MRO-AD-001', price: '$8.49', priceUnit: 'per tube', inStock: true, availability: 'in-stock' },
  { id: '6', name: 'Silicone Sealant, Clear, 10.1 oz Cartridge', sku: 'MRO-AD-002', price: '$6.99', priceUnit: 'per cartridge', inStock: true, availability: 'in-stock' },
  // Material Handling
  { id: '7', name: 'Steel Platform Cart, 1000 lb Capacity', sku: 'MRO-MH-001', price: '$289.99', priceUnit: 'each', inStock: true, availability: 'in-stock' },
  { id: '8', name: 'Pallet Jack, 5500 lb Capacity', sku: 'MRO-MH-002', price: '$349.99', priceUnit: 'each', inStock: true, availability: 'in-stock' },
  // Packaging & Shipping
  { id: '9', name: 'Corrugated Shipping Boxes, 12x12x12" (25 pack)', sku: 'MRO-PK-001', price: '$29.99', priceUnit: 'per bundle of 25', inStock: true, availability: 'in-stock' },
  { id: '10', name: 'Packing Tape, Clear, 2" x 110 yd (36 rolls)', sku: 'MRO-PK-002', price: '$79.99', priceUnit: 'per case of 36', inStock: true, availability: 'in-stock' },
  // Cleaning
  { id: '11', name: 'Industrial Degreaser, Heavy-Duty, 1 Gallon', sku: 'MRO-CL-001', price: '$24.99', priceUnit: 'per gallon', inStock: true, availability: 'in-stock' },
  { id: '12', name: 'Commercial Wet Mop Kit with Bucket & Wringer', sku: 'MRO-CL-002', price: '$89.99', priceUnit: 'per kit', inStock: true, availability: 'in-stock' },
  // Lighting
  { id: '13', name: 'LED High Bay Light, 200W, 5000K', sku: 'MRO-LT-001', price: '$149.99', priceUnit: 'each', inStock: true, availability: 'in-stock' },
  // Power Transmission
  { id: '14', name: 'Deep Groove Ball Bearing, 6205-2RS', sku: 'MRO-PT-001', price: '$6.99', priceUnit: 'each', inStock: true, availability: 'in-stock' },
  // Tool Storage
  { id: '15', name: 'Heavy-Duty Steel Workbench, 72" x 30"', sku: 'MRO-TS-001', price: '$459.99', priceUnit: 'each', inStock: true, availability: 'in-stock' },
  // Plumbing & Pumps
  { id: '16', name: 'Submersible Sump Pump, 1/3 HP', sku: 'MRO-PP-001', price: '$119.99', priceUnit: 'each', inStock: true, availability: 'in-stock' },
  { id: '17', name: 'PTFE Thread Seal Tape, 1/2" x 520" (10 pack)', sku: 'MRO-PP-002', price: '$9.99', priceUnit: 'per 10-pack', inStock: true, availability: 'in-stock' },
]

// Search products from database with fallback
async function searchProductsFromDB(query: string, _category?: string, limit: number = 5) {
  try {
    const result = await searchProducts(query, { limit })

    if (result.docs.length > 0) {
      return result.docs.map(p => ({
        id: p.id,
        name: p.name,
        sku: p.sku,
        slug: p.slug || '',
        categorySlug: 'products',
        imageUrl: p.external_image_url || undefined,
        price: 'Contact for pricing',
        rawPrice: 0,
        priceUnit: 'each',
        currency: 'USD',
        inStock: p.availability === 'in-stock',
        availability: p.availability || 'contact',
      }))
    }

    // Fallback to mock data if database returns no results
    console.log('[AI Search] Using fallback data')
    return searchFallbackProducts(query, limit)
  } catch (error) {
    console.error('[AI Search] Error, using fallback:', error)
    return searchFallbackProducts(query, limit)
  }
}

// Search fallback products
function searchFallbackProducts(query: string, limit: number = 5) {
  const q = query.toLowerCase()
  const words = q.split(/\s+/).filter(w => w.length > 1)

  // Expand common MRO search terms to match product names
  const expandedTerms: Record<string, string[]> = {
    'ppe': ['gloves', 'safety', 'hat', 'glasses'],
    'safety': ['gloves', 'safety', 'hat', 'glasses'],
    'protection': ['gloves', 'safety', 'hat', 'glasses'],
    'adhesive': ['glue', 'sealant', 'tape'],
    'tape': ['tape', 'packing'],
    'handling': ['cart', 'pallet', 'jack'],
    'packaging': ['box', 'tape', 'shipping'],
    'shipping': ['box', 'tape', 'shipping'],
    'cleaning': ['degreaser', 'mop', 'clean'],
    'lighting': ['led', 'light', 'bay'],
    'bearing': ['bearing', 'groove'],
    'workbench': ['workbench', 'steel'],
    'plumbing': ['pump', 'sump', 'ptfe', 'tape'],
    'pump': ['pump', 'sump'],
  }

  // Collect all search terms
  const searchTerms = [...words]
  for (const term of words) {
    if (expandedTerms[term]) {
      searchTerms.push(...expandedTerms[term])
    }
  }
  if (expandedTerms[q]) {
    searchTerms.push(...expandedTerms[q])
  }

  const results = fallbackProducts.filter(p => {
    const nameLower = p.name.toLowerCase()
    return searchTerms.some(word => nameLower.includes(word)) || nameLower.includes(q)
  })

  return results.slice(0, limit)
}

// Find product by ID or SKU
async function findProductById(productId: string) {
  try {
    const pool = getPool()

    // Try to find by SKU first
    const skuResult = await pool.query(
      `SELECT * FROM products WHERE sku = $1 LIMIT 1`,
      [productId]
    )

    if (skuResult.rows.length > 0) {
      const p = skuResult.rows[0]
      return {
        id: p.id,
        name: p.name,
        sku: p.sku,
        price: 'Contact for pricing',
      }
    }

    // Try to find by ID
    const idResult = await pool.query(
      `SELECT * FROM products WHERE id::text = $1 LIMIT 1`,
      [productId]
    )

    if (idResult.rows.length > 0) {
      const p = idResult.rows[0]
      return {
        id: p.id,
        name: p.name,
        sku: p.sku,
        price: 'Contact for pricing',
      }
    }

    // Fallback to mock data
    return fallbackProducts.find(p => p.id === productId || p.sku === productId)
  } catch (error) {
    console.error('[AI Search] Error finding product:', error)
    return fallbackProducts.find(p => p.id === productId || p.sku === productId)
  }
}

// Execute tool calls and return results
export async function executeToolCall(name: string, args: Record<string, unknown>): Promise<string> {
  switch (name) {
    case 'search_products': {
      const query = (args.query as string || '').toLowerCase()
      const category = args.category as string | undefined
      const limit = (args.limit as number) || 5

      const results = await searchProductsFromDB(query, category, limit)

      if (results.length === 0) {
        return JSON.stringify({ success: true, products: [], message: 'No products found matching your search.' })
      }

      return JSON.stringify({
        success: true,
        products: results,
      })
    }

    case 'add_to_cart': {
      const productId = args.product_id as string
      const quantity = args.quantity as number || 1
      const product = await findProductById(productId)

      if (!product) {
        return JSON.stringify({ success: false, error: 'Product not found' })
      }

      const unitPrice = parseFloat(String(product.price || '0').replace('$', ''))

      return JSON.stringify({
        success: true,
        message: `Added ${quantity}x ${product.name} to cart`,
        cartItem: {
          productId: product.id,
          name: product.name,
          sku: product.sku,
          quantity,
          unitPrice,
          total: unitPrice * quantity,
        },
      })
    }

    case 'create_rfq_item': {
      const productName = args.product_name as string
      const quantity = args.quantity as number
      const notes = args.notes as string || ''

      return JSON.stringify({
        success: true,
        message: `Added to RFQ list: ${quantity}x ${productName}`,
        rfqItem: {
          productName,
          quantity,
          notes,
        },
      })
    }

    case 'get_shipping_info': {
      return JSON.stringify({
        success: true,
        shipping: {
          sameDay: 'Orders placed before 3PM EST ship same day',
          standard: '3-5 business days',
          express: '1-2 business days (additional charge)',
          freeShipping: 'Free shipping on orders over $99',
          bulkOrders: 'Dedicated freight available for large orders',
        },
      })
    }

    case 'get_return_policy': {
      return JSON.stringify({
        success: true,
        returns: {
          window: '30-day hassle-free returns',
          unopened: 'Full refund on unopened products',
          defective: 'Free replacement for defective items',
          process: 'Contact support for return shipping label',
        },
      })
    }

    default:
      return JSON.stringify({ success: false, error: `Unknown function: ${name}` })
  }
}

// Main chat completion function
export async function createChatCompletion(
  messages: ChatMessage[],
  useTools: boolean = true
): Promise<ChatCompletionResponse> {
  const configuredProviders = getConfiguredProviderConfigs()

  if (configuredProviders.length === 0) {
    throw new Error('AI API key not configured')
  }

  const providerErrors: string[] = []

  for (const config of configuredProviders) {
    try {
      return await createChatCompletionForProvider(config, messages, useTools)
    } catch (error) {
      const detail = error instanceof Error ? error.message : 'Unknown provider error'
      providerErrors.push(`${config.provider}: ${detail}`)
      console.error(`[AI] Provider ${config.provider} failed:`, error)
    }
  }

  throw new Error(`All AI providers failed: ${providerErrors.join(' | ')}`)
}

async function createChatCompletionForProvider(
  config: ProviderConfig,
  messages: ChatMessage[],
  useTools: boolean,
): Promise<ChatCompletionResponse> {
  if (config.provider === 'anthropic') {
    return createAnthropicChatCompletion(config, messages)
  }

  const requestBody: Record<string, unknown> = {
    model: config.model,
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      ...messages,
    ],
    temperature: 0.7,
    max_tokens: 1024,
  }

  if (useTools) {
    const toolDefs = await getToolDefinitions()
    requestBody.tools = toolDefs
    requestBody.tool_choice = 'auto'
  }

  const response = await fetch(`${config.baseURL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.apiKey}`,
      ...config.headers,
    },
    body: JSON.stringify(requestBody),
  })

  if (!response.ok) {
    const error = await response.text()
    console.error('AI API error:', error)
    throw new Error(`AI API error: ${response.status}`)
  }

  const data = await response.json()
  const choice = data.choices?.[0]

  if (!choice) {
    throw new Error('No response from AI')
  }

  return {
    content: choice.message?.content || '',
    tool_calls: choice.message?.tool_calls,
    finish_reason: choice.finish_reason,
  }
}

function buildAnthropicRequest(messages: ChatMessage[]) {
  const systemMessages = [SYSTEM_PROMPT]
  const anthropicMessages: AnthropicMessage[] = []

  for (const message of messages) {
    if (message.role === 'system') {
      systemMessages.push(message.content)
      continue
    }

    if (message.role === 'tool') {
      anthropicMessages.push({
        role: 'user',
        content: `Tool result:\n${message.content}`,
      })
      continue
    }

    anthropicMessages.push({
      role: message.role,
      content: message.content,
    })
  }

  return {
    system: systemMessages.join('\n\n'),
    messages: anthropicMessages,
  }
}

async function createAnthropicChatCompletion(
  config: ProviderConfig,
  messages: ChatMessage[],
): Promise<ChatCompletionResponse> {
  const anthropicRequest = buildAnthropicRequest(messages)

  const response = await fetch(`${config.baseURL}/messages`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': config.apiKey,
      'anthropic-version': '2023-06-01',
      ...config.headers,
    },
    body: JSON.stringify({
      model: config.model,
      max_tokens: 1024,
      temperature: 0.7,
      system: anthropicRequest.system,
      messages: anthropicRequest.messages,
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    console.error('Anthropic API error:', error)
    throw new Error(`AI API error: ${response.status}`)
  }

  const data = await response.json()
  const content = Array.isArray(data.content)
    ? data.content
        .filter((part: Record<string, unknown>) => part.type === 'text')
        .map((part: Record<string, unknown>) => String(part.text || ''))
        .join('\n')
        .trim()
    : ''

  if (!content) {
    throw new Error('No response from AI')
  }

  return {
    content,
    finish_reason: data.stop_reason || 'stop',
  }
}

// Process a conversation turn with tool execution
export async function processConversation(
  userMessage: string,
  conversationHistory: ChatMessage[] = []
): Promise<{ response: string; toolResults?: Record<string, unknown>[] }> {
  const messages: ChatMessage[] = [
    ...conversationHistory,
    { role: 'user', content: userMessage },
  ]

  // Get initial response
  let completion = await createChatCompletion(messages)
  const toolResults: Record<string, unknown>[] = []

  // Handle tool calls if any
  if (completion.tool_calls && completion.tool_calls.length > 0) {
    // Add assistant message with tool calls
    messages.push({
      role: 'assistant',
      content: completion.content || '',
      tool_calls: completion.tool_calls,
    })

    // Execute each tool call
    for (const toolCall of completion.tool_calls) {
      const args = JSON.parse(toolCall.function.arguments)
      const result = await executeToolCall(toolCall.function.name, args)

      toolResults.push({
        tool: toolCall.function.name,
        args,
        result: JSON.parse(result),
      })

      // Add tool result to messages
      messages.push({
        role: 'tool',
        content: result,
        tool_call_id: toolCall.id,
      })
    }

    // Get final response after tool execution
    completion = await createChatCompletion(messages, false)
  }

  return {
    response: completion.content,
    toolResults: toolResults.length > 0 ? toolResults : undefined,
  }
}
