/**
 * Investigate how xlsx product IDs map to database products.
 * Usage: node scripts/investigate-product-match.cjs
 */
const XLSX = require('xlsx')
const { MongoClient } = require('mongodb')
const path = require('path')

const MONGODB_URI = 'mongodb+srv://mroworks_db_user:SAEvhA4d4A2pzlMX@mroworks-dev.gbqxebq.mongodb.net/mroworks?retryWrites=true&w=majority&appName=mroworks-dev'
const XLSX_PATH = path.resolve(__dirname, '../../产品信息2602251142.xlsx')

async function main() {
  // 1. Read xlsx
  const wb = XLSX.readFile(XLSX_PATH)
  const ws = wb.Sheets['商品(英文)']
  const rows = XLSX.utils.sheet_to_json(ws)
  
  console.log('=== XLSX Data ===')
  console.log('Total rows:', rows.length)
  console.log('First 5 products:')
  rows.slice(0, 5).forEach(r => {
    console.log(`  ID: ${r['商品id']}  Weight: ${r['重量']}kg  Name: ${(r['商品名称'] || '').substring(0, 60)}`)
  })

  // 2. Connect to DB
  const client = new MongoClient(MONGODB_URI)
  await client.connect()
  const db = client.db('mroworks')
  const col = db.collection('products')

  console.log('\n=== Database Products ===')
  const dbProducts = await col.find({}, { projection: { sku: 1, title: 1 } }).toArray()
  console.log('Total:', dbProducts.length)
  console.log('First 5:')
  dbProducts.slice(0, 5).forEach(p => {
    console.log(`  SKU: ${p.sku}  Title: ${(p.title || '').substring(0, 60)}`)
  })

  // 3. Try matching by title
  const xlsxByTitle = new Map()
  for (const r of rows) {
    const name = (r['商品名称'] || '').trim()
    if (name) xlsxByTitle.set(name, parseFloat(r['重量']))
  }

  let titleMatches = 0
  let titleMisses = 0
  const missedTitles = []
  for (const p of dbProducts) {
    const title = (p.title || '').trim()
    if (xlsxByTitle.has(title)) {
      titleMatches++
    } else {
      titleMisses++
      if (missedTitles.length < 5) missedTitles.push(title.substring(0, 60))
    }
  }
  console.log(`\n=== Title Matching ===`)
  console.log(`Matched: ${titleMatches}`)
  console.log(`Not matched: ${titleMisses}`)
  if (missedTitles.length > 0) {
    console.log('Sample unmatched DB titles:')
    missedTitles.forEach(t => console.log(`  "${t}"`))
  }

  // 4. Try matching by partial title (first 40 chars)
  const xlsxByPartial = new Map()
  for (const r of rows) {
    const name = (r['商品名称'] || '').trim().substring(0, 40)
    if (name) xlsxByPartial.set(name, parseFloat(r['重量']))
  }

  let partialMatches = 0
  for (const p of dbProducts) {
    const title = (p.title || '').trim().substring(0, 40)
    if (xlsxByPartial.has(title)) {
      partialMatches++
    }
  }
  console.log(`\n=== Partial Title Match (first 40 chars) ===`)
  console.log(`Matched: ${partialMatches}`)

  await client.close()
  console.log('\nDone.')
}

main().catch(err => { console.error(err); process.exit(1) })
