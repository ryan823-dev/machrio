/**
 * Update product weights from the original xlsx data.
 * Matches products by name (商品名称 in xlsx = name in Payload).
 * The 17 MRO-prefix seed products not in xlsx keep their default 0.5 kg.
 * Usage: node scripts/update-product-weights.cjs
 */
const XLSX = require('xlsx')
const { MongoClient } = require('mongodb')
const path = require('path')

const MONGODB_URI = 'mongodb+srv://mroworks_db_user:SAEvhA4d4A2pzlMX@mroworks-dev.gbqxebq.mongodb.net/mroworks?retryWrites=true&w=majority&appName=mroworks-dev'
const XLSX_PATH = path.resolve(__dirname, '../../产品信息2602251142.xlsx')

async function main() {
  // 1. Read xlsx weight data, keyed by product name
  const wb = XLSX.readFile(XLSX_PATH)
  const ws = wb.Sheets['商品(英文)']
  const rows = XLSX.utils.sheet_to_json(ws)

  const weightMap = new Map()
  for (const row of rows) {
    const name = (row['商品名称'] || '').trim()
    const weight = parseFloat(row['重量'])
    if (name && !isNaN(weight) && weight > 0) {
      weightMap.set(name, weight)
    }
  }
  console.log(`Loaded ${weightMap.size} products with weight data from xlsx`)

  // 2. Connect to MongoDB
  const client = new MongoClient(MONGODB_URI)
  await client.connect()
  const db = client.db('mroworks')
  const collection = db.collection('products')

  // 3. Get all products
  const products = await collection.find({}, { projection: { name: 1, sku: 1, 'shippingInfo.weight': 1 } }).toArray()
  console.log(`Found ${products.length} products in database`)

  // 4. Update weights
  let updated = 0
  let notFound = 0
  let alreadyCorrect = 0

  for (const product of products) {
    const name = (product.name || '').trim()
    if (!name) continue

    const xlsxWeight = weightMap.get(name)
    if (xlsxWeight === undefined) {
      notFound++
      continue
    }

    const currentWeight = product.shippingInfo?.weight
    if (currentWeight === xlsxWeight) {
      alreadyCorrect++
      continue
    }

    await collection.updateOne(
      { _id: product._id },
      { $set: { 'shippingInfo.weight': xlsxWeight } }
    )
    updated++
  }

  console.log(`\nResults:`)
  console.log(`  Updated:         ${updated}`)
  console.log(`  Already correct: ${alreadyCorrect}`)
  console.log(`  Not in xlsx:     ${notFound} (seed products, keep default 0.5 kg)`)
  console.log(`  Total processed: ${products.length}`)

  // 5. Verify - show weight distribution
  const pipeline = [
    { $group: { _id: '$shippingInfo.weight', count: { $sum: 1 } } },
    { $sort: { _id: 1 } }
  ]
  const distribution = await collection.aggregate(pipeline).toArray()
  console.log(`\nWeight distribution after update:`)
  for (const d of distribution) {
    console.log(`  ${d._id} kg: ${d.count} products`)
  }

  // 6. Show sample of updated products
  const sample = await collection.find(
    { 'shippingInfo.weight': { $ne: 0.5 } },
    { projection: { sku: 1, name: 1, 'shippingInfo.weight': 1 } }
  ).limit(5).toArray()
  console.log(`\nSample updated products:`)
  for (const p of sample) {
    console.log(`  ${p.sku}: ${p.shippingInfo?.weight} kg - ${(p.name || '').substring(0, 50)}`)
  }

  await client.close()
  console.log('\nDone.')
}

main().catch(err => {
  console.error('Error:', err)
  process.exit(1)
})
