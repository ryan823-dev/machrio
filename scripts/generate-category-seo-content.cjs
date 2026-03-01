/**
 * Generate SEO content for categories missing content.
 * Uses DashScope (Qwen) API with JSON mode for reliable output.
 * Writes buyingGuide in Payload v3 Lexical richText format.
 * 
 * Usage: node scripts/generate-category-seo-content.cjs
 */
const { MongoClient } = require('mongodb')

const MONGODB_URI = 'mongodb+srv://mroworks_db_user:moore1982@mroworks-dev.gbqxebq.mongodb.net/machrio?retryWrites=true&w=majority'
const DASHSCOPE_API_KEY = 'sk-73c6886b82a64d00adf44d147b2dcf63'
const MODEL = 'qwen-max'
const CONCURRENCY = 5 // parallel requests

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
        await new Promise(r => setTimeout(r, 1000 * (attempt + 1)))
      } else {
        throw err
      }
    }
  }
}

const SYSTEM_PROMPT = `You are an expert B2B industrial content writer for Machrio, an industrial MRO e-commerce platform. Write for procurement professionals and facility managers.

Style: Professional B2B tone. Focus on selection criteria, applications, technical specs. Mention certifications (ANSI, OSHA, EN, ISO) where relevant. No fluff or marketing hype.

You MUST output valid JSON only.`

function buildPrompt(category, parentName, sampleProducts, productCount) {
  const parentCtx = parentName ? `\n- Parent category: ${parentName}` : ''
  const products = sampleProducts.slice(0, 8).map(p => p.name).join(', ')
  return `Generate SEO content for "${category.name}" on Machrio.com (industrial MRO platform).

Category: ${category.name} | Slug: ${category.slug}${parentCtx}
Products: ${productCount} items. Samples: ${products}

Return JSON:
{"introContent":"150-200 word intro. Products available, selection criteria, applications, price context. Procurement-focused.","buyingGuideTexts":["Para 1: selection criteria and key specs (60-80 words)","Para 2: applications, industries, scenarios (60-80 words)","Para 3: certifications, ordering tips, compatibility (60-80 words)"],"faq":[{"question":"Q about selection?","answer":"2-4 sentences."},{"question":"Q about applications?","answer":"..."},{"question":"Q about specs/certifications?","answer":"..."},{"question":"Q about ordering/MOQ?","answer":"..."},{"question":"Q about compatibility/maintenance?","answer":"..."}]}

All content in English. Specific to THIS subcategory.`
}

function toLexical(texts) {
  const children = (texts || []).map(text => ({
    children: [{ detail: 0, format: 0, mode: 'normal', style: '', text: String(text), type: 'text', version: 1 }],
    direction: 'ltr', format: '', indent: 0, type: 'paragraph', version: 1,
  }))
  return { root: { type: 'root', children, direction: 'ltr', format: '', indent: 0, version: 1 } }
}

async function processCategory(category, parentName, categoriesCol, productsCol) {
  const children = await categoriesCol.find({ parent: category._id }).toArray()
  const allIds = [category._id, ...children.map(c => c._id)]
  const productCount = await productsCol.countDocuments({ primaryCategory: { $in: allIds }, status: 'published' })
  const sampleProducts = await productsCol.find(
    { primaryCategory: { $in: allIds }, status: 'published' },
    { projection: { name: 1 } }
  ).limit(8).toArray()

  const prompt = buildPrompt(category, parentName, sampleProducts, productCount)
  const parsed = await callDashScope(prompt, SYSTEM_PROMPT)

  const bgTexts = parsed.buyingGuideTexts || parsed.buyingGuide || []
  await categoriesCol.updateOne({ _id: category._id }, {
    $set: {
      introContent: parsed.introContent,
      buyingGuide: toLexical(Array.isArray(bgTexts) ? bgTexts : [bgTexts]),
      faq: parsed.faq || [],
    },
  })

  return { name: category.name, intro: (parsed.introContent || '').length, faq: (parsed.faq || []).length }
}

async function main() {
  console.log('=== Machrio SEO Generator (DashScope qwen-max) ===\n')

  const client = new MongoClient(MONGODB_URI)
  await client.connect()
  const db = client.db('machrio')
  const categoriesCol = db.collection('categories')
  const productsCol = db.collection('products')

  const categories = await categoriesCol.find({}).sort({ displayOrder: 1 }).toArray()
  const catById = new Map()
  for (const c of categories) catById.set(c._id.toString(), c)

  // Filter to only categories needing content
  const needsContent = categories.filter(c => {
    const hasIntro = c.introContent && c.introContent.length > 10
    const hasFaq = c.faq && Array.isArray(c.faq) && c.faq.length > 0
    return !(hasIntro && hasFaq)
  })

  console.log(`Total: ${categories.length} | Already done: ${categories.length - needsContent.length} | To generate: ${needsContent.length}\n`)

  let processed = 0, errors = 0

  // Process in batches of CONCURRENCY
  for (let i = 0; i < needsContent.length; i += CONCURRENCY) {
    const batch = needsContent.slice(i, i + CONCURRENCY)
    const promises = batch.map(async (cat) => {
      let parentName = ''
      if (cat.parent) {
        const pid = cat.parent.toString()
        const p = catById.get(pid)
        if (p) parentName = p.name
      }
      try {
        const result = await processCategory(cat, parentName, categoriesCol, productsCol)
        console.log(`  [OK] ${result.name} (intro: ${result.intro}ch, faq: ${result.faq}q)`)
        processed++
      } catch (err) {
        console.error(`  [ERR] ${cat.name}: ${err.message.substring(0, 100)}`)
        errors++
      }
    })
    await Promise.all(promises)
    console.log(`--- Batch ${Math.floor(i / CONCURRENCY) + 1}/${Math.ceil(needsContent.length / CONCURRENCY)} done (${processed + errors}/${needsContent.length}) ---`)
  }

  await client.close()
  console.log(`\n=== Done: ${processed} generated, ${errors} errors ===`)
}

main().catch(err => { console.error('Fatal:', err); process.exit(1) })
