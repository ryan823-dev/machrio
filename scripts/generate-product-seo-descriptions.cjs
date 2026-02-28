/**
 * Generate enhanced SEO descriptions for all products.
 * Current fullDescription is ~30-40 words; this expands to 150-200 words.
 * Uses OpenRouter API with Claude Haiku for cost efficiency.
 * 
 * Usage: node scripts/generate-product-seo-descriptions.cjs
 * 
 * Options:
 *   --dry-run    Preview without updating database
 *   --limit=N    Process only first N products
 *   --skip=N     Skip first N products (for resuming)
 */
const { MongoClient } = require('mongodb')
const fs = require('fs')
const path = require('path')

// Load .env.local
const envPath = path.resolve(__dirname, '../.env.local')
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8')
  for (const line of envContent.split('\n')) {
    const match = line.match(/^([^#=]+)=(.*)$/)
    if (match && !process.env[match[1]]) {
      process.env[match[1].trim()] = match[2].trim()
    }
  }
}

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://mroworks_db_user:SAEvhA4d4A2pzlMX@mroworks-dev.gbqxebq.mongodb.net/mroworks?retryWrites=true&w=majority&appName=mroworks-dev'
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY
const MODEL = 'anthropic/claude-3-haiku'  // Cost-efficient for bulk generation

if (!OPENROUTER_API_KEY) {
  console.error('Error: OPENROUTER_API_KEY environment variable not set')
  process.exit(1)
}

// Parse CLI args
const args = process.argv.slice(2)
const DRY_RUN = args.includes('--dry-run')
const LIMIT = parseInt(args.find(a => a.startsWith('--limit='))?.split('=')[1] || '0')
const SKIP = parseInt(args.find(a => a.startsWith('--skip='))?.split('=')[1] || '0')

async function callOpenRouter(prompt, systemPrompt) {
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
      'HTTP-Referer': 'https://mroworks.io',
      'X-Title': 'MROworks Product SEO Generator',
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt },
      ],
      temperature: 0.6,
      max_tokens: 800,
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`OpenRouter API error: ${response.status} - ${error}`)
  }

  const data = await response.json()
  return data.choices[0].message.content
}

const SYSTEM_PROMPT = `You are an expert B2B industrial product copywriter for MROworks, an MRO (Maintenance, Repair, Operations) e-commerce platform.

Write product descriptions for procurement professionals, facility managers, and operations teams.

Writing guidelines:
- Professional B2B tone, not consumer marketing
- Focus on features, applications, and technical specifications
- Mention certifications/standards when relevant (ANSI, OSHA, CE, ISO)
- Include practical use cases and industries
- Avoid fluff, superlatives, or marketing hype
- Be informative like a knowledgeable supplier

Output format: Return ONLY the paragraphs of text, no JSON, no markdown headers. Just the description text.`

async function generateProductDescription(product, categoryName) {
  // Build context from product data
  const specs = product.specifications || []
  const specsText = specs.map(s => `${s.label}: ${s.value}${s.unit ? ' ' + s.unit : ''}`).join(', ')
  
  const facets = product.facets || {}
  const materials = Array.isArray(facets.material) ? facets.material.join(', ') : ''
  const certifications = Array.isArray(facets.certification) ? facets.certification.join(', ') : ''
  
  const price = product.pricing?.basePrice
  const priceText = price ? `Starting at $${price.toFixed(2)}` : 'Contact for pricing'

  const prompt = `Write a professional product description (150-180 words, 3-4 paragraphs) for:

Product: ${product.name}
Category: ${categoryName}
SKU: ${product.sku}
Short description: ${product.shortDescription || 'N/A'}
Specifications: ${specsText || 'N/A'}
Materials: ${materials || 'N/A'}
Certifications: ${certifications || 'N/A'}
Price: ${priceText}
Lead time: ${product.leadTime || 'Contact for availability'}

Structure:
1. Opening paragraph: What it is, key features, primary applications
2. Technical details: Specifications, materials, construction quality
3. Applications/industries: Where and how it's used
4. Closing: Certifications, compliance, ordering info

Write in flowing paragraphs, no bullet points. Professional B2B industrial tone.`

  const result = await callOpenRouter(prompt, SYSTEM_PROMPT)
  return result.trim()
}

function textToRichText(text) {
  // Convert plain text to Payload richText format (Lexical)
  const paragraphs = text.split(/\n\n+/).filter(p => p.trim())
  
  return {
    root: {
      type: 'root',
      format: '',
      indent: 0,
      version: 1,
      direction: 'ltr',
      children: paragraphs.map(p => ({
        type: 'paragraph',
        format: '',
        indent: 0,
        version: 1,
        direction: 'ltr',
        textFormat: 0,
        textStyle: '',
        children: [{
          mode: 'normal',
          text: p.trim(),
          type: 'text',
          format: 0,
          style: '',
          detail: 0,
          version: 1,
        }],
      })),
    },
  }
}

function getWordCount(richText) {
  if (!richText?.root?.children) return 0
  let text = ''
  for (const child of richText.root.children) {
    if (child.children) {
      for (const c of child.children) {
        if (c.text) text += c.text + ' '
      }
    }
  }
  return text.split(/\s+/).filter(w => w).length
}

async function main() {
  console.log('=== MROworks Product SEO Description Generator ===')
  console.log(`Model: ${MODEL}`)
  console.log(`Mode: ${DRY_RUN ? 'DRY RUN (no updates)' : 'LIVE'}`)
  if (LIMIT) console.log(`Limit: ${LIMIT} products`)
  if (SKIP) console.log(`Skip: ${SKIP} products`)
  console.log('')

  const client = new MongoClient(MONGODB_URI)
  await client.connect()
  const db = client.db('mroworks')
  const productsCol = db.collection('products')
  const categoriesCol = db.collection('categories')

  // Get all categories for lookup
  const categories = await categoriesCol.find({}).toArray()
  const categoryMap = {}
  for (const cat of categories) {
    categoryMap[cat._id.toString()] = cat.name
  }

  // Get products that need enhancement (current description < 100 words)
  const query = { status: 'published' }
  const products = await productsCol.find(query)
    .sort({ _id: 1 })
    .skip(SKIP)
    .limit(LIMIT || 9999)
    .toArray()

  console.log(`Found ${products.length} products to process\n`)

  let processed = 0
  let skipped = 0
  let errors = 0
  let totalCost = 0

  for (let i = 0; i < products.length; i++) {
    const product = products[i]
    const currentWordCount = getWordCount(product.fullDescription)

    // Skip if already has good content (100+ words)
    if (currentWordCount >= 100) {
      console.log(`[${i + 1}/${products.length}] SKIP: ${product.name} (${currentWordCount} words)`)
      skipped++
      continue
    }

    const categoryId = product.primaryCategory?.toString() || ''
    const categoryName = categoryMap[categoryId] || 'Industrial Supplies'

    console.log(`[${i + 1}/${products.length}] Generating: ${product.name} (${currentWordCount} words)...`)

    try {
      const description = await generateProductDescription(product, categoryName)
      const richText = textToRichText(description)
      const newWordCount = getWordCount(richText)

      console.log(`  → Generated ${newWordCount} words`)

      if (!DRY_RUN) {
        await productsCol.updateOne(
          { _id: product._id },
          { $set: { fullDescription: richText } }
        )
        console.log(`  ✓ Updated`)
      } else {
        console.log(`  [DRY RUN] Would update`)
        // Show first 100 chars
        console.log(`  Preview: ${description.substring(0, 100)}...`)
      }

      processed++
      
      // Estimate cost: ~500 tokens input, ~300 tokens output per product
      // Haiku: $0.25/1M input, $1.25/1M output
      totalCost += (500 * 0.25 + 300 * 1.25) / 1000000

      // Rate limiting - 500ms between calls
      await new Promise(resolve => setTimeout(resolve, 500))

    } catch (error) {
      console.error(`  ✗ Error: ${error.message}`)
      errors++
      // Continue on error
    }
  }

  await client.close()

  console.log('\n=== Summary ===')
  console.log(`Processed: ${processed}`)
  console.log(`Skipped (100+ words): ${skipped}`)
  console.log(`Errors: ${errors}`)
  console.log(`Estimated API cost: $${totalCost.toFixed(4)}`)
  console.log('Done.')
}

main().catch(err => {
  console.error('Fatal error:', err)
  process.exit(1)
})
