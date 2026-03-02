/**
 * Product Import Script v2 for Machrio
 * Reads standardized Excel template and imports to Payload CMS
 * 
 * Template format: Machrio_Import_Template.xlsx
 * Columns: SKU, Name, L1-L3 Category, Descriptions, Images, Price, Specs, SEO
 * 
 * Usage: node scripts/import-products-v2.cjs <path-to-excel>
 */
const XLSX = require('xlsx')
const { MongoClient, ObjectId } = require('mongodb')
const path = require('path')
const fs = require('fs')

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://mroworks_db_user:moore1982@mroworks-dev.gbqxebq.mongodb.net/machrio?retryWrites=true&w=majority'

// Column mapping from template headers to internal keys
const COLUMN_MAP = {
  'SKU': 'sku',
  'Name': 'name',
  'L1 Category': 'l1Category',
  'L2 Category': 'l2Category',
  'L3 Category': 'l3Category',
  'Short Description': 'shortDescription',
  'Full Description': 'fullDescription',
  'Primary Image URL': 'primaryImage',
  'Additional Images': 'additionalImages',
  'Price (USD)': 'price',
  'Min Order Qty': 'minOrderQty',
  'Package Qty': 'packageQty',
  'Package Unit': 'packageUnit',
  'Lead Time': 'leadTime',
  'Availability': 'availability',
  'Status': 'status',
  'Purchase Mode': 'purchaseMode',
  'Meta Title': 'metaTitle',
  'Meta Description': 'metaDescription',
}

// Spec column patterns
const SPEC_PATTERN = /^Spec (\d+) (Name|Value)$/

/**
 * Generate URL-friendly slug from name
 */
function generateSlug(name, sku) {
  const baseSlug = name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .substring(0, 80)
  return `${baseSlug}-${sku.toLowerCase().replace(/[^a-z0-9]/g, '')}`
}

/**
 * Parse package quantity from product name if not provided
 * E.g., "Safety Gloves, Pkg Qty 12" -> 12
 */
function parsePackageQty(name, explicitQty) {
  if (explicitQty && !isNaN(parseInt(explicitQty))) {
    return parseInt(explicitQty)
  }
  
  const patterns = [
    /Pkg\s*Qty\s*(\d+)/i,
    /Pack\s*of\s*(\d+)/i,
    /(\d+)\s*(?:pcs|pieces|pairs?|units?)\s*(?:per\s*pack)?/i,
  ]
  
  for (const pattern of patterns) {
    const match = name.match(pattern)
    if (match) return parseInt(match[1])
  }
  
  return 1
}

/**
 * Map availability string to enum value
 */
function mapAvailability(value) {
  if (!value) return 'in-stock'
  const v = value.toLowerCase().trim()
  if (v.includes('made to order') || v.includes('custom')) return 'made-to-order'
  if (v.includes('pre-order') || v.includes('preorder')) return 'pre-order'
  if (v.includes('out') || v.includes('unavailable')) return 'out-of-stock'
  return 'in-stock'
}

/**
 * Map status string to enum value
 */
function mapStatus(value) {
  if (!value) return 'draft'
  const v = value.toLowerCase().trim()
  if (v === 'active' || v === 'published') return 'published'
  return 'draft'
}

/**
 * Map purchase mode string to enum value
 */
function mapPurchaseMode(value) {
  if (!value) return 'both'
  const v = value.toLowerCase().trim()
  if (v.includes('rfq only')) return 'rfq-only'
  if (v.includes('buy online') && !v.includes('rfq')) return 'buy-online'
  return 'both'
}

/**
 * Read Excel file and parse products
 */
function readExcel(filePath) {
  console.log('Reading Excel file:', filePath)
  const workbook = XLSX.readFile(filePath)
  
  // Try to find Products sheet
  const sheetName = workbook.SheetNames.find(n => 
    n.toLowerCase().includes('product')
  ) || workbook.SheetNames[0]
  
  console.log('Using sheet:', sheetName)
  const sheet = workbook.Sheets[sheetName]
  const rawData = XLSX.utils.sheet_to_json(sheet, { defval: '' })
  
  console.log(`Found ${rawData.length} rows`)
  return rawData
}

/**
 * Transform raw row to product object
 */
function transformRow(row) {
  const product = {}
  const specs = []
  
  // Map standard columns
  for (const [header, value] of Object.entries(row)) {
    // Check if it's a mapped column
    if (COLUMN_MAP[header]) {
      product[COLUMN_MAP[header]] = value
      continue
    }
    
    // Check if it's a spec column
    const specMatch = header.match(SPEC_PATTERN)
    if (specMatch) {
      const specNum = parseInt(specMatch[1])
      const specType = specMatch[2] // 'Name' or 'Value'
      
      if (!specs[specNum - 1]) specs[specNum - 1] = {}
      if (specType === 'Name') specs[specNum - 1].label = value
      if (specType === 'Value') specs[specNum - 1].value = value
    }
  }
  
  // Filter out empty specs
  product.specifications = specs.filter(s => s && s.label && s.value)
  
  return product
}

/**
 * Build final product document for MongoDB
 */
function buildProductDoc(product, categoryId) {
  const price = parseFloat(product.price) || null
  const packageQty = parsePackageQty(product.name, product.packageQty)
  
  // Parse additional images
  let additionalImages = []
  if (product.additionalImages) {
    additionalImages = product.additionalImages
      .split(',')
      .map(url => url.trim())
      .filter(url => url.length > 0)
  }
  
  return {
    name: product.name,
    slug: generateSlug(product.name, product.sku),
    sku: product.sku,
    _status: mapStatus(product.status),
    category: categoryId ? new ObjectId(categoryId) : null,
    shortDescription: product.shortDescription || '',
    fullDescription: product.fullDescription || '',
    primaryImage: product.primaryImage || null,
    additionalImages: additionalImages,
    purchaseMode: mapPurchaseMode(product.purchaseMode),
    pricing: price ? {
      basePrice: price,
      currency: 'USD',
      priceUnit: (product.packageUnit || 'each').toLowerCase(),
      tieredPricing: [
        { minQty: 1, maxQty: 9, unitPrice: price },
        { minQty: 10, maxQty: 49, unitPrice: Math.round(price * 0.95 * 100) / 100 },
        { minQty: 50, unitPrice: Math.round(price * 0.90 * 100) / 100 },
      ],
    } : null,
    availability: mapAvailability(product.availability),
    minOrderQuantity: parseInt(product.minOrderQty) || 1,
    packageQty: packageQty,
    leadTime: product.leadTime || '2-3 weeks',
    specifications: product.specifications || [],
    seo: {
      metaTitle: product.metaTitle || `${product.name} | Machrio`,
      metaDescription: product.metaDescription || product.shortDescription?.substring(0, 160) || '',
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
}

/**
 * Main import function
 */
async function main() {
  const args = process.argv.slice(2)
  if (args.length === 0) {
    console.log('Usage: node scripts/import-products-v2.cjs <path-to-excel>')
    console.log('Example: node scripts/import-products-v2.cjs ./Machrio_Import_Template.xlsx')
    process.exit(1)
  }
  
  const excelPath = path.resolve(args[0])
  if (!fs.existsSync(excelPath)) {
    console.error('File not found:', excelPath)
    process.exit(1)
  }
  
  console.log('=== Machrio Product Import v2 ===\n')
  
  // Read Excel
  const rawData = readExcel(excelPath)
  
  // Skip header row if it looks like instructions
  const dataRows = rawData.filter(row => {
    const sku = row['SKU'] || ''
    return sku && !sku.toLowerCase().includes('unique id')
  })
  
  console.log(`Processing ${dataRows.length} products\n`)
  
  // Connect to MongoDB
  const client = new MongoClient(MONGODB_URI)
  await client.connect()
  const db = client.db('machrio')
  const categoriesCol = db.collection('categories')
  const productsCol = db.collection('products')
  
  // Load all categories for lookup
  const allCategories = await categoriesCol.find({}).toArray()
  const catBySlug = new Map(allCategories.map(c => [c.slug, c]))
  const catByName = new Map(allCategories.map(c => [c.name.toLowerCase(), c]))
  
  // Build category path lookup (L1 > L2 > L3 -> category ID)
  const catById = new Map(allCategories.map(c => [c._id.toString(), c]))
  const l3Categories = allCategories.filter(c => {
    if (!c.parent) return false
    const parent = catById.get(c.parent.toString())
    return parent && parent.parent
  })
  
  // Create path lookup: "L1|L2|L3" -> category
  const pathToCategory = new Map()
  for (const l3 of l3Categories) {
    const l2 = catById.get(l3.parent.toString())
    const l1 = catById.get(l2.parent.toString())
    const pathKey = `${l1.name.toLowerCase()}|${l2.name.toLowerCase()}|${l3.name.toLowerCase()}`
    pathToCategory.set(pathKey, l3)
  }
  
  console.log(`Loaded ${allCategories.length} categories (${l3Categories.length} L3)\n`)
  
  // Transform products
  const products = dataRows.map(row => transformRow(row))
  
  // Resolve categories and build documents
  let created = 0, updated = 0, errors = 0
  const results = []
  
  for (const product of products) {
    // Try to find category by L1/L2/L3 path
    let category = null
    
    if (product.l3Category) {
      // Try exact path match
      const pathKey = `${(product.l1Category || '').toLowerCase()}|${(product.l2Category || '').toLowerCase()}|${product.l3Category.toLowerCase()}`
      category = pathToCategory.get(pathKey)
      
      // Fallback: try slug match
      if (!category) {
        const slug = product.l3Category.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
        category = catBySlug.get(slug)
      }
      
      // Fallback: try name match
      if (!category) {
        category = catByName.get(product.l3Category.toLowerCase())
      }
    }
    
    if (!category) {
      console.log(`  [WARN] No category found for: ${product.sku} (L3: ${product.l3Category})`)
    }
    
    const doc = buildProductDoc(product, category?._id?.toString())
    
    try {
      // Check if product exists by SKU
      const existing = await productsCol.findOne({ sku: doc.sku })
      
      if (existing) {
        // Update existing
        await productsCol.updateOne(
          { _id: existing._id },
          { $set: { ...doc, createdAt: existing.createdAt } }
        )
        updated++
        results.push({ sku: doc.sku, action: 'updated', category: category?.name || 'none' })
      } else {
        // Insert new
        await productsCol.insertOne(doc)
        created++
        results.push({ sku: doc.sku, action: 'created', category: category?.name || 'none' })
      }
    } catch (err) {
      console.error(`  [ERROR] ${doc.sku}: ${err.message}`)
      errors++
      results.push({ sku: doc.sku, action: 'error', error: err.message })
    }
  }
  
  await client.close()
  
  // Summary
  console.log('\n=== Import Summary ===')
  console.log(`Created: ${created}`)
  console.log(`Updated: ${updated}`)
  console.log(`Errors: ${errors}`)
  
  // Save results log
  const logPath = path.join(path.dirname(excelPath), 'import-log.json')
  fs.writeFileSync(logPath, JSON.stringify(results, null, 2))
  console.log(`\nLog saved: ${logPath}`)
  
  console.log('\n=== Import Complete ===')
}

main().catch(err => {
  console.error('Fatal:', err)
  process.exit(1)
})
