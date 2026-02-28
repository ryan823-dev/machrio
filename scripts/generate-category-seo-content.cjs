/**
 * Generate SEO content (introContent, buyingGuide, FAQ) for all categories.
 * Uses OpenRouter API with Claude to generate professional B2B content.
 * 
 * Usage: node scripts/generate-category-seo-content.cjs
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

const MONGODB_URI = 'mongodb+srv://mroworks_db_user:SAEvhA4d4A2pzlMX@mroworks-dev.gbqxebq.mongodb.net/mroworks?retryWrites=true&w=majority&appName=mroworks-dev'
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY
const MODEL = 'anthropic/claude-3.5-sonnet'

if (!OPENROUTER_API_KEY) {
  console.error('Error: OPENROUTER_API_KEY environment variable not set')
  console.error('Check .env.local file or set environment variable')
  process.exit(1)
}

async function callOpenRouter(prompt, systemPrompt) {
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
      'HTTP-Referer': 'https://mroworks.io',
      'X-Title': 'MROworks SEO Content Generator',
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt },
      ],
      temperature: 0.7,
      max_tokens: 2000,
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`OpenRouter API error: ${response.status} - ${error}`)
  }

  const data = await response.json()
  return data.choices[0].message.content
}

const SYSTEM_PROMPT = `You are an expert B2B industrial content writer for MROworks, an industrial MRO (Maintenance, Repair, Operations) e-commerce platform. Your content is for procurement professionals, facility managers, and operations teams.

Writing style:
- Professional B2B tone, not consumer retail marketing
- Focus on selection criteria, applications, and technical considerations
- Include price context when relevant (starting from $X)
- Mention certifications/standards where applicable (ANSI, OSHA, EN, ISO)
- Avoid fluff, superlatives, or marketing hype
- Be helpful and informative, like a knowledgeable supplier sales engineer

You must output ONLY valid JSON, no markdown code blocks.`

async function generateCategoryContent(category, sampleProducts, productCount) {
  const prompt = `Generate SEO content for the "${category.name}" category on MROworks.io, an industrial MRO e-commerce platform.

Category info:
- Name: ${category.name}
- Slug: ${category.slug}
- Product count: ${productCount}
- Sample products: ${sampleProducts.slice(0, 10).map(p => p.name).join(', ')}

Generate content in this exact JSON format:
{
  "introContent": "150-200 word intro paragraph. Describe what products are in this category, key features, typical applications, and mention price range if known. Procurement-focused, not marketing fluff.",
  "buyingGuide": [
    {"type": "paragraph", "children": [{"text": "First paragraph about selection criteria..."}]},
    {"type": "paragraph", "children": [{"text": "Second paragraph about key features to consider..."}]},
    {"type": "paragraph", "children": [{"text": "Third paragraph about applications or certifications..."}]}
  ],
  "faq": [
    {"question": "Question about selection/comparison?", "answer": "2-4 sentence answer with specific details."},
    {"question": "Question about applications/use cases?", "answer": "..."},
    {"question": "Question about technical specs or certifications?", "answer": "..."},
    {"question": "Question about MOQ/pricing/ordering?", "answer": "..."},
    {"question": "Question about compatibility or alternatives?", "answer": "..."}
  ]
}

Requirements:
- introContent: 150-200 words, keyword-rich, mention price starting point if products have prices
- buyingGuide: 3-4 paragraphs in Payload richText format, 200-300 words total, technical selection guidance
- faq: 5 questions covering selection, applications, specs, ordering, compatibility
- All content in English
- Professional B2B industrial tone

Output ONLY the JSON object, no explanation or markdown.`

  const result = await callOpenRouter(prompt, SYSTEM_PROMPT)
  
  // Parse JSON from response (handle potential markdown code blocks)
  let jsonStr = result.trim()
  if (jsonStr.startsWith('```')) {
    jsonStr = jsonStr.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '')
  }
  
  return JSON.parse(jsonStr)
}

async function main() {
  console.log('=== MROworks Category SEO Content Generator ===\n')
  
  const client = new MongoClient(MONGODB_URI)
  await client.connect()
  const db = client.db('mroworks')
  const categoriesCol = db.collection('categories')
  const productsCol = db.collection('products')

  // Get all categories
  const categories = await categoriesCol.find({}).sort({ displayOrder: 1 }).toArray()
  console.log(`Found ${categories.length} categories\n`)

  let processed = 0
  let skipped = 0
  let errors = 0

  for (const category of categories) {
    // Check if already has SEO content
    if (category.introContent && category.faq && category.faq.length > 0) {
      console.log(`[SKIP] ${category.name} - already has SEO content`)
      skipped++
      continue
    }

    // Get product count and sample products
    const productCount = await productsCol.countDocuments({
      primaryCategory: category._id,
      status: 'published',
    })

    const sampleProducts = await productsCol.find(
      { primaryCategory: category._id, status: 'published' },
      { projection: { name: 1, 'pricing.basePrice': 1 } }
    ).limit(10).toArray()

    console.log(`\n[GENERATING] ${category.name} (${productCount} products)...`)

    try {
      const content = await generateCategoryContent(category, sampleProducts, productCount)
      
      // Update category with generated content
      await categoriesCol.updateOne(
        { _id: category._id },
        {
          $set: {
            introContent: content.introContent,
            buyingGuide: content.buyingGuide,
            faq: content.faq,
          },
        }
      )

      console.log(`  ✓ Generated: ${content.introContent.substring(0, 80)}...`)
      console.log(`  ✓ Buying guide: ${content.buyingGuide.length} paragraphs`)
      console.log(`  ✓ FAQ: ${content.faq.length} questions`)
      processed++

      // Rate limiting - wait 1 second between API calls
      await new Promise(resolve => setTimeout(resolve, 1000))

    } catch (error) {
      console.error(`  ✗ Error: ${error.message}`)
      errors++
    }
  }

  await client.close()

  console.log('\n=== Summary ===')
  console.log(`Processed: ${processed}`)
  console.log(`Skipped: ${skipped}`)
  console.log(`Errors: ${errors}`)
  console.log('Done.')
}

main().catch(err => {
  console.error('Fatal error:', err)
  process.exit(1)
})
