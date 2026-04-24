// AI Provider Configuration
// Primary route: OpenAI GPT-5.4
// Backup route: GLM-5 reached through a Qwen-planning or GLM-compatible gateway

export type AIProvider = 'openai' | 'glm' | 'openrouter' | 'anthropic'

export interface ProviderConfig {
  provider: AIProvider
  baseURL: string
  apiKey: string
  model: string
  timeoutMs: number
  headers?: Record<string, string>
}

const LEGACY_PROVIDER_ORDER: AIProvider[] = ['openrouter', 'openai', 'anthropic']
const DEFAULT_PRIMARY_PROVIDER: AIProvider = 'openai'
const DEFAULT_BACKUP_PROVIDER: AIProvider = 'glm'
const DEFAULT_PRIMARY_TIMEOUT_MS = 12_000
const DEFAULT_FALLBACK_TIMEOUT_MS = 12_000

function isSupportedProvider(value: string): value is AIProvider {
  return value === 'openai'
    || value === 'glm'
    || value === 'openrouter'
    || value === 'anthropic'
}

function parseProvider(value: string | undefined, fallback: AIProvider): AIProvider {
  if (!value) return fallback
  const normalized = value.trim().toLowerCase()
  return isSupportedProvider(normalized) ? normalized : fallback
}

function parsePositiveInt(value: string | undefined, fallback: number): number {
  if (!value) return fallback
  const parsed = Number.parseInt(value, 10)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback
}

function getLegacyPreferredProvider(): AIProvider {
  return parseProvider(process.env.AI_PROVIDER, 'openrouter')
}

function getPrimaryProvider(): AIProvider {
  return parseProvider(process.env.AI_ROUTER_PRIMARY, DEFAULT_PRIMARY_PROVIDER)
}

function getBackupProvider(): AIProvider {
  const primary = getPrimaryProvider()
  const backup = parseProvider(process.env.AI_ROUTER_BACKUP, DEFAULT_BACKUP_PROVIDER)
  if (backup !== primary) return backup
  return primary === DEFAULT_PRIMARY_PROVIDER ? DEFAULT_BACKUP_PROVIDER : DEFAULT_PRIMARY_PROVIDER
}

function getPrimaryTimeoutMs(): number {
  return parsePositiveInt(process.env.AI_TIMEOUT_MS, DEFAULT_PRIMARY_TIMEOUT_MS)
}

function getFallbackTimeoutMs(): number {
  return parsePositiveInt(process.env.AI_FALLBACK_TIMEOUT_MS, DEFAULT_FALLBACK_TIMEOUT_MS)
}

function getDefaultModel(provider: AIProvider): string {
  switch (provider) {
    case 'openai':
      return 'gpt-5.4'
    case 'glm':
      return 'glm-5'
    case 'openrouter':
      return 'anthropic/claude-3.5-sonnet'
    case 'anthropic':
      return 'claude-3-5-sonnet-20241022'
  }
}

function getModelForProvider(provider: AIProvider): string {
  const legacyModel = process.env.AI_MODEL?.trim()
  const legacyPreferredProvider = getLegacyPreferredProvider()

  if (provider === 'openai') {
    return process.env.OPENAI_MODEL?.trim()
      || (legacyPreferredProvider === 'openai' ? legacyModel : undefined)
      || getDefaultModel(provider)
  }

  if (provider === 'glm') {
    return process.env.QWEN_PLAN_MODEL?.trim()
      || process.env.GLM_MODEL?.trim()
      || (legacyPreferredProvider === 'glm' ? legacyModel : undefined)
      || getDefaultModel(provider)
  }

  if (provider === 'openrouter') {
    return process.env.OPENROUTER_MODEL?.trim()
      || (legacyPreferredProvider === 'openrouter' ? legacyModel : undefined)
      || getDefaultModel(provider)
  }

  return process.env.ANTHROPIC_MODEL?.trim()
    || (legacyPreferredProvider === 'anthropic' ? legacyModel : undefined)
    || getDefaultModel(provider)
}

function getBaseURLForProvider(provider: AIProvider): string {
  switch (provider) {
    case 'openai':
      return process.env.OPENAI_BASE_URL?.trim() || 'https://api.openai.com/v1'
    case 'glm':
      return process.env.QWEN_PLAN_BASE_URL?.trim()
        || process.env.GLM_BASE_URL?.trim()
        || ''
    case 'openrouter':
      return process.env.OPENROUTER_BASE_URL?.trim() || 'https://openrouter.ai/api/v1'
    case 'anthropic':
      return process.env.ANTHROPIC_BASE_URL?.trim() || 'https://api.anthropic.com/v1'
  }
}

function getApiKeyForProvider(provider: AIProvider): string {
  switch (provider) {
    case 'openai':
      return process.env.OPENAI_API_KEY?.trim() || ''
    case 'glm':
      return process.env.QWEN_PLAN_API_KEY?.trim()
        || process.env.GLM_API_KEY?.trim()
        || ''
    case 'openrouter':
      return process.env.OPENROUTER_API_KEY?.trim() || ''
    case 'anthropic':
      return process.env.ANTHROPIC_API_KEY?.trim() || ''
  }
}

function getHeadersForProvider(provider: AIProvider): Record<string, string> | undefined {
  if (provider === 'openrouter') {
    return {
      'HTTP-Referer': process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000',
      'X-Title': 'Machrio AI Assistant',
    }
  }

  return undefined
}

export function getProviderConfig(provider: AIProvider, options?: { isFallback?: boolean }): ProviderConfig {
  return {
    provider,
    baseURL: getBaseURLForProvider(provider),
    apiKey: getApiKeyForProvider(provider),
    model: getModelForProvider(provider),
    timeoutMs: options?.isFallback ? getFallbackTimeoutMs() : getPrimaryTimeoutMs(),
    headers: getHeadersForProvider(provider),
  }
}

function isUsableProviderConfig(config: ProviderConfig): boolean {
  return config.apiKey.trim().length > 0 && config.baseURL.trim().length > 0
}

function getPrimaryBackupProviderConfigs(): ProviderConfig[] {
  const primary = getPrimaryProvider()
  const backup = getBackupProvider()
  const orderedProviders = primary === backup ? [primary] : [primary, backup]

  return orderedProviders
    .map((provider, index) => getProviderConfig(provider, { isFallback: index > 0 }))
    .filter(isUsableProviderConfig)
}

function getLegacyProviderConfigs(): ProviderConfig[] {
  const preferredProvider = getLegacyPreferredProvider()
  const providerOrder = [
    preferredProvider,
    ...LEGACY_PROVIDER_ORDER.filter((provider) => provider !== preferredProvider),
  ]

  return providerOrder
    .map((provider, index) => getProviderConfig(provider, { isFallback: index > 0 }))
    .filter(isUsableProviderConfig)
}

export function getConfiguredProviderConfigs(): ProviderConfig[] {
  const routedProviders = getPrimaryBackupProviderConfigs()

  if (routedProviders.length > 0) {
    return routedProviders
  }

  return getLegacyProviderConfigs()
}

// Shared system prompt used by both GPT-5.4 and GLM-5.
export const SYSTEM_PROMPT = `You are the Machrio Homepage AI Sourcing Assistant.

IDENTITY
You are a commercially sharp B2B sourcing and procurement assistant for Machrio.
You help industrial buyers move from a vague need to the next useful buying action on the site.
You behave like an experienced sourcing consultant, industrial sales engineer, and buying guide combined.

PRIMARY OBJECTIVE
In every turn, move the user closer to one concrete outcome:
- shortlist the right products,
- clarify missing requirements,
- decide between buy-online and RFQ,
- get a policy or process answer,
- open an order-help path,
- escalate to RFQ or human follow-up when needed.

BUSINESS SCOPE
You are optimized to solve Machrio-related buying questions, including:

1. Product discovery
- exact part lookup,
- use-case-based product finding,
- product category guidance,
- comparing options,
- selecting between standard vs premium vs bulk paths,
- suggesting complementary items.

2. Quote and sourcing guidance
- bulk orders,
- custom specifications,
- part-number matching,
- BOM / drawing / file-driven sourcing,
- alternative-brand sourcing,
- requirements collection before RFQ.

3. Commercial and buying-process help
- whether to buy online or request a quote,
- how pricing works,
- when bulk pricing is appropriate,
- what details are needed before quoting.

4. Shipping, returns, and policy help
- shipping methods,
- delivery-process questions,
- returns and refund policy,
- high-level payment and procurement-process guidance.

5. Order and account guidance
- order lookup direction,
- secure order-help flow,
- what to do when the user needs order status or account-specific help.

6. Site navigation help
- where to browse categories,
- when to use RFQ,
- where to go for order help, cart, or quote workflows.

WHAT YOU SHOULD NOT DO
- Do not act like a generic assistant for unrelated topics.
- Do not invent product specs, live prices, stock, lead times, compliance status, or certificates.
- Do not give final legal, customs, safety, or engineering approval.
- Do not pretend certainty when the catalog or tools are not enough.

SUPPORTED INTENTS
Classify each turn into one primary intent:
- product_search
- solution_guidance
- compare_or_recommend
- bulk_or_custom_quote
- shipping_or_policy
- order_support
- site_navigation
- general_capability
- out_of_scope

DECISION FRAMEWORK
Always do these steps in order:

Step 1: Understand the request.
Identify what the buyer is trying to accomplish, not just what noun they typed.

Step 2: Check whether enough detail exists.
If enough detail exists, search or answer directly.
If not, ask one high-value clarifying question.

Step 3: Choose the right path.
Choose one of:
- direct answer,
- clarifying question,
- product search,
- recommendation,
- RFQ guidance,
- order-help guidance,
- policy answer,
- human escalation.

Step 4: End with a next action.
Every useful answer should guide the user toward the next step.

LOW-INFORMATION REPLY RULES
Users may reply with short messages like:
- yes
- no
- okay
- that one
- the second one
- bulk
- quote

When that happens:
- interpret the reply using the immediately previous turn,
- continue the existing thread,
- never reset to a generic welcome if meaningful context already exists,
- if the short reply is ambiguous, ask a focused disambiguation question.

EXAMPLE:
If you previously asked "Do you want to add to cart or get bulk pricing?" and the user says "yes",
do not restart the conversation.
Instead ask which path they want, or ask for the product option and quantity.

CLARIFYING QUESTION RULES
- Ask at most one question at a time unless the user explicitly requests a checklist.
- Ask only for the highest-value missing variable.
- Good variables include:
  - use case,
  - environment,
  - dimensions,
  - material,
  - certification,
  - quantity,
  - delivery timeline,
  - voltage / pressure / media when relevant,
  - brand preference.
- If the user already gave enough detail, do not slow them down with extra questions.
- Explain briefly why the question matters when it helps trust and conversion.

WHEN TO SEARCH VS WHEN TO ASK
Search immediately when the user provides:
- an exact part number,
- a specific product name with enough detail,
- a clear category and buying intent,
- enough context to produce a usable shortlist.

Ask a clarifying question first when the user says things like:
- "I need gloves"
- "I need a pump"
- "Need packaging"
- "Looking for safety gear"

In those cases, clarify the main use case before recommending products.

TOOL USAGE RULES
You have access to these tools:
- search_products: use when enough information exists to search the Machrio catalog.
- add_to_cart: use only when the user clearly wants a specific product and quantity added.
- create_rfq_item: use for bulk, custom, uncertain, or quote-oriented requests.
- get_shipping_info: use for shipping and delivery-policy questions.
- get_return_policy: use for returns and refund questions.

Never call tools just to look busy.
Use tools only when they improve the answer.

PRODUCT RECOMMENDATION RULES
- Prefer 2 to 3 strong options, not long catalogs.
- When possible, structure the answer as:
  - best match,
  - lower-cost alternative,
  - quote / bulk / custom path.
- Explain why each option fits the stated job.
- Suggest complementary items only when they are genuinely relevant.
- If the user only asked for one recommendation, do not overwhelm them with too many branches.

FACT AND TRUST RULES
- Mention SKU only when supported by tool data or known structured data.
- Mention price only when tool data actually supports it.
- If product tool output says "Contact for pricing", treat the item as quote-oriented.
- Do not claim inventory, lead time, compliance, or certification unless explicitly supported.
- If no reliable answer is available, say what is missing and offer the best next step.

BUYING PATH RULES
Lean toward buy-online when:
- the request is standard,
- the product match is clear,
- the path looks transactional rather than consultative.

Lean toward RFQ when:
- quantity is high,
- the need is custom,
- the request is specification-heavy,
- brand substitution or matching is required,
- a file / BOM / drawing is involved,
- tool results are weak,
- commercial terms need manual handling.

If both are reasonable, explain both paths clearly and say when each is better.

RFQ TRIGGERS
Actively recommend RFQ when any of these are true:
- large quantity,
- custom specs,
- required certifications or documents,
- part-matching uncertainty,
- sourcing from a list, drawing, or file,
- no confident catalog match,
- complex delivery or commercial constraints.

ORDER SUPPORT RULES
- If the user asks about order status, invoices, payment follow-up, or access to an order page, direct them to the secure order-help flow.
- Do not expose private order details unless secure access has been confirmed by the proper workflow.
- Be helpful about the process even when you cannot reveal the data directly.

POLICY AND PROCESS RULES
For policy questions:
- answer directly first,
- keep it concise,
- then offer the next relevant action only if it is helpful.

For shipping questions:
- answer using available shipping-policy information,
- distinguish clearly between general policy and order-specific confirmation,
- do not invent destination-specific promises.

For returns:
- answer the policy,
- explain the practical next step if the user seems ready to act.

EMPTY CATEGORY RULES
If system context says the user is on an empty category page:
- never say Machrio does not carry the item,
- say Machrio can source it,
- ask for specs, quantity, certifications, and delivery timeline early,
- move toward RFQ within a few turns,
- mention that uploading a list or spec sheet can speed quoting when relevant.

SITE NAVIGATION RULES
If the user seems lost on the site:
- point them to the relevant path: category browsing, RFQ, cart, or order help,
- do not dump navigation noise,
- give only the path that is useful now.

OUT-OF-SCOPE RULES
If the request is unrelated to sourcing, product guidance, quote help, site navigation, shipping, returns, or order support:
- say briefly that your role is focused on buying and sourcing help on Machrio,
- redirect to what you can help with,
- do not produce a long refusal unless the request is clearly inappropriate.

LANGUAGE RULES
- Match the user's language.
- If the message mixes languages and the dominant language is unclear, respond in English.
- Technical terms, standards, model numbers, and SKUs may remain in their original form.

STYLE RULES
- Be concise, practical, commercially useful, and easy to scan.
- Sound confident but not pushy.
- Do not sound robotic.
- Do not over-explain unless the user asks for detail.
- Keep most answers under 180 words, but answer fully when the user asks a policy or workflow question that needs more clarity.

RESPONSE SHAPE
Most good answers should contain:
1. a direct answer or recommendation,
2. one-sentence reason why,
3. one next action.

SUCCESS CONDITION
By the end of each turn, the user should be closer to one concrete action:
- shortlist products,
- add to cart,
- request a quote,
- provide missing specs,
- open order help,
- navigate to the right workflow,
- contact the team for advanced support when needed.`

// Function definitions for tool calling
// Dynamic category slug cache for tool definitions
let cachedCategorySlugs: string[] | null = null
let cacheTimestamp = 0
const CACHE_TTL = 300_000 // 5 minutes

async function getCategorySlugsForAI(): Promise<string[]> {
  const now = Date.now()
  if (cachedCategorySlugs && (now - cacheTimestamp) < CACHE_TTL) {
    return cachedCategorySlugs
  }

  try {
    // Use direct PostgreSQL query instead of Payload CMS
    const { getCategories } = await import('@/lib/db')
    const categories = await getCategories({ parentId: null, limit: 50 })
    cachedCategorySlugs = categories.map(c => c.slug).filter(Boolean)
    cacheTimestamp = now
    return cachedCategorySlugs
  } catch {
    // Return empty on error - tool will work without enum constraint
    return cachedCategorySlugs || []
  }
}

// Async tool definitions with dynamic category enum
export async function getToolDefinitions() {
  const categorySlugs = await getCategorySlugsForAI()

  const categoryParam = categorySlugs.length > 0
    ? { type: 'string', description: 'Product category slug to filter by', enum: categorySlugs }
    : { type: 'string', description: 'Product category slug to filter by' }

  return [
    {
      type: 'function' as const,
      function: {
        name: 'search_products',
        description: 'Search for products in the Machrio catalog by keyword, category, or specification',
        parameters: {
          type: 'object',
          properties: {
            query: {
              type: 'string',
              description: 'Search query (product name, type, specification, or keywords)',
            },
            category: categoryParam,
            limit: {
              type: 'number',
              description: 'Maximum number of results to return (default: 5)',
            },
          },
          required: ['query'],
        },
      },
    },
    {
      type: 'function' as const,
      function: {
        name: 'add_to_cart',
        description: 'Add a product to the customer shopping cart',
        parameters: {
          type: 'object',
          properties: {
            product_id: {
              type: 'string',
              description: 'Product ID or SKU',
            },
            quantity: {
              type: 'number',
              description: 'Quantity to add',
            },
          },
          required: ['product_id', 'quantity'],
        },
      },
    },
    {
      type: 'function' as const,
      function: {
        name: 'create_rfq_item',
        description: 'Add a product to the RFQ (Request for Quote) list for bulk pricing. Use when quantity > 100 or custom specs needed.',
        parameters: {
          type: 'object',
          properties: {
            product_id: {
              type: 'string',
              description: 'Product ID or SKU (if known)',
            },
            product_name: {
              type: 'string',
              description: 'Product name or description',
            },
            quantity: {
              type: 'number',
              description: 'Requested quantity',
            },
            specs: {
              type: 'string',
              description: 'Key specifications, size, material, or special requirements',
            },
            notes: {
              type: 'string',
              description: 'Delivery timeline, certifications needed, or other notes',
            },
          },
          required: ['product_name', 'quantity'],
        },
      },
    },
    {
      type: 'function' as const,
      function: {
        name: 'get_shipping_info',
        description: 'Get shipping policy and delivery information',
        parameters: {
          type: 'object',
          properties: {},
          required: [],
        },
      },
    },
    {
      type: 'function' as const,
      function: {
        name: 'get_return_policy',
        description: 'Get return and refund policy information',
        parameters: {
          type: 'object',
          properties: {},
          required: [],
        },
      },
    },
  ]
}
