/**
 * Step 1: Backup existing categories & product mappings, then clean categories.
 * Sets all products to draft status during migration.
 *
 * Usage: node scripts/category-rebuild/01-backup-and-clean.cjs
 */
const { MongoClient, ObjectId } = require('mongodb')
const fs = require('fs')
const path = require('path')

const MONGODB_URI = 'mongodb+srv://mroworks_db_user:moore1982@mroworks-dev.gbqxebq.mongodb.net/machrio?retryWrites=true&w=majority'

async function main() {
  console.log('=== Step 1: Backup & Clean ===\n')

  const client = new MongoClient(MONGODB_URI)
  await client.connect()
  const db = client.db('machrio')
  const categoriesCol = db.collection('categories')
  const productsCol = db.collection('products')

  const timestamp = Date.now()
  const backupDir = path.join(__dirname, 'backup')
  if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir, { recursive: true })

  // 1. Backup all categories
  console.log('1. Backing up categories...')
  const allCategories = await categoriesCol.find({}).toArray()
  const catBackupPath = path.join(backupDir, `categories-${timestamp}.json`)
  fs.writeFileSync(catBackupPath, JSON.stringify(allCategories, null, 2))
  console.log(`   Saved ${allCategories.length} categories -> ${catBackupPath}`)

  // Build category lookup for slug resolution
  const catById = new Map()
  for (const c of allCategories) {
    catById.set(c._id.toString(), c)
  }

  // 2. Backup product-category mappings
  console.log('2. Backing up product-category mappings...')
  const allProducts = await productsCol.find({}, {
    projection: { _id: 1, sku: 1, name: 1, primaryCategory: 1, categories: 1, status: 1 }
  }).toArray()

  const productMappings = allProducts.map(p => {
    let primaryCategorySlug = null
    let primaryCategoryName = null
    if (p.primaryCategory) {
      const catId = typeof p.primaryCategory === 'object' && p.primaryCategory._id
        ? p.primaryCategory._id.toString()
        : p.primaryCategory.toString()
      const cat = catById.get(catId)
      if (cat) {
        primaryCategorySlug = cat.slug
        primaryCategoryName = cat.name
      }
    }

    let additionalCategories = []
    if (Array.isArray(p.categories)) {
      additionalCategories = p.categories.map(c => {
        const cid = typeof c === 'object' && c._id ? c._id.toString() : c.toString()
        const cat = catById.get(cid)
        return cat ? { slug: cat.slug, name: cat.name } : { id: cid }
      })
    }

    return {
      id: p._id.toString(),
      sku: p.sku || '',
      name: p.name || '',
      status: p.status || 'draft',
      primaryCategoryId: p.primaryCategory ? p.primaryCategory.toString() : null,
      primaryCategorySlug,
      primaryCategoryName,
      additionalCategories,
    }
  })

  const mappingPath = path.join(backupDir, `product-mappings-${timestamp}.json`)
  fs.writeFileSync(mappingPath, JSON.stringify(productMappings, null, 2))
  console.log(`   Saved ${productMappings.length} product mappings -> ${mappingPath}`)

  // 3. Set all products to draft
  console.log('3. Setting all products to draft...')
  const draftResult = await productsCol.updateMany(
    {},
    { $set: { status: 'draft' } }
  )
  console.log(`   Updated ${draftResult.modifiedCount} products to draft`)

  // 4. Clear primaryCategory and categories references on products
  // (to avoid broken references after category deletion)
  console.log('4. Clearing product category references...')
  const clearResult = await productsCol.updateMany(
    {},
    { $unset: { primaryCategory: '', categories: '' } }
  )
  console.log(`   Cleared category refs on ${clearResult.modifiedCount} products`)

  // 5. Delete all categories
  console.log('5. Deleting all categories...')
  const deleteResult = await categoriesCol.deleteMany({})
  console.log(`   Deleted ${deleteResult.deletedCount} categories`)

  // 6. Verify
  const remainingCats = await categoriesCol.countDocuments({})
  const draftProducts = await productsCol.countDocuments({ status: 'draft' })
  console.log(`\n=== Verification ===`)
  console.log(`Categories remaining: ${remainingCats} (should be 0)`)
  console.log(`Products in draft: ${draftProducts}`)
  console.log(`\nBackup files:`)
  console.log(`  ${catBackupPath}`)
  console.log(`  ${mappingPath}`)

  await client.close()
  console.log('\n=== Step 1 Complete ===')
}

main().catch(err => { console.error('Fatal:', err); process.exit(1) })
