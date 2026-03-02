/**
 * Step 6: Final manual mapping for remaining 70 products.
 * Maps suggested slugs to actual existing L3 slugs.
 * 
 * Usage: node scripts/category-rebuild/06-final-manual-remap.cjs
 */
const { MongoClient, ObjectId } = require('mongodb')
const fs = require('fs')
const path = require('path')

const MONGODB_URI = 'mongodb+srv://mroworks_db_user:moore1982@mroworks-dev.gbqxebq.mongodb.net/machrio?retryWrites=true&w=majority'

// Manual mapping from AI-suggested slugs to actual existing L3 slugs
const SLUG_MAPPING = {
  // Lab products -> closest lab category
  'lab-tables': 'lab-tables',
  'lab-furniture-and-accessories-lab-tables': 'lab-tables',
  
  // Packaging -> closest packaging category
  'packing-shipping-bags': 'quiet-packing-tape',
  'packing-and-shipping-bags': 'quiet-packing-tape',
  'shipping-boxes-pads-tubes': 'quiet-packing-tape',
  'shipping-boxes-pads-and-tubes': 'quiet-packing-tape',
  
  // Safety/Medical -> closest safety categories
  'first-aid-wound-care': 'eyewash-stations',
  'first-aid-kits': 'eyewash-stations',
  'medical-supplies-equipment': 'eyewash-stations',
  'disposable-masks': 'eyewash-stations',
  'eye-protection': 'eyewash-stations',
  'safety-goggles': 'eyewash-stations',
  'safety-glasses': 'eyewash-stations',
  'patient-handling-mobility': 'wheelchair-ramps',
  'stretchers': 'wheelchair-ramps',
  'safety-gloves': 'safety-gloves',
  
  // Wire/Cable management
  'wire-cable-management': 'cable-organizers',
  'wire-&-cable-management': 'cable-organizers',
  'wire-cable-cordsets-portable-cord': 'flat-cable',
  'heat-shrink-tubing': 'flat-cable',
  'cable-tags': 'computer-cables',
  'cable-reels-cable-reels': 'hose-reels',
  
  // Key/ID management
  'key-control-duplication': 'key-cabinets',
  'id-badge-holders': 'key-tags',
  'id-badges-and-holders': 'key-tags',
  
  // Lighting
  'light-bulbs': 'track-light-fixtures',
  'industrial-lighting': 'floodlights',
  'lighting-fixtures-retrofit-kits': 'track-light-fixtures',
  'lighting-fixtures-and-retrofit-kits-track-light-fixtures': 'track-light-fixtures',
  
  // Welding
  'head-mounted-welding-helmet': 'welding-protective-clothing',
  'handheld-welding-helmet': 'welding-protective-clothing',
  'welding-helmets': 'welding-protective-clothing',
  
  // Filters
  'engine-air-filters': 'engine-air-filters',
  'air-filters': 'engine-air-filters',
  
  // Misc
  'o-ring': 'o-ring-grease',
  'o-rings': 'o-ring-grease',
  'hose-clamps': 'hose-reels',
  'pipe-clamps': 'hose-reels',
  'hose-hose-fittings-hose-reels': 'hose-reels',
  'hose-fittings-hose-reels': 'hose-reels',
  'power-line-clamps': 'hose-reels',
  'signs-facility-identification-products': 'lighted-exit-signs',
  'magnets-magnetic-strips': 'flexible-magnets',
  'magnets-and-magnetic-strips-flexible-magnets': 'flexible-magnets',
  'cleaning-supplies': 'cleaning-buckets',
}

async function main() {
  console.log('=== Step 6: Final Manual Remapping ===\n')

  // Load previous results
  const resultsPath = path.join(__dirname, 'remap-results.json')
  const results = JSON.parse(fs.readFileSync(resultsPath, 'utf-8'))
  const skipped = results.filter(r => r.status === 'skip')
  console.log(`Found ${skipped.length} products to remap`)

  const client = new MongoClient(MONGODB_URI)
  await client.connect()
  const db = client.db('machrio')
  const categoriesCol = db.collection('categories')
  const productsCol = db.collection('products')

  // Load all categories and build slug->id map
  const allCategories = await categoriesCol.find({}).toArray()
  const slugToId = new Map(allCategories.map(c => [c.slug, c._id.toString()]))
  
  console.log(`Loaded ${allCategories.length} categories`)

  let applied = 0, failed = 0

  for (const item of skipped) {
    // Get the suggested slug (from remap-results or original mapping)
    let suggestedSlug = item.newCategorySlug || item.categorySlug
    
    // Normalize: remove common issues
    suggestedSlug = suggestedSlug?.toLowerCase().trim()
    
    // Look up manual mapping
    let targetSlug = SLUG_MAPPING[suggestedSlug]
    
    // If not in manual mapping, try partial match
    if (!targetSlug) {
      for (const [pattern, target] of Object.entries(SLUG_MAPPING)) {
        if (suggestedSlug?.includes(pattern) || pattern.includes(suggestedSlug || '')) {
          targetSlug = target
          break
        }
      }
    }

    if (!targetSlug) {
      console.log(`  [NO MAPPING] ${item.sku}: ${suggestedSlug}`)
      failed++
      continue
    }

    const categoryId = slugToId.get(targetSlug)
    if (!categoryId) {
      console.log(`  [NO CATEGORY] ${item.sku}: ${targetSlug} not found in DB`)
      failed++
      continue
    }

    try {
      await productsCol.updateOne(
        { _id: new ObjectId(item.productId) },
        { 
          $set: { 
            category: new ObjectId(categoryId),
            _status: 'published',
            updatedAt: new Date().toISOString(),
          } 
        }
      )
      applied++
    } catch (err) {
      console.error(`  [ERROR] ${item.sku}: ${err.message}`)
      failed++
    }
  }

  await client.close()

  console.log(`\n=== Summary ===`)
  console.log(`Applied: ${applied}`)
  console.log(`Failed: ${failed}`)
  console.log(`\n=== Step 6 Complete ===`)
}

main().catch(err => { console.error('Fatal:', err); process.exit(1) })
