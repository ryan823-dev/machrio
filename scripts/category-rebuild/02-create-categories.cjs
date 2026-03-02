/**
 * Step 2: Create 635 categories (31 L1 + 195 L2 + 409 L3) from Excel spreadsheet.
 * Reads Machrio_Category_Plan_v2.xlsx and creates hierarchical categories in MongoDB.
 *
 * Usage: node scripts/category-rebuild/02-create-categories.cjs
 */
const { MongoClient } = require('mongodb')
const XLSX = require('xlsx')
const fs = require('fs')
const path = require('path')

const MONGODB_URI = 'mongodb+srv://mroworks_db_user:moore1982@mroworks-dev.gbqxebq.mongodb.net/machrio?retryWrites=true&w=majority'
const EXCEL_PATH = '/Users/oceanlink/Documents/Machrio_Category_Plan_v2.xlsx'

// L1 emoji mapping
const L1_EMOJIS = {
  'Abrasives': '🔧',
  'Adhesives, Sealants and Tape': '🧴',
  'Cleaning and Janitorial': '🧹',
  'Electrical': '⚡',
  'Fasteners': '🔩',
  'Fleet & Vehicle Maintenance': '🚛',
  'Furnishings, Appliances & Hospitality': '🏢',
  'HVAC and Refrigeration': '❄️',
  'Hardware': '🔨',
  'Hydraulics': '💧',
  'Lab Supplies': '🔬',
  'Lighting': '💡',
  'Lubrication': '🛢️',
  'Machining': '⚙️',
  'Material Handling': '📦',
  'Motors': '🔌',
  'Office Supplies': '📋',
  'Outdoor Equipment': '🌿',
  'Packaging & Shipping': '📬',
  'Paints, Equipment and Supplies': '🎨',
  'Pipe, Hose, Tube & Fittings': '🔗',
  'Plumbing': '🚿',
  'Pneumatics': '💨',
  'Power Transmission': '⛓️',
  'Pumps': '🔄',
  'Raw Materials': '🧱',
  'Safety': '🛡️',
  'Security': '🔒',
  'Test Instruments': '📏',
  'Tools': '🛠️',
  'Welding': '🔥',
}

function generateSlug(name) {
  return name.toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

function makeUniqueSlug(name, usedSlugs, parentSlug) {
  let slug = generateSlug(name)

  if (usedSlugs.has(slug) && parentSlug) {
    slug = `${parentSlug}-${slug}`
  }

  // Final dedup with counter
  let finalSlug = slug
  let counter = 2
  while (usedSlugs.has(finalSlug)) {
    finalSlug = `${slug}-${counter}`
    counter++
  }

  usedSlugs.add(finalSlug)
  return finalSlug
}

function richText(text) {
  return {
    root: {
      type: 'root',
      format: '',
      indent: 0,
      version: 1,
      children: [{
        type: 'paragraph',
        format: '',
        indent: 0,
        version: 1,
        children: [{
          mode: 'normal',
          text,
          type: 'text',
          format: 0,
          style: '',
          detail: 0,
          version: 1,
        }],
        direction: 'ltr',
        textFormat: 0,
        textStyle: '',
      }],
      direction: 'ltr',
    },
  }
}

async function main() {
  console.log('=== Step 2: Create Categories from Excel ===\n')

  // Read Excel
  if (!fs.existsSync(EXCEL_PATH)) {
    console.error(`Excel file not found: ${EXCEL_PATH}`)
    process.exit(1)
  }

  const workbook = XLSX.readFile(EXCEL_PATH)
  const sheet = workbook.Sheets[workbook.SheetNames[0]]
  const rows = XLSX.utils.sheet_to_json(sheet)
  console.log(`Read ${rows.length} rows from Excel\n`)

  // Parse hierarchy
  const l1Map = new Map() // l1Name -> { l2Map: Map<l2Name, l3List[]> }

  for (const row of rows) {
    const l1 = (row['L1 Category'] || '').trim()
    const l2 = (row['L2 Category'] || '').trim()
    const l3 = (row['L3 Category (Target)'] || '').trim()
    if (!l1 || !l2 || !l3) continue

    if (!l1Map.has(l1)) {
      l1Map.set(l1, { l2Map: new Map() })
    }
    const l1Node = l1Map.get(l1)

    if (!l1Node.l2Map.has(l2)) {
      l1Node.l2Map.set(l2, [])
    }
    l1Node.l2Map.get(l2).push({
      name: l3,
      type: (row['Category Type'] || '').trim(),
      searchVolume: row['Search Volume'] || '',
      kd: row['KD'] || '',
      cpc: row['CPC ($)'] || '',
      notes: (row['Notes'] || '').trim(),
    })
  }

  const l1Names = Array.from(l1Map.keys())
  const l2Count = Array.from(l1Map.values()).reduce((s, v) => s + v.l2Map.size, 0)
  const l3Count = rows.length
  console.log(`Parsed: ${l1Names.length} L1 | ${l2Count} L2 | ${l3Count} L3\n`)

  // Connect to MongoDB
  const client = new MongoClient(MONGODB_URI)
  await client.connect()
  const db = client.db('machrio')
  const categoriesCol = db.collection('categories')

  // Verify empty
  const existing = await categoriesCol.countDocuments({})
  if (existing > 0) {
    console.error(`ERROR: ${existing} categories still exist. Run 01-backup-and-clean.cjs first!`)
    await client.close()
    process.exit(1)
  }

  const usedSlugs = new Set()
  const l1IdMap = new Map()  // l1Name -> ObjectId
  const l2IdMap = new Map()  // "l1Name > l2Name" -> ObjectId
  const l3IdMap = new Map()  // "l1Name > l2Name > l3Name" -> ObjectId
  const l1SlugMap = new Map() // l1Name -> slug
  const l2SlugMap = new Map() // "l1Name > l2Name" -> slug

  // ── Phase 1: Create L1 categories ──
  console.log('Phase 1: Creating L1 categories...')
  let displayOrder = 1
  for (const l1Name of l1Names) {
    const slug = makeUniqueSlug(l1Name, usedSlugs)
    const emoji = L1_EMOJIS[l1Name] || '📦'
    const l2Count = l1Map.get(l1Name).l2Map.size

    const result = await categoriesCol.insertOne({
      name: l1Name,
      slug,
      description: richText(`Browse ${l1Name} industrial supplies and equipment at Machrio. Professional-grade products with competitive pricing and fast shipping.`),
      shortDescription: `Industrial ${l1Name.toLowerCase()} supplies and equipment`,
      iconEmoji: emoji,
      featured: true,
      displayOrder: displayOrder++,
      faq: [],
      facetGroups: [
        { facetName: 'brand', expanded: true },
        { facetName: 'material', expanded: false },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })

    l1IdMap.set(l1Name, result.insertedId)
    l1SlugMap.set(l1Name, slug)
    console.log(`  ✓ L1: ${l1Name} (${slug}) [${l2Count} L2s]`)
  }
  console.log(`  Created ${l1IdMap.size} L1 categories\n`)

  // ── Phase 2: Create L2 categories ──
  console.log('Phase 2: Creating L2 categories...')
  let l2Created = 0
  for (const [l1Name, l1Node] of l1Map.entries()) {
    const l1Id = l1IdMap.get(l1Name)
    const l1Slug = l1SlugMap.get(l1Name)

    for (const [l2Name, l3List] of l1Node.l2Map.entries()) {
      const slug = makeUniqueSlug(l2Name, usedSlugs, l1Slug)
      const key = `${l1Name} > ${l2Name}`

      const result = await categoriesCol.insertOne({
        name: l2Name,
        slug,
        parent: l1Id,
        description: richText(`Shop ${l2Name} in ${l1Name}. Industrial-grade products with transparent pricing, bulk discounts, and same-day shipping.`),
        shortDescription: `${l2Name} supplies for industrial and commercial use`,
        displayOrder: 0,
        faq: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })

      l2IdMap.set(key, result.insertedId)
      l2SlugMap.set(key, slug)
      l2Created++
    }
  }
  console.log(`  Created ${l2Created} L2 categories\n`)

  // ── Phase 3: Create L3 categories ──
  console.log('Phase 3: Creating L3 categories...')
  let l3Created = 0
  const categoryMetadata = [] // for SEO script

  for (const [l1Name, l1Node] of l1Map.entries()) {
    for (const [l2Name, l3List] of l1Node.l2Map.entries()) {
      const l2Key = `${l1Name} > ${l2Name}`
      const l2Id = l2IdMap.get(l2Key)
      const l2Slug = l2SlugMap.get(l2Key)

      for (const l3Item of l3List) {
        const slug = makeUniqueSlug(l3Item.name, usedSlugs, l2Slug)
        const fullPath = `${l1Name} > ${l2Name} > ${l3Item.name}`

        const result = await categoriesCol.insertOne({
          name: l3Item.name,
          slug,
          parent: l2Id,
          description: richText(`${l3Item.name} - industrial supplies available at Machrio. Quality products for professional applications.`),
          shortDescription: `Shop ${l3Item.name} at competitive prices`,
          displayOrder: 0,
          faq: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        })

        l3IdMap.set(fullPath, result.insertedId)
        l3Created++

        categoryMetadata.push({
          categoryId: result.insertedId.toString(),
          slug,
          l1: l1Name,
          l2: l2Name,
          l3: l3Item.name,
          fullPath,
          categoryType: l3Item.type,
          searchVolume: l3Item.searchVolume,
          kd: l3Item.kd,
          cpc: l3Item.cpc,
          notes: l3Item.notes,
        })
      }
    }
  }
  console.log(`  Created ${l3Created} L3 categories\n`)

  // Save maps for subsequent scripts
  const idMapPath = path.join(__dirname, 'category-id-map.json')
  const allEntries = {}
  for (const [k, v] of l1IdMap) allEntries[k] = v.toString()
  for (const [k, v] of l2IdMap) allEntries[k] = v.toString()
  for (const [k, v] of l3IdMap) allEntries[k] = v.toString()
  fs.writeFileSync(idMapPath, JSON.stringify(allEntries, null, 2))
  console.log(`Saved ID map -> ${idMapPath}`)

  const metadataPath = path.join(__dirname, 'category-metadata.json')
  fs.writeFileSync(metadataPath, JSON.stringify(categoryMetadata, null, 2))
  console.log(`Saved metadata (${categoryMetadata.length} L3s) -> ${metadataPath}`)

  // Verify
  const totalCats = await categoriesCol.countDocuments({})
  const expectedTotal = l1IdMap.size + l2Created + l3Created
  console.log(`\n=== Verification ===`)
  console.log(`Total categories in DB: ${totalCats} (expected ${expectedTotal})`)
  console.log(`  L1: ${l1IdMap.size}`)
  console.log(`  L2: ${l2Created}`)
  console.log(`  L3: ${l3Created}`)

  await client.close()
  console.log('\n=== Step 2 Complete ===')
}

main().catch(err => { console.error('Fatal:', err); process.exit(1) })
