/**
 * Step 4: AI-based product remapping to new L3 categories.
 * Uses DashScope (qwen-max) to match 1517 products to the best L3 category.
 * Processes in batches of 10 products per API call for efficiency.
 *
 * Usage: node scripts/category-rebuild/04-remap-products.cjs
 */
const { MongoClient, ObjectId } = require('mongodb')
const fs = require('fs')
const path = require('path')

const MONGODB_URI = 'mongodb+srv://mroworks_db_user:moore1982@mroworks-dev.gbqxebq.mongodb.net/machrio?retryWrites=true&w=majority'
const DASHSCOPE_API_KEY = 'sk-sp-befc667877a94f5cb8d137bf8ac57ad9'
const MODEL = 'qwen-max'
const BATCH_SIZE = 10       // products per API call
const CONCURRENCY = 3       // parallel API calls
const CONFIDENCE_THRESHOLD = 70 // auto-apply above this

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
          temperature: 0.3, // lower temp for more consistent matching
          max_tokens: 3000,
          response_format: { type: 'json_object' },
        }),
      })

      if (!response.ok) {
        const errText = await response.text()
        if (response.status === 429) {
          console.log(`    Rate limited, waiting ${5 * (attempt + 1)}s...`)
          await new Promise(r => setTimeout(r, 5000 * (attempt + 1)))
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
        await new Promise(r => setTimeout(r, 3000 * (attempt + 1)))
      } else {
        throw err
      }
    }
  }
}

const SYSTEM_PROMPT = `You are an expert MRO (Maintenance, Repair, Operations) product categorization specialist. Your task is to match industrial products to the most appropriate product category based on the product's name, SKU, and description.

Rules:
- Match each product to exactly ONE L3 category
- Use the product name and description to determine the best fit
- Consider the full category hierarchy (L1 > L2 > L3) for context
- Provide a confidence score (0-100) for each match
- If no good match exists, use the closest L2 or L1 category and give lower confidence

You MUST output valid JSON only.`

function buildCategoryReference(l3Categories) {
  // Group by L1 > L2 for readability
  const grouped = {}
  for (const cat of l3Categories) {
    const l1 = cat.l1 || 'Other'
    const l2 = cat.l2 || 'Other'
    if (!grouped[l1]) grouped[l1] = {}
    if (!grouped[l1][l2]) grouped[l1][l2] = []
    grouped[l1][l2].push({ name: cat.name, slug: cat.slug })
  }

  let ref = ''
  for (const [l1, l2Map] of Object.entries(grouped)) {
    ref += `\n## ${l1}\n`
    for (const [l2, cats] of Object.entries(l2Map)) {
      const slugs = cats.map(c => `${c.name} [${c.slug}]`).join(', ')
      ref += `  ${l2}: ${slugs}\n`
    }
  }
  return ref
}

function buildBatchPrompt(products, categoryRef) {
  const productList = products.map((p, i) =>
    `${i + 1}. "${p.name}" (SKU: ${p.sku || 'N/A'}) - ${(p.shortDescription || '').substring(0, 150)}`
  ).join('\n')

  return `Match each product below to the most appropriate L3 category.

PRODUCTS:
${productList}

AVAILABLE L3 CATEGORIES (grouped by L1 > L2):
${categoryRef}

Return JSON:
{
  "matches": [
    {"index": 1, "categorySlug": "the-l3-slug", "confidence": 85, "reason": "Brief reason"},
    ...
  ]
}

Match ALL ${products.length} products. Use the slug value in square brackets for categorySlug.`
}

async function main() {
  console.log('=== Step 4: AI Product Remapping ===\n')

  const client = new MongoClient(MONGODB_URI)
  await client.connect()
  const db = client.db('machrio')
  const categoriesCol = db.collection('categories')
  const productsCol = db.collection('products')

  // Load category metadata
  const metadataPath = path.join(__dirname, 'category-metadata.json')
  if (!fs.existsSync(metadataPath)) {
    console.error('ERROR: category-metadata.json not found. Run 02-create-categories.cjs first!')
    await client.close()
    process.exit(1)
  }
  const categoryMetadata = JSON.parse(fs.readFileSync(metadataPath, 'utf-8'))
  console.log(`Loaded ${categoryMetadata.length} L3 category definitions`)

  // Build slug -> ObjectId lookup
  const allCategories = await categoriesCol.find({}).toArray()
  const catBySlug = new Map(allCategories.map(c => [c.slug, c]))
  console.log(`${allCategories.length} categories in DB`)

  // Build category reference text for prompts
  const categoryRef = buildCategoryReference(categoryMetadata)

  // Load all draft products
  const products = await productsCol.find(
    {},
    { projection: { _id: 1, name: 1, sku: 1, shortDescription: 1 } }
  ).toArray()
  console.log(`${products.length} products to remap\n`)

  if (products.length === 0) {
    console.log('No products to remap.')
    await client.close()
    return
  }

  // Process in batches
  const allMappings = []
  const batches = []
  for (let i = 0; i < products.length; i += BATCH_SIZE) {
    batches.push(products.slice(i, i + BATCH_SIZE))
  }

  let batchIdx = 0
  let totalProcessed = 0
  let totalErrors = 0

  for (let i = 0; i < batches.length; i += CONCURRENCY) {
    const concurrentBatches = batches.slice(i, i + CONCURRENCY)

    const promises = concurrentBatches.map(async (batch) => {
      const currentBatch = ++batchIdx
      try {
        const prompt = buildBatchPrompt(batch, categoryRef)
        const result = await callDashScope(prompt, SYSTEM_PROMPT)
        const matches = result.matches || result.results || []

        for (const match of matches) {
          const idx = (match.index || match.productIndex || 1) - 1
          const product = batch[idx]
          if (!product) continue

          const cat = catBySlug.get(match.categorySlug)
          allMappings.push({
            productId: product._id.toString(),
            productName: product.name,
            sku: product.sku || '',
            categorySlug: match.categorySlug,
            categoryId: cat ? cat._id.toString() : null,
            confidence: match.confidence || 0,
            reason: match.reason || '',
          })
        }

        // Handle products that weren't in the response
        for (let j = 0; j < batch.length; j++) {
          const found = matches.some(m => ((m.index || m.productIndex || 1) - 1) === j)
          if (!found) {
            allMappings.push({
              productId: batch[j]._id.toString(),
              productName: batch[j].name,
              sku: batch[j].sku || '',
              categorySlug: null,
              categoryId: null,
              confidence: 0,
              reason: 'Not matched by AI',
            })
          }
        }

        totalProcessed += batch.length
        console.log(`  Batch ${currentBatch}/${batches.length}: ${batch.length} products matched`)
      } catch (err) {
        totalErrors += batch.length
        console.error(`  Batch ${currentBatch} ERROR: ${err.message.substring(0, 100)}`)
        // Add failed products with 0 confidence
        for (const p of batch) {
          allMappings.push({
            productId: p._id.toString(),
            productName: p.name,
            sku: p.sku || '',
            categorySlug: null,
            categoryId: null,
            confidence: 0,
            reason: `Error: ${err.message.substring(0, 50)}`,
          })
        }
      }
    })

    await Promise.all(promises)
    console.log(`--- Progress: ${totalProcessed + totalErrors}/${products.length} ---`)
  }

  // Save all mappings
  const mappingPath = path.join(__dirname, 'product-mapping-results.json')
  fs.writeFileSync(mappingPath, JSON.stringify(allMappings, null, 2))
  console.log(`\nSaved ${allMappings.length} mappings -> ${mappingPath}`)

  // Apply high-confidence mappings
  const highConf = allMappings.filter(m => m.confidence >= CONFIDENCE_THRESHOLD && m.categoryId)
  const lowConf = allMappings.filter(m => m.confidence < CONFIDENCE_THRESHOLD || !m.categoryId)

  console.log(`\nHigh confidence (>=${CONFIDENCE_THRESHOLD}%): ${highConf.length}`)
  console.log(`Low confidence (<${CONFIDENCE_THRESHOLD}%): ${lowConf.length}`)

  console.log('\nApplying high-confidence mappings...')
  let applied = 0
  for (const mapping of highConf) {
    try {
      await productsCol.updateOne(
        { _id: new ObjectId(mapping.productId) },
        {
          $set: {
            primaryCategory: new ObjectId(mapping.categoryId),
            status: 'published',
            updatedAt: new Date().toISOString(),
          }
        }
      )
      applied++
    } catch (err) {
      console.error(`  Failed to update ${mapping.sku}: ${err.message.substring(0, 60)}`)
    }
  }
  console.log(`Applied ${applied} high-confidence mappings`)

  // Save low-confidence for manual review
  if (lowConf.length > 0) {
    const lowConfPath = path.join(__dirname, 'low-confidence-mappings.json')
    fs.writeFileSync(lowConfPath, JSON.stringify(lowConf, null, 2))
    console.log(`\nLow-confidence mappings saved -> ${lowConfPath}`)
    console.log('Please review and manually assign these products.')
  }

  // Summary
  const publishedCount = await productsCol.countDocuments({ status: 'published' })
  const draftCount = await productsCol.countDocuments({ status: 'draft' })
  console.log(`\n=== Summary ===`)
  console.log(`Published products: ${publishedCount}`)
  console.log(`Draft products (need review): ${draftCount}`)
  console.log(`Avg confidence: ${(allMappings.reduce((s, m) => s + m.confidence, 0) / allMappings.length).toFixed(1)}%`)

  await client.close()
  console.log('\n=== Step 4 Complete ===')
}

main().catch(err => { console.error('Fatal:', err); process.exit(1) })
