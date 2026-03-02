// AI Chat Service - handles communication with LLM providers
import { getProviderConfig, SYSTEM_PROMPT, getToolDefinitions } from './config'
import { getPayload } from 'payload'
import config from '@payload-config'
import type { Where } from 'payload'

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

// Fallback product data (used when Payload returns no results)
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

// Search products from Payload CMS with fallback
async function searchProductsFromPayload(query: string, category?: string, limit: number = 5) {
  try {
    const payload = await getPayload({ config })
    
    // Build where clause for search
    let whereClause: Where = {
      status: { equals: 'published' },
    }
    
    // If we have a query, search by name using 'like' for case-insensitive partial matching
    if (query && query.trim()) {
      const words = query.split(/\s+/).filter(w => w.length > 2)
      const searchWord = words[0] || query
      
      whereClause = {
        and: [
          { status: { equals: 'published' } },
          { name: { like: searchWord } },
        ],
      }
    }
    
    const results = await payload.find({
      collection: 'products',
      where: whereClause,
      limit,
      depth: 1,
    })
    
    // If Payload returns results, use them
    if (results.docs.length > 0) {
      return results.docs.map(p => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const prod = p as any
        const catObj = prod.primaryCategory && typeof prod.primaryCategory === 'object'
          ? prod.primaryCategory : null
        const imgObj = prod.primaryImage && typeof prod.primaryImage === 'object'
          ? prod.primaryImage : null
        return {
          id: p.id,
          name: p.name,
          sku: p.sku,
          slug: prod.slug || '',
          categorySlug: catObj?.slug || 'products',
          imageUrl: imgObj?.url || prod.externalImageUrl || undefined,
          price: p.pricing?.basePrice ? `$${p.pricing.basePrice.toFixed(2)}` : 'Contact for pricing',
          rawPrice: p.pricing?.basePrice || 0,
          priceUnit: p.pricing?.priceUnit || 'each',
          currency: p.pricing?.currency || 'USD',
          inStock: p.availability === 'in-stock',
          availability: p.availability,
        }
      })
    }
    
    // Fallback to mock data if Payload returns no results (e.g., server needs restart after seeding)
    console.log('[AI Search] Using fallback data - restart server if database was recently seeded')
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
    // Safety
    'ppe': ['gloves', 'safety', 'hat', 'glasses'],
    'safety': ['gloves', 'safety', 'hat', 'glasses'],
    'protection': ['gloves', 'safety', 'hat', 'glasses'],
    'hearing': ['ear'],
    'eye': ['glasses'],
    'head': ['hat'],
    // Adhesives
    'adhesive': ['glue', 'sealant', 'tape'],
    'adhesives': ['glue', 'sealant', 'tape'],
    'bond': ['glue'],
    'seal': ['sealant', 'tape', 'ptfe'],
    'tape': ['tape', 'packing'],
    // Material Handling
    'handling': ['cart', 'pallet', 'jack'],
    'warehouse': ['cart', 'pallet'],
    'move': ['cart', 'pallet', 'jack'],
    'dolly': ['cart'],
    // Packaging
    'packaging': ['box', 'tape', 'shipping'],
    'shipping': ['box', 'tape', 'shipping'],
    'box': ['box', 'corrugated'],
    'pack': ['box', 'tape'],
    // Cleaning
    'cleaning': ['degreaser', 'mop', 'clean'],
    'janitorial': ['degreaser', 'mop', 'clean'],
    'clean': ['degreaser', 'mop'],
    'grease': ['degreaser'],
    'floor': ['mop'],
    // Lighting
    'lighting': ['led', 'light', 'bay'],
    'light': ['led', 'light', 'bay'],
    'led': ['led', 'light'],
    // Power Transmission
    'bearing': ['bearing', 'groove'],
    'belt': ['belt'],
    'transmission': ['bearing', 'belt'],
    'motor': ['bearing'],
    // Tool Storage
    'workbench': ['workbench', 'steel'],
    'bench': ['workbench'],
    'storage': ['workbench', 'cabinet'],
    'cabinet': ['workbench', 'cabinet'],
    // Plumbing
    'plumbing': ['pump', 'sump', 'ptfe', 'tape'],
    'pump': ['pump', 'sump'],
    'pipe': ['ptfe', 'tape', 'thread'],
    'valve': ['pump'],
    'water': ['pump', 'sump'],
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
    const payload = await getPayload({ config })
    
    // Try to find by SKU first
    const bySkuResult = await payload.find({
      collection: 'products',
      where: {
        sku: { equals: productId },
      },
      limit: 1,
    })
    
    if (bySkuResult.docs.length > 0) {
      return bySkuResult.docs[0]
    }
    
    // Try to find by ID
    try {
      const byIdResult = await payload.findByID({
        collection: 'products',
        id: productId,
      })
      return byIdResult
    } catch {
      // Fallback to mock data
      return fallbackProducts.find(p => p.id === productId || p.sku === productId)
    }
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
      
      const results = await searchProductsFromPayload(query, category, limit)
      
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
      
      // Handle both Payload product and fallback product shapes
      const productAny = product as Record<string, unknown>
      const unitPrice = 'pricing' in product && product.pricing
        ? ((product.pricing as Record<string, unknown>)?.basePrice as number || 0) 
        : parseFloat(String(productAny.price || '0').replace('$', ''))
      
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
  const config = getProviderConfig()
  
  if (!config.apiKey) {
    throw new Error('AI API key not configured')
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
    
    // Execute each tool call (now async)
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
