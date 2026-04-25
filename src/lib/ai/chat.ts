// AI Chat Service - handles communication with LLM providers
import {
  getConfiguredProviderConfigs,
  SYSTEM_PROMPT,
  getToolDefinitions,
  type ProviderConfig,
} from './config'
import { getCategoryBySlug, searchProducts, getPool } from '@/lib/db'
import { parsePricing } from '@/lib/pricing'
import { normalizePurchaseMode, supportsOnlineCheckout } from '@/lib/purchase-mode'
import { RETURN_POLICY_SUMMARY, SHIPPING_POLICY_SUMMARY } from '@/lib/site-policies'

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
  provider: ProviderConfig['provider']
  model: string
}

interface AnthropicMessage {
  role: 'user' | 'assistant'
  content: string
}

interface ProviderCompletionPayload {
  content: string
  tool_calls?: ToolCall[]
  finish_reason: string
}

const MAX_PROVIDER_ATTEMPTS = 3
const RETRYABLE_PROVIDER_ERRORS = [
  'Model returned an empty response',
  'Model returned no final answer text after tool execution',
  'No response from AI',
]

function formatProductPrice(
  pricing: ReturnType<typeof parsePricing>,
  purchaseModeValue: string | null | undefined,
): { price: string; rawPrice: number; priceUnit?: string; currency?: string } {
  const purchaseMode = normalizePurchaseMode(purchaseModeValue)
  const basePrice = pricing?.basePrice
  const currency = pricing?.currency || 'USD'
  const priceUnit = pricing?.priceUnit || 'each'

  if (supportsOnlineCheckout(purchaseMode) && typeof basePrice === 'number' && Number.isFinite(basePrice)) {
    return {
      price: `$${basePrice.toFixed(2)}${priceUnit ? `/${priceUnit}` : ''}`,
      rawPrice: basePrice,
      priceUnit,
      currency,
    }
  }

  if (purchaseMode === 'rfq-only') {
    return {
      price: 'Request a Quote',
      rawPrice: 0,
      priceUnit,
      currency,
    }
  }

  return {
    price: 'Contact for pricing',
    rawPrice: 0,
    priceUnit,
    currency,
  }
}

// Search products from database without inventing fallback catalog items.
async function searchProductsFromDB(query: string, _category?: string, limit: number = 5) {
  try {
    let categoryId: string | undefined

    if (_category) {
      const category = await getCategoryBySlug(_category)
      categoryId = category?.id
    }

    const result = await searchProducts(query, { limit, categoryId })

    if (result.docs.length > 0) {
      return {
        products: result.docs.map(p => ({
        id: p.id,
        name: p.name,
        sku: p.sku,
        slug: p.slug || '',
        categorySlug: 'products',
        imageUrl: p.external_image_url || undefined,
        ...formatProductPrice(parsePricing(p.pricing), p.purchase_mode),
        inStock: p.availability === 'in-stock',
        availability: p.availability || 'contact',
        })),
        unavailable: false,
      }
    }

    return {
      products: [],
      unavailable: false,
    }
  } catch (error) {
    console.error('[AI Search] Error searching products:', error)
    return {
      products: [],
      unavailable: true,
    }
  }
}

// Find product by ID or SKU without fabricating fallback items.
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
      const pricing = formatProductPrice(parsePricing(p.pricing), p.purchase_mode)
      return {
        id: p.id,
        name: p.name,
        sku: p.sku,
        price: pricing.price,
        rawPrice: pricing.rawPrice,
      }
    }

    // Try to find by ID
    const idResult = await pool.query(
      `SELECT * FROM products WHERE id::text = $1 LIMIT 1`,
      [productId]
    )

    if (idResult.rows.length > 0) {
      const p = idResult.rows[0]
      const pricing = formatProductPrice(parsePricing(p.pricing), p.purchase_mode)
      return {
        id: p.id,
        name: p.name,
        sku: p.sku,
        price: pricing.price,
        rawPrice: pricing.rawPrice,
      }
    }

    return null
  } catch (error) {
    console.error('[AI Search] Error finding product:', error)
    return null
  }
}

// Execute tool calls and return results
export async function executeToolCall(name: string, args: Record<string, unknown>): Promise<string> {
  switch (name) {
    case 'search_products': {
      const query = (args.query as string || '').toLowerCase()
      const category = args.category as string | undefined
      const limit = (args.limit as number) || 5

      const searchResult = await searchProductsFromDB(query, category, limit)

      if (searchResult.unavailable) {
        return JSON.stringify({
          success: false,
          products: [],
          error: 'Catalog search is temporarily unavailable right now.',
        })
      }

      if (searchResult.products.length === 0) {
        return JSON.stringify({ success: true, products: [], message: 'No products found matching your search.' })
      }

      return JSON.stringify({
        success: true,
        products: searchResult.products,
      })
    }

    case 'add_to_cart': {
      const productId = args.product_id as string
      const quantity = args.quantity as number || 1
      const product = await findProductById(productId)

      if (!product) {
        return JSON.stringify({ success: false, error: 'Product not found' })
      }

      if (!product.rawPrice || product.rawPrice <= 0) {
        return JSON.stringify({
          success: false,
          error: 'This item is quote-only and cannot be added directly with a live checkout price.',
        })
      }

      const unitPrice = product.rawPrice

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
        shipping: SHIPPING_POLICY_SUMMARY,
      })
    }

    case 'get_return_policy': {
      return JSON.stringify({
        success: true,
        returns: RETURN_POLICY_SUMMARY,
      })
    }

    default:
      return JSON.stringify({ success: false, error: `Unknown function: ${name}` })
  }
}

// Main chat completion function
export async function createChatCompletion(
  messages: ChatMessage[],
  useTools: boolean = true,
  preferredProvider?: ProviderConfig['provider'],
): Promise<ChatCompletionResponse> {
  const configuredProviders = getConfiguredProviderConfigs()

  if (configuredProviders.length === 0) {
    throw new Error('AI API key not configured')
  }

  const orderedProviders = orderProviders(configuredProviders, preferredProvider)
  const providerErrors: string[] = []

  for (const [index, config] of orderedProviders.entries()) {
    if (index > 0) {
      console.warn(
        `[AI] Falling back to ${config.provider}/${config.model} after previous provider failure(s).`,
      )
    }

    for (let attempt = 1; attempt <= MAX_PROVIDER_ATTEMPTS; attempt += 1) {
      try {
        const completion = await createChatCompletionForProvider(config, messages, useTools)
        validateCompletionPayload(completion, useTools)

        return {
          ...completion,
          provider: config.provider,
          model: config.model,
        }
      } catch (error) {
        const detail = error instanceof Error ? error.message : 'Unknown provider error'
        const canRetry = attempt < MAX_PROVIDER_ATTEMPTS && shouldRetryProviderError(error)

        if (canRetry) {
          console.warn(
            `[AI] Provider ${config.provider} returned a retryable response issue (${detail}). Retrying ${attempt + 1}/${MAX_PROVIDER_ATTEMPTS}.`,
          )
          continue
        }

        providerErrors.push(`${config.provider}/${config.model}: ${detail}`)
        console.error(`[AI] Provider ${config.provider} failed:`, error)
        break
      }
    }
  }

  throw new Error(`All AI providers failed: ${providerErrors.join(' | ')}`)
}

async function createChatCompletionForProvider(
  config: ProviderConfig,
  messages: ChatMessage[],
  useTools: boolean,
): Promise<ProviderCompletionPayload> {
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

  const response = await fetchWithTimeout(`${config.baseURL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.apiKey}`,
      ...config.headers,
    },
    body: JSON.stringify(requestBody),
  }, config.timeoutMs)

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
): Promise<ProviderCompletionPayload> {
  const anthropicRequest = buildAnthropicRequest(messages)

  const response = await fetchWithTimeout(`${config.baseURL}/messages`, {
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
  }, config.timeoutMs)

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

function orderProviders(
  providers: ProviderConfig[],
  preferredProvider?: ProviderConfig['provider'],
): ProviderConfig[] {
  if (!preferredProvider) return providers

  const preferredConfig = providers.find((provider) => provider.provider === preferredProvider)
  if (!preferredConfig) return providers

  return [
    preferredConfig,
    ...providers.filter((provider) => provider.provider !== preferredProvider),
  ]
}

function validateCompletionPayload(
  completion: ProviderCompletionPayload,
  useTools: boolean,
): void {
  const hasText = completion.content.trim().length > 0
  const toolCalls = completion.tool_calls || []
  const hasToolCalls = toolCalls.length > 0

  if (!hasText && !hasToolCalls) {
    throw new Error('Model returned an empty response')
  }

  for (const toolCall of toolCalls) {
    if (!toolCall.id || !toolCall.function?.name) {
      throw new Error('Model returned a malformed tool call')
    }

    const rawArgs = toolCall.function.arguments || '{}'
    let parsedArgs: unknown

    try {
      parsedArgs = JSON.parse(rawArgs)
    } catch {
      throw new Error(`Tool call arguments for "${toolCall.function.name}" were not valid JSON`)
    }

    if (!parsedArgs || typeof parsedArgs !== 'object' || Array.isArray(parsedArgs)) {
      throw new Error(`Tool call arguments for "${toolCall.function.name}" must be a JSON object`)
    }
  }

  if (!useTools && !hasText) {
    throw new Error('Model returned no final answer text after tool execution')
  }
}

function shouldRetryProviderError(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false
  }

  return RETRYABLE_PROVIDER_ERRORS.some((pattern) => error.message.includes(pattern))
}

async function fetchWithTimeout(
  input: string,
  init: RequestInit,
  timeoutMs: number,
): Promise<Response> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), timeoutMs)

  try {
    return await fetch(input, {
      ...init,
      signal: controller.signal,
    })
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error(`AI request timed out after ${timeoutMs}ms`)
    }

    throw error
  } finally {
    clearTimeout(timeout)
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
    completion = await createChatCompletion(messages, false, completion.provider)
  }

  return {
    response: completion.content,
    toolResults: toolResults.length > 0 ? toolResults : undefined,
  }
}
