/**
 * Step 5: Re-map low-confidence products to existing L3 categories only.
 * Uses AI to find the best match from actual database categories.
 * 
 * Usage: node scripts/category-rebuild/05-remap-low-confidence.cjs
 */
const { MongoClient, ObjectId } = require('mongodb')
const fs = require('fs')
const path = require('path')

const MONGODB_URI = 'mongodb+srv://mroworks_db_user:moore1982@mroworks-dev.gbqxebq.mongodb.net/machrio?retryWrites=true&w=majority'
const DASHSCOPE_API_KEY = 'sk-sp-befc667877a94f5cb8d137bf8ac57ad9'
const MODEL = 'qwen-max'
const BATCH_SIZE = 15
const CONCURRENCY = 3

async function callDashScope(prompt, systemPrompt, retries = 2) {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await fetch('https://coding.dashscope.aliyuncs.com/v1/chat/completions', {
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
          temperature: 0.2,
          max_tokens: 4000,
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

const SYSTEM_PROMPT = `You are an industrial product categorization expert for Machrio, an MRO e-commerce platform.
Your task is to match products to the MOST APPROPRIATE category from the provided list.
You MUST only use categories from the provided list - do not invent new categories.
Output valid JSON only.`

async function main() {
  console.log('=== Step 5: Re-map Low-Confidence Products ===\n')

  // Load low-confidence mappings
  const mappingsPath = path.join(__dirname, 'low-confidence-mappings.json')
  const lowConfMappings = JSON.parse(fs.readFileSync(mappingsPath, 'utf-8'))
  console.log(`Loaded ${lowConfMappings.length} low-confidence products`)

  const client = new MongoClient(MONGODB_URI)
  await client.connect()
  const db = client.db('machrio')
  const categoriesCol = db.collection('categories')
  const productsCol = db.collection('products')

  // Load ALL L3 categories (categories that have a parent who also has a parent)
  const allCategories = await categoriesCol.find({}).toArray()
  const catById = new Map(allCategories.map(c => [c._id.toString(), c]))
  
  // Build L3 list with full path
  const l3Categories = []
  for (const cat of allCategories) {
    if (!cat.parent) continue // Skip L1
    const parent = catById.get(cat.parent.toString())
    if (!parent || !parent.parent) continue // Skip L2 (parent has no grandparent)
    
    const grandparent = catById.get(parent.parent.toString())
    if (!grandparent) continue
    
    l3Categories.push({
      id: cat._id.toString(),
      slug: cat.slug,
      name: cat.name,
      path: `${grandparent.name} > ${parent.name} > ${cat.name}`,
      l1: grandparent.name,
      l2: parent.name,
    })
  }

  console.log(`Found ${l3Categories.length} L3 categories in database`)

  // Group L3 by L1 for compact representation
  const l3ByL1 = {}
  for (const c of l3Categories) {
    if (!l3ByL1[c.l1]) l3ByL1[c.l1] = []
    l3ByL1[c.l1].push(`${c.l2}/${c.name} [${c.slug}]`)
  }

  // Build category reference string
  const categoryRef = Object.entries(l3ByL1)
    .map(([l1, items]) => `## ${l1}\n${items.join('\n')}`)
    .join('\n\n')

  // Process in batches
  const results = []
  let applied = 0, skipped = 0

  for (let i = 0; i < lowConfMappings.length; i += BATCH_SIZE * CONCURRENCY) {
    const megaBatch = lowConfMappings.slice(i, i + BATCH_SIZE * CONCURRENCY)
    const chunks = []
    for (let j = 0; j < megaBatch.length; j += BATCH_SIZE) {
      chunks.push(megaBatch.slice(j, j + BATCH_SIZE))
    }

    const promises = chunks.map(async (batch, chunkIdx) => {
      const batchResults = []
      const productList = batch.map((p, idx) => 
        `${idx + 1}. "${p.productName}" (SKU: ${p.sku})`
      ).join('\n')

      const prompt = `Match these ${batch.length} products to the BEST L3 category from the list below.

PRODUCTS:
${productList}

AVAILABLE L3 CATEGORIES (format: L2/L3 [slug]):
${categoryRef}

Return JSON:
{
  "matches": [
    {"idx": 1, "slug": "exact-slug-from-list", "confidence": 70-100},
    ...
  ]
}

Rules:
- Use ONLY slugs from the provided list
- If no good match exists, pick the closest reasonable category
- Confidence 90+: perfect match, 70-89: reasonable match, <70: forced match`

      try {
        const response = await callDashScope(prompt, SYSTEM_PROMPT)
        const matches = response.matches || []

        for (const match of matches) {
          const originalProduct = batch[match.idx - 1]
          if (!originalProduct) continue

          const targetCat = l3Categories.find(c => c.slug === match.slug)
          if (!targetCat) {
            console.log(`    [SKIP] ${originalProduct.sku}: slug "${match.slug}" not found`)
            batchResults.push({ ...originalProduct, status: 'skip', reason: 'slug not found' })
            continue
          }

          batchResults.push({
            productId: originalProduct.productId,
            sku: originalProduct.sku,
            productName: originalProduct.productName,
            newCategoryId: targetCat.id,
            newCategorySlug: targetCat.slug,
            newCategoryPath: targetCat.path,
            confidence: match.confidence,
            status: 'matched',
          })
        }
      } catch (err) {
        console.error(`    Batch error: ${err.message.substring(0, 100)}`)
        for (const p of batch) {
          batchResults.push({ ...p, status: 'error', reason: err.message })
        }
      }

      return batchResults
    })

    const chunkResults = await Promise.all(promises)
    for (const cr of chunkResults) {
      results.push(...cr)
    }

    const done = Math.min(i + BATCH_SIZE * CONCURRENCY, lowConfMappings.length)
    console.log(`--- Progress: ${done}/${lowConfMappings.length} ---`)
  }

  // Apply mappings
  console.log('\nApplying mappings...')
  for (const r of results) {
    if (r.status !== 'matched') {
      skipped++
      continue
    }

    try {
      await productsCol.updateOne(
        { _id: new ObjectId(r.productId) },
        { 
          $set: { 
            category: new ObjectId(r.newCategoryId),
            _status: 'published',
            updatedAt: new Date().toISOString(),
          } 
        }
      )
      applied++
    } catch (err) {
      console.error(`  Failed to update ${r.sku}: ${err.message}`)
      skipped++
    }
  }

  // Save results
  const resultsPath = path.join(__dirname, 'remap-results.json')
  fs.writeFileSync(resultsPath, JSON.stringify(results, null, 2))
  console.log(`\nSaved results -> ${resultsPath}`)

  await client.close()

  console.log(`\n=== Summary ===`)
  console.log(`Applied: ${applied}`)
  console.log(`Skipped: ${skipped}`)
  console.log(`\n=== Step 5 Complete ===`)
}

main().catch(err => { console.error('Fatal:', err); process.exit(1) })
