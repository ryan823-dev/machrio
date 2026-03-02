/**
 * Step 3: Generate SEO content for all categories using DashScope (qwen-max).
 * Generates: introContent, shortDescription, buyingGuide, seoContent, faq, metaTitle, metaDescription
 *
 * Usage: node scripts/category-rebuild/03-generate-seo-content.cjs
 */
const { MongoClient } = require('mongodb')
const fs = require('fs')
const path = require('path')

const MONGODB_URI = 'mongodb+srv://mroworks_db_user:moore1982@mroworks-dev.gbqxebq.mongodb.net/machrio?retryWrites=true&w=majority'
const DASHSCOPE_API_KEY = 'sk-73c6886b82a64d00adf44d147b2dcf63'
const MODEL = 'qwen-max'
const CONCURRENCY = 5

async function callDashScope(prompt, systemPrompt, retries = 2) {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await fetch('https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${DASHSCOPE_API_KEY}`,
        },
        body: JSON.stringify({
          model: MODEL,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: prompt },
          ],
          temperature: 0.7,
          max_tokens: 2000,
          response_format: { type: 'json_object' },
        }),
      })

      if (!response.ok) {
        const errText = await response.text()
        if (response.status === 429) {
          console.log(`    Rate limited, waiting ${3 * (attempt + 1)}s...`)
          await new Promise(r => setTimeout(r, 3000 * (attempt + 1)))
          continue
        }
        throw new Error(`API ${response.status}: ${errText.substring(0, 200)}`)
      }

      const data = await response.json()
      const content = data.choices[0].message.content.trim()
      return JSON.parse(content)
    } catch (err) {
      if (attempt < retries) {
        console.log(`    Retry ${attempt + 1}/${retries}: ${err.message.substring(0, 80)}`)
        await new Promise(r => setTimeout(r, 2000 * (attempt + 1)))
      } else {
        throw err
      }
    }
  }
}

const SYSTEM_PROMPT = `You are an expert B2B industrial content writer for Machrio, an industrial MRO (Maintenance, Repair, Operations) e-commerce platform. Write for procurement professionals and facility managers.

Style: Professional B2B tone. Focus on selection criteria, applications, technical specs. Mention relevant certifications (ANSI, OSHA, EN, ISO) where applicable. No fluff or marketing hype. Content must be SEO-optimized.

You MUST output valid JSON only.`

function buildPromptForL3(cat, l1Name, l2Name, metadata) {
  return `Generate SEO content for "${cat.name}" on Machrio.com (industrial MRO e-commerce platform).

Category path: ${l1Name} > ${l2Name} > ${cat.name}
Slug: ${cat.slug}
Category Type: ${metadata?.categoryType || 'N/A'}
Target Keyword: "${cat.name}" | Search Volume: ${metadata?.searchVolume || 'N/A'} | KD: ${metadata?.kd || 'N/A'}

Return JSON with ALL these fields:
{
  "introContent": "150-200 word intro paragraph. Describe what products are available, who needs them, key selection criteria, and typical price range context. Write for B2B procurement professionals.",
  "shortDescription": "Under 155 characters. Concise value prop for cards and meta description.",
  "buyingGuideTexts": ["Para 1: Key selection criteria and important specs to consider (60-80 words)", "Para 2: Common applications, industries, and use scenarios (60-80 words)", "Para 3: Certifications to look for, ordering tips, compatibility notes (60-80 words)"],
  "seoContentTexts": ["Para 1: Industry context, why this category matters in MRO (60-80 words)", "Para 2: Technology trends or maintenance best practices (60-80 words)"],
  "faq": [
    {"question": "What are the key factors when selecting ${cat.name}?", "answer": "2-4 sentences with specific details."},
    {"question": "What industries commonly use ${cat.name}?", "answer": "2-4 sentences."},
    {"question": "What certifications should I look for?", "answer": "2-4 sentences."},
    {"question": "What is the typical lead time for ${cat.name}?", "answer": "2-4 sentences."},
    {"question": "Can I get bulk pricing for ${cat.name}?", "answer": "2-4 sentences about Machrio's bulk/RFQ options."}
  ],
  "metaTitle": "Under 60 chars. Format: ${cat.name} | Category | Machrio",
  "metaDescription": "Under 155 chars. Include primary keyword and value prop."
}

All content in English. Be specific to THIS subcategory, not generic.`
}

function buildPromptForL1L2(cat, parentName) {
  const level = parentName ? 'L2 subcategory' : 'top-level L1 category'
  const pathStr = parentName ? `${parentName} > ${cat.name}` : cat.name
  return `Generate SEO content for "${cat.name}" (${level}) on Machrio.com (industrial MRO platform).

Category path: ${pathStr}
Slug: ${cat.slug}

Return JSON:
{
  "introContent": "100-150 word intro. Overview of this category's product range and who it serves.",
  "shortDescription": "Under 155 characters for cards and meta.",
  "buyingGuideTexts": ["Para 1: Overview of selection criteria (50-70 words)", "Para 2: Key applications and industries (50-70 words)"],
  "seoContentTexts": ["Para 1: Why this category matters for MRO buyers (50-70 words)"],
  "faq": [
    {"question": "What types of products are in ${cat.name}?", "answer": "2-3 sentences."},
    {"question": "How do I choose the right ${cat.name} products?", "answer": "2-3 sentences."},
    {"question": "Does Machrio offer bulk pricing for ${cat.name}?", "answer": "2-3 sentences."}
  ],
  "metaTitle": "Under 60 chars. Format: ${cat.name} | Machrio Industrial Supplies",
  "metaDescription": "Under 155 chars."
}

All content in English.`
}

function toLexical(texts) {
  const children = (Array.isArray(texts) ? texts : [texts]).filter(Boolean).map(text => ({
    children: [{ detail: 0, format: 0, mode: 'normal', style: '', text: String(text), type: 'text', version: 1 }],
    direction: 'ltr', format: '', indent: 0, type: 'paragraph', version: 1, textFormat: 0, textStyle: '',
  }))
  return { root: { type: 'root', children, direction: 'ltr', format: '', indent: 0, version: 1 } }
}

async function processCategory(cat, parentName, l1Name, metadata, categoriesCol) {
  const isL3 = !!metadata
  const prompt = isL3
    ? buildPromptForL3(cat, l1Name, parentName, metadata)
    : buildPromptForL1L2(cat, parentName)

  const parsed = await callDashScope(prompt, SYSTEM_PROMPT)

  const bgTexts = parsed.buyingGuideTexts || parsed.buyingGuide || []
  const seoTexts = parsed.seoContentTexts || parsed.seoContent || []

  const updateData = {
    introContent: parsed.introContent || '',
    shortDescription: (parsed.shortDescription || '').substring(0, 160),
    buyingGuide: toLexical(Array.isArray(bgTexts) ? bgTexts : [bgTexts]),
    seoContent: toLexical(Array.isArray(seoTexts) ? seoTexts : [seoTexts]),
    faq: (parsed.faq || []).slice(0, 6).map(f => ({
      question: f.question || '',
      answer: f.answer || '',
    })),
    seo: {
      metaTitle: (parsed.metaTitle || `${cat.name} | Machrio`).substring(0, 60),
      metaDescription: (parsed.metaDescription || parsed.shortDescription || '').substring(0, 160),
    },
    updatedAt: new Date().toISOString(),
  }

  await categoriesCol.updateOne({ _id: cat._id }, { $set: updateData })

  return {
    name: cat.name,
    intro: (updateData.introContent || '').length,
    faq: updateData.faq.length,
  }
}

async function main() {
  console.log('=== Step 3: Generate SEO Content (DashScope qwen-max) ===\n')

  // Load metadata
  const metadataPath = path.join(__dirname, 'category-metadata.json')
  let categoryMetadata = []
  if (fs.existsSync(metadataPath)) {
    categoryMetadata = JSON.parse(fs.readFileSync(metadataPath, 'utf-8'))
    console.log(`Loaded metadata for ${categoryMetadata.length} L3 categories`)
  }
  const metaBySlug = new Map(categoryMetadata.map(m => [m.slug, m]))

  const client = new MongoClient(MONGODB_URI)
  await client.connect()
  const db = client.db('machrio')
  const categoriesCol = db.collection('categories')

  // Load all categories
  const allCategories = await categoriesCol.find({}).toArray()
  const catById = new Map(allCategories.map(c => [c._id.toString(), c]))

  console.log(`Total categories in DB: ${allCategories.length}`)

  // Filter categories that need content (no introContent or no faq)
  const needsContent = allCategories.filter(c => {
    const hasIntro = c.introContent && c.introContent.length > 20
    const hasFaq = c.faq && Array.isArray(c.faq) && c.faq.length >= 3
    return !(hasIntro && hasFaq)
  })

  console.log(`Already done: ${allCategories.length - needsContent.length} | To generate: ${needsContent.length}\n`)

  let processed = 0, errors = 0
  const failedIds = []

  // Process in batches
  for (let i = 0; i < needsContent.length; i += CONCURRENCY) {
    const batch = needsContent.slice(i, i + CONCURRENCY)
    const promises = batch.map(async (cat) => {
      // Resolve parent info
      let parentName = ''
      let l1Name = ''
      if (cat.parent) {
        const parent = catById.get(cat.parent.toString())
        if (parent) {
          parentName = parent.name
          // Check if parent has a parent (making this L3)
          if (parent.parent) {
            const grandparent = catById.get(parent.parent.toString())
            if (grandparent) l1Name = grandparent.name
          }
        }
      }

      const metadata = metaBySlug.get(cat.slug) || null

      try {
        const result = await processCategory(cat, parentName, l1Name, metadata, categoriesCol)
        console.log(`  [OK] ${result.name} (intro: ${result.intro}ch, faq: ${result.faq}q)`)
        processed++
      } catch (err) {
        console.error(`  [ERR] ${cat.name}: ${err.message.substring(0, 100)}`)
        failedIds.push(cat._id.toString())
        errors++
      }
    })

    await Promise.all(promises)
    const batchNum = Math.floor(i / CONCURRENCY) + 1
    const totalBatches = Math.ceil(needsContent.length / CONCURRENCY)
    console.log(`--- Batch ${batchNum}/${totalBatches} (${processed + errors}/${needsContent.length}) ---`)
  }

  // Save failed IDs for retry
  if (failedIds.length > 0) {
    const failedPath = path.join(__dirname, 'failed-seo-generation.json')
    fs.writeFileSync(failedPath, JSON.stringify(failedIds, null, 2))
    console.log(`\nFailed IDs saved -> ${failedPath}`)
  }

  await client.close()
  console.log(`\n=== Step 3 Complete: ${processed} generated, ${errors} errors ===`)
}

main().catch(err => { console.error('Fatal:', err); process.exit(1) })
