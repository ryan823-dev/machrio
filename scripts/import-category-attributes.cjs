/**
 * Category Attributes Import Script for Machrio
 * Reads Excel file with L3 category filter attributes and updates MongoDB
 * 
 * Excel format: Machrio_Category_Attributes.xlsx
 * Columns: No., L1 Category, L2 Category, L3 Category, Attribute 1-9
 * 
 * Usage: node scripts/import-category-attributes.cjs [path-to-excel]
 */
const XLSX = require('xlsx')
const { MongoClient } = require('mongodb')
const path = require('path')

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://mroworks_db_user:moore1982@mroworks-dev.gbqxebq.mongodb.net/machrio?retryWrites=true&w=majority'
const DEFAULT_EXCEL_PATH = '/Users/oceanlink/Documents/Machrio_Category_Attributes.xlsx'

function generateSlug(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

function generateKey(attributeName) {
  return attributeName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

async function main() {
  const excelPath = process.argv[2] || DEFAULT_EXCEL_PATH
  
  console.log(`Reading Excel from: ${excelPath}`)
  const workbook = XLSX.readFile(excelPath)
  const sheet = workbook.Sheets[workbook.SheetNames[0]]
  const rows = XLSX.utils.sheet_to_json(sheet)
  
  // Filter only L3 category rows (have L3 Category and numeric No.)
  const l3Rows = rows.filter(row => {
    const no = row['No.']
    return row['L3 Category'] && typeof no === 'number'
  })
  
  console.log(`Found ${l3Rows.length} L3 categories in Excel`)
  
  // Build attribute map: L3 slug -> attributes array
  const attributeMap = new Map()
  
  for (const row of l3Rows) {
    const l3Name = row['L3 Category']
    const l3Slug = generateSlug(l3Name)
    
    const attributes = []
    for (let i = 1; i <= 9; i++) {
      const attrName = row[`Attribute ${i}`]
      if (attrName && typeof attrName === 'string' && attrName.trim()) {
        attributes.push({
          name: attrName.trim(),
          key: generateKey(attrName.trim()),
          displayOrder: i,
        })
      }
    }
    
    if (attributes.length > 0) {
      attributeMap.set(l3Slug, { name: l3Name, attributes })
    }
  }
  
  console.log(`Prepared ${attributeMap.size} categories with attributes`)
  
  // Connect to MongoDB
  const client = new MongoClient(MONGODB_URI)
  await client.connect()
  console.log('Connected to MongoDB')
  
  const db = client.db('machrio')
  const categoriesCollection = db.collection('categories')
  
  // Get all categories from DB
  const dbCategories = await categoriesCollection.find({}).toArray()
  console.log(`Found ${dbCategories.length} categories in database`)
  
  // Create slug -> id map
  const slugToId = new Map()
  for (const cat of dbCategories) {
    slugToId.set(cat.slug, cat._id)
  }
  
  // Update categories with attributes
  let updated = 0
  let notFound = 0
  const notFoundList = []
  
  for (const [slug, data] of attributeMap) {
    const catId = slugToId.get(slug)
    
    if (catId) {
      await categoriesCollection.updateOne(
        { _id: catId },
        { $set: { customFilterAttributes: data.attributes } }
      )
      updated++
      if (updated % 50 === 0) {
        console.log(`Updated ${updated} categories...`)
      }
    } else {
      notFound++
      notFoundList.push({ slug, name: data.name })
    }
  }
  
  console.log(`\n=== Import Summary ===`)
  console.log(`Updated: ${updated} categories`)
  console.log(`Not found in DB: ${notFound} categories`)
  
  if (notFoundList.length > 0 && notFoundList.length <= 20) {
    console.log(`\nNot found categories:`)
    notFoundList.forEach(({ slug, name }) => {
      console.log(`  - ${name} (expected slug: ${slug})`)
    })
  } else if (notFoundList.length > 20) {
    console.log(`\nFirst 20 not found categories:`)
    notFoundList.slice(0, 20).forEach(({ slug, name }) => {
      console.log(`  - ${name} (expected slug: ${slug})`)
    })
  }
  
  await client.close()
  console.log('\nDone!')
}

main().catch(console.error)
