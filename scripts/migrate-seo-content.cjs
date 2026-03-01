/**
 * Migrate SEO content (introContent, buyingGuide, FAQ) from mroworks DB to machrio DB.
 * Converts buyingGuide from raw array format to Payload v3 Lexical richText format.
 *
 * Usage: node scripts/migrate-seo-content.cjs
 */
const { MongoClient } = require('mongodb')

const URI = 'mongodb+srv://mroworks_db_user:moore1982@mroworks-dev.gbqxebq.mongodb.net/?retryWrites=true&w=majority'

// Manual slug mapping for categories that were renamed
const SLUG_MAP = {
  'cleaning-janitorial': 'cleaning-and-janitorial',
  'hand-protection': 'hand-arm-protection',
  'adhesives-glue': 'adhesives-glues',
  'first-aid-medical': 'first-aid-wound-care',
  'foot-protection': 'footwear-footwear-accessories',
  'sealants-caulk': 'pipe-thread-sealants', // closest match
  'carts-trucks': 'cleaning-carts',
  'slings-rigging': 'lifting-slings',
  'jacks-lifts': 'vehicle-service-jacks',
}

/**
 * Convert raw array buyingGuide format to Payload v3 Lexical richText format.
 * Input:  [{type: "paragraph", children: [{text: "..."}]}, ...]
 * Output: {root: {type: "root", children: [{type: "paragraph", ...}], direction: "ltr", format: "", indent: 0, version: 1}}
 */
function toLexi(rawArray) {
  if (!Array.isArray(rawArray) || rawArray.length === 0) {
    return { root: { type: 'root', children: [], direction: 'ltr', format: '', indent: 0, version: 1 } }
  }

  const children = rawArray.map(node => {
    const textChildren = (node.children || []).map(child => ({
      detail: 0,
      format: 0,
      mode: 'normal',
      style: '',
      text: child.text || '',
      type: 'text',
      version: 1,
    }))

    return {
      children: textChildren,
      direction: 'ltr',
      format: '',
      indent: 0,
      type: node.type || 'paragraph',
      version: 1,
      ...(node.type === 'heading' ? { tag: node.tag || 'h3' } : {}),
    }
  })

  return {
    root: {
      type: 'root',
      children,
      direction: 'ltr',
      format: '',
      indent: 0,
      version: 1,
    },
  }
}

async function main() {
  console.log('=== SEO Content Migration: mroworks -> machrio ===\n')

  const client = new MongoClient(URI, { serverSelectionTimeoutMS: 10000 })
  await client.connect()

  const oldDb = client.db('mroworks')
  const newDb = client.db('machrio')

  const oldCats = await oldDb.collection('categories').find({}).toArray()
  const newCats = await newDb.collection('categories').find({}).toArray()

  const newBySlug = new Map()
  for (const c of newCats) newBySlug.set(c.slug, c)

  let migrated = 0
  let skipped = 0
  let noMatch = 0

  for (const oldCat of oldCats) {
    if (!oldCat.introContent && (!oldCat.faq || oldCat.faq.length === 0)) {
      skipped++
      continue
    }

    // Try exact slug match, then mapped slug
    let targetSlug = oldCat.slug
    if (!newBySlug.has(targetSlug) && SLUG_MAP[targetSlug]) {
      targetSlug = SLUG_MAP[targetSlug]
    }

    const target = newBySlug.get(targetSlug)
    if (!target) {
      console.log(`[NO MATCH] ${oldCat.slug} (tried: ${targetSlug})`)
      noMatch++
      continue
    }

    // Skip if target already has content
    if (target.introContent && target.introContent.length > 10) {
      console.log(`[SKIP] ${targetSlug} - already has content`)
      skipped++
      continue
    }

    // Build update
    const update = {}
    if (oldCat.introContent) update.introContent = oldCat.introContent
    if (oldCat.buyingGuide) update.buyingGuide = toLexi(oldCat.buyingGuide)
    if (oldCat.faq && Array.isArray(oldCat.faq) && oldCat.faq.length > 0) update.faq = oldCat.faq

    await newDb.collection('categories').updateOne(
      { _id: target._id },
      { $set: update }
    )

    console.log(`[MIGRATED] ${oldCat.slug} -> ${targetSlug} (intro: ${(update.introContent || '').length}chars, bg: ${oldCat.buyingGuide ? oldCat.buyingGuide.length : 0} paras, faq: ${(update.faq || []).length}q)`)
    migrated++
  }

  await client.close()

  console.log('\n=== Summary ===')
  console.log(`Migrated: ${migrated}`)
  console.log(`Skipped: ${skipped}`)
  console.log(`No match: ${noMatch}`)
}

main().catch(err => {
  console.error('Fatal:', err)
  process.exit(1)
})
