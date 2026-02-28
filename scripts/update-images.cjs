/**
 * Bulk update products with cover image URLs from Excel
 */
const XLSX = require('xlsx')
const { MongoClient } = require('mongodb')

const MONGO_URI = 'mongodb+srv://mroworks_db_user:SAEvhA4d4A2pzlMX@mroworks-dev.gbqxebq.mongodb.net/mroworks?retryWrites=true&w=majority'
const path = require('path')
const EXCEL_PATH = path.resolve(__dirname, '..', '..', '产品信息2602251142.xlsx')

async function main() {
  // Read Excel
  const wb = XLSX.readFile(EXCEL_PATH)
  const ws = wb.Sheets[wb.SheetNames[0]]
  const rows = XLSX.utils.sheet_to_json(ws, { range: 0 })

  // Build a map: productName -> imageUrl
  const imageMap = new Map()
  for (const row of rows) {
    const name = row['商品名称']
    const img = row['封面图']
    if (name && img) {
      imageMap.set(name.trim(), img.trim())
    }
  }
  console.log(`Excel: ${imageMap.size} products with images`)

  // Connect to MongoDB
  const client = await MongoClient.connect(MONGO_URI)
  const db = client.db('mroworks')
  const products = db.collection('products')

  // Get all products
  const allProducts = await products.find({}, { projection: { _id: 1, name: 1 } }).toArray()
  console.log(`MongoDB: ${allProducts.length} products`)

  // Build bulk operations
  const ops = []
  let matched = 0
  for (const product of allProducts) {
    const imgUrl = imageMap.get(product.name)
    if (imgUrl) {
      matched++
      ops.push({
        updateOne: {
          filter: { _id: product._id },
          update: { $set: { externalImageUrl: imgUrl } },
        },
      })
    }
  }
  console.log(`Matched ${matched} products with images`)

  // Execute bulk
  if (ops.length > 0) {
    const batchSize = 100
    for (let i = 0; i < ops.length; i += batchSize) {
      const batch = ops.slice(i, i + batchSize)
      const result = await products.bulkWrite(batch)
      console.log(`Batch ${Math.floor(i / batchSize) + 1}: ${result.modifiedCount} updated`)
    }
  }

  // Verify
  const withImages = await products.countDocuments({ externalImageUrl: { $exists: true, $ne: null } })
  console.log(`\nDone. Products with externalImageUrl: ${withImages}`)

  await client.close()
}

main().catch(console.error)
