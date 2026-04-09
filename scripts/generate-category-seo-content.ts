/**
 * AI Content Generation Script for Category SEO/AEO
 * Generates intro_content, buying_guide, faq, and seo_content for all 635 categories
 * 
 * Usage: npx tsx scripts/generate-category-seo-content.ts
 */

import { Client } from 'pg'
import { generateCategoryPrompt, validateGeneratedContent, type CategoryData, type GeneratedContent } from './lib/category-content-prompts'
import { markdownToLexical, textToLexical } from './lib/lexical-converter'

// Configuration
const BATCH_SIZE = 10 // Process 10 categories at a time
const DELAY_BETWEEN_BATCHES = 3000 // 3 seconds
const DELAY_BETWEEN_REQUESTS = 1000 // 1 second between requests
const MAX_RETRIES = 3

// OpenRouter API configuration
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || ''
const OPENROUTER_ENDPOINT = 'https://openrouter.ai/api/v1/chat/completions'

if (!OPENROUTER_API_KEY) {
  console.warn('⚠️  OPENROUTER_API_KEY not set. Running in demo mode (no actual API calls)')
}

// Database connection
const client = new Client({
  connectionString: 'postgresql://postgres:sGmPTCagRVFtHszbygRzSvYTdUXgCFfH@crossover.proxy.rlwy.net:38475/railway'
})

interface CategoryRow {
  id: string
  slug: string
  name: string
  parent_id: string | null
  short_description: string | null
}

/**
 * Main execution function
 */
async function main() {
  console.log('🚀 Starting AI Content Generation for Category Pages\n')
  
  try {
    // Connect to database
    await client.connect()
    console.log('✅ Connected to PostgreSQL database\n')
    
    // Fetch all categories
    console.log('📊 Fetching categories from database...')
    const categories = await fetchAllCategories()
    console.log(`Found ${categories.length} categories\n`)
    
    // Determine category levels
    const categoriesWithLevel = await determineCategoryLevels(categories)
    
    // Process in batches
    const batches = chunk(categoriesWithLevel, BATCH_SIZE)
    console.log(`Processing ${batches.length} batches of ${BATCH_SIZE} categories each\n`)
    
    let processedCount = 0
    let successCount = 0
    let errorCount = 0
    
    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i]
      console.log(`\n📦 Processing batch ${i + 1}/${batches.length} (${batch.length} categories)`)
      
      const batchResults = await Promise.all(
        batch.map(async (category) => {
          processedCount++
          try {
            await generateContentForCategory(category)
            successCount++
            console.log(`  ✅ [${processedCount}/${categories.length}] ${category.name} (${category.slug})`)
            return { success: true, slug: category.slug }
          } catch (error) {
            errorCount++
            const errorMessage = error instanceof Error ? error.message : 'Unknown error'
            console.log(`  ❌ [${processedCount}/${categories.length}] ${category.name} (${category.slug}): ${errorMessage}`)
            return { success: false, slug: category.slug, error: errorMessage }
          }
        })
      )
      
      // Delay between batches (except for last batch)
      if (i < batches.length - 1) {
        console.log(`\n⏳ Waiting ${DELAY_BETWEEN_BATCHES / 1000}s before next batch...`)
        await delay(DELAY_BETWEEN_BATCHES)
      }
    }
    
    // Summary
    console.log('\n' + '='.repeat(60))
    console.log('📊 GENERATION SUMMARY')
    console.log('='.repeat(60))
    console.log(`Total categories: ${categories.length}`)
    console.log(`Successful: ${successCount} (${((successCount / categories.length) * 100).toFixed(1)}%)`)
    console.log(`Failed: ${errorCount} (${((errorCount / categories.length) * 100).toFixed(1)}%)`)
    console.log('='.repeat(60))
    
  } catch (error) {
    console.error('❌ Fatal error:', error instanceof Error ? error.message : error)
    process.exit(1)
  } finally {
    await client.end()
    console.log('\n✅ Database connection closed')
  }
}

/**
 * Fetch all categories from database
 */
async function fetchAllCategories(): Promise<CategoryRow[]> {
  const result = await client.query<CategoryRow>(
    'SELECT id, slug, name, parent_id, short_description FROM categories ORDER BY slug'
  )
  return result.rows
}

/**
 * Determine category level (L1/L2/L3) based on parent hierarchy
 */
async function determineCategoryLevels(categories: CategoryRow[]): Promise<(CategoryRow & { level: 'L1' | 'L2' | 'L3' })[]> {
  const categoryMap = new Map(categories.map(c => [c.id, c]))
  const result: Array<CategoryRow & { level: 'L1' | 'L2' | 'L3' }> = []
  
  for (const category of categories) {
    let level: 'L1' | 'L2' | 'L3' = 'L1'
    
    if (category.parent_id) {
      const parent = categoryMap.get(category.parent_id)
      if (parent && parent.parent_id) {
        level = 'L3' // Has grandparent
      } else {
        level = 'L2' // Has parent but no grandparent
      }
    }
    
    result.push({ ...category, level })
  }
  
  return result
}

/**
 * Generate content for a single category
 */
async function generateContentForCategory(category: CategoryRow & { level: 'L1' | 'L2' | 'L3' }) {
  // Get parent info
  let parentName: string | undefined
  let parentSlug: string | undefined
  
  if (category.parent_id) {
    const parentResult = await client.query<CategoryRow>(
      'SELECT name, slug FROM categories WHERE id = $1',
      [category.parent_id]
    )
    if (parentResult.rows[0]) {
      parentName = parentResult.rows[0].name
      parentSlug = parentResult.rows[0].slug
    }
  }
  
  // Prepare category data
  const categoryData: CategoryData = {
    slug: category.slug,
    name: category.name,
    level: category.level,
    parentName,
    parentSlug,
    existingDescription: category.short_description || undefined,
  }
  
  // Generate AI prompt
  const prompt = generateCategoryPrompt(categoryData)
  
  // Call AI API (or demo mode)
  let generatedContent: GeneratedContent
  
  if (OPENROUTER_API_KEY) {
    generatedContent = await callOpenRouter(prompt)
  } else {
    // Demo mode - generate placeholder content
    generatedContent = generateDemoContent(categoryData)
  }
  
  // Validate content
  const validation = validateGeneratedContent(generatedContent)
  if (!validation.valid) {
    console.warn(`  ⚠️  Validation issues for ${category.slug}: ${validation.issues.join(', ')}`)
    
    // Retry with refinement prompt
    if (OPENROUTER_API_KEY) {
      const refinementPrompt = `Please improve the content addressing: ${validation.issues.join(', ')}`
      generatedContent = await callOpenRouter(prompt + '\n\n' + refinementPrompt)
    }
  }
  
  // Convert to Lexical format and save to database
  await saveContentToDatabase(category.slug, generatedContent)
}

/**
 * Call OpenRouter AI API
 */
async function callOpenRouter(prompt: string, retries = 0): Promise<GeneratedContent> {
  try {
    const response = await fetch(OPENROUTER_ENDPOINT, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://machrio.com',
        'X-Title': 'Machrio Category Content Generator',
      },
      body: JSON.stringify({
        model: 'anthropic/claude-3-haiku',
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 2000,
      }),
    })
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`)
    }
    
    const data = await response.json()
    const content = data.choices[0]?.message?.content
    
    if (!content) {
      throw new Error('No content in API response')
    }
    
    // Parse JSON from response
    const jsonMatch = content.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error('No JSON found in response')
    }
    
    return JSON.parse(jsonMatch[0]) as GeneratedContent
    
  } catch (error) {
    if (retries < MAX_RETRIES) {
      console.warn(`  ⚠️  API call failed, retrying (${retries + 1}/${MAX_RETRIES})...`)
      await delay(2000 * (retries + 1)) // Exponential backoff
      return callOpenRouter(prompt, retries + 1)
    }
    throw error
  }
}

/**
 * Generate demo content (for testing without API key)
 */
function generateDemoContent(category: CategoryData): GeneratedContent {
  const { name, level } = category
  
  return {
    introContent: `[DEMO] ${name} - High-quality industrial products for professional applications. Machrio offers fast shipping, verified suppliers, and bulk discounts. Our ${name.toLowerCase()} selection meets industry standards for safety and performance.`,
    
    buyingGuide: `## How to Choose the Right ${name}\n\n### Key Selection Factors\n\n- **Application Requirements**: Consider your specific use case and operating conditions\n- **Quality Standards**: Look for industry certifications and compliance\n- **Supplier Reliability**: Choose verified suppliers with proven track records\n\n### Technical Specifications\n\nReview technical datasheets and compatibility information before purchasing. Machrio's team can assist with product selection.`,
    
    faq: [
      {
        question: `What are the lead times for ${name}?`,
        answer: 'Most items ship within 1-3 business days. Bulk orders may require additional time. Contact us for specific availability.',
      },
      {
        question: 'Do you offer bulk pricing?',
        answer: 'Yes, volume discounts are available. Request a quote for orders above standard quantities.',
      },
      {
        question: 'Are these products compliant with industry standards?',
        answer: 'We stock products that meet relevant ANSI, OSHA, and ISO standards. Check individual product specifications.',
      },
    ],
    
    seoContent: `[DEMO] Machrio supplies premium ${name.toLowerCase()} for industrial, commercial, and institutional customers. Our product range includes options for manufacturing, maintenance, and MRO applications. Browse our selection or request a quote for competitive pricing on bulk orders.`,
  }
}

/**
 * Save generated content to database
 */
async function saveContentToDatabase(slug: string, content: GeneratedContent) {
  // Convert content to Lexical format
  const introLexical = textToLexical(content.introContent)
  const buyingGuideLexical = markdownToLexical(content.buyingGuide)
  const seoContentLexical = textToLexical(content.seoContent)
  
  // Update database
  await client.query(
    `UPDATE categories 
     SET intro_content = $1, 
         buying_guide = $2, 
         faq = $3, 
         seo_content = $4 
     WHERE slug = $5`,
    [
      JSON.stringify(introLexical),
      JSON.stringify(buyingGuideLexical),
      JSON.stringify(content.faq),
      JSON.stringify(seoContentLexical),
      slug,
    ]
  )
}

/**
 * Utility: Delay execution
 */
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Utility: Split array into chunks
 */
function chunk<T>(array: T[], size: number): T[][] {
  const result: T[][] = []
  for (let i = 0; i < array.length; i += size) {
    result.push(array.slice(i, i + size))
  }
  return result
}

// Run main function
main().catch(console.error)
