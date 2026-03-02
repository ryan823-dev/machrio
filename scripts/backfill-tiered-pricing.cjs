/**
 * Backfill Tiered Pricing for Existing Products
 * 
 * Generates 3-tier volume pricing for all products that have a basePrice
 * but no tieredPricing data.
 * 
 * Tiers: 1-9 (base), 10-49 (-5%), 50+ (-10%)
 * 
 * Usage: node scripts/backfill-tiered-pricing.cjs
 */

const { MongoClient } = require('mongodb')

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://mroworks_db_user:moore1982@mroworks-dev.gbqxebq.mongodb.net/machrio'

function generateTiers(basePrice) {
  return [
    { minQty: 1, maxQty: 9, unitPrice: Math.round(basePrice * 100) / 100 },
    { minQty: 10, maxQty: 49, unitPrice: Math.round(basePrice * 0.95 * 100) / 100 },
    { minQty: 50, unitPrice: Math.round(basePrice * 0.90 * 100) / 100 },
  ]
}

async function main() {
  console.log('=== Backfill Tiered Pricing ===\n')

  const client = await MongoClient.connect(MONGODB_URI)
  const db = client.db('machrio')
  const collection = db.collection('products')

  // Find products with basePrice but no tieredPricing
  const query = {
    'pricing.basePrice': { $gt: 0 },
    $or: [
      { 'pricing.tieredPricing': { $exists: false } },
      { 'pricing.tieredPricing': null },
      { 'pricing.tieredPricing': { $size: 0 } },
    ],
  }

  const count = await collection.countDocuments(query)
  console.log(`Found ${count} products needing tiered pricing\n`)

  if (count === 0) {
    console.log('Nothing to do.')
    await client.close()
    return
  }

  // Build bulk operations
  const cursor = collection.find(query, { projection: { _id: 1, name: 1, 'pricing.basePrice': 1 } })
  const ops = []
  let processed = 0

  for await (const product of cursor) {
    const basePrice = product.pricing.basePrice
    const tiers = generateTiers(basePrice)

    ops.push({
      updateOne: {
        filter: { _id: product._id },
        update: { $set: { 'pricing.tieredPricing': tiers } },
      },
    })

    processed++
    if (processed <= 5) {
      console.log(`  ${product.name.substring(0, 60)}...`)
      console.log(`    $${basePrice} -> Tiers: $${tiers[0].unitPrice} / $${tiers[1].unitPrice} / $${tiers[2].unitPrice}`)
    }
  }

  if (processed > 5) {
    console.log(`  ... and ${processed - 5} more\n`)
  }

  // Execute bulk write in batches
  const BATCH_SIZE = 500
  let totalModified = 0

  for (let i = 0; i < ops.length; i += BATCH_SIZE) {
    const batch = ops.slice(i, i + BATCH_SIZE)
    const result = await collection.bulkWrite(batch)
    totalModified += result.modifiedCount
    console.log(`Batch ${Math.floor(i / BATCH_SIZE) + 1}: ${result.modifiedCount} updated`)
  }

  console.log(`\n=== Done! ${totalModified} products updated ===`)

  // Verify
  const remaining = await collection.countDocuments(query)
  console.log(`Remaining without tiered pricing: ${remaining}`)

  await client.close()
}

main().catch(console.error)
