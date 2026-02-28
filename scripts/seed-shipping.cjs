const fs = require('fs')
const path = require('path')
const { MongoClient } = require('mongodb')

const envPath = path.join(__dirname, '..', '.env.local')
const envContent = fs.readFileSync(envPath, 'utf8')
const envLine = envContent.split('\n').find(l => l.startsWith('MONGODB_URI='))
const MONGODB_URI = envLine ? envLine.split('=').slice(1).join('=').trim() : ''
if (!MONGODB_URI) { console.error('MONGODB_URI not found'); process.exit(1) }

async function seed() {
  const client = new MongoClient(MONGODB_URI)
  try {
    await client.connect()
    const db = client.db()
    const now = new Date().toISOString()

    // 1. Seed Shipping Methods
    const methodsCol = db.collection('shipping-methods')
    const existingMethods = await methodsCol.countDocuments()
    let standardId, economyId

    if (existingMethods === 0) {
      const result = await methodsCol.insertMany([
        {
          name: 'Standard Air Shipping',
          code: 'standard',
          transitDays: 12,
          description: 'Air freight with DDP (Delivered Duty Paid). Customs duties included.',
          isActive: true,
          sortOrder: 1,
          createdAt: now,
          updatedAt: now,
        },
        {
          name: 'Economy Sea Shipping',
          code: 'economy',
          transitDays: 25,
          description: 'Sea freight with DDP. Longer transit time but lower cost for bulk orders.',
          isActive: true,
          sortOrder: 2,
          createdAt: now,
          updatedAt: now,
        },
      ])
      const ids = Object.values(result.insertedIds)
      standardId = ids[0]
      economyId = ids[1]
      console.log('Inserted 2 shipping methods.')
    } else {
      console.log(`Shipping methods already exist (${existingMethods}). Skipping.`)
      const methods = await methodsCol.find({}).toArray()
      standardId = methods.find(m => m.code === 'standard')?._id
      economyId = methods.find(m => m.code === 'economy')?._id
    }

    if (!standardId || !economyId) {
      console.error('Could not find shipping method IDs')
      return
    }

    // 2. Seed Shipping Rates
    const ratesCol = db.collection('shipping-rates')
    const existingRates = await ratesCol.countDocuments()

    if (existingRates === 0) {
      const countries = [
        { code: 'US', name: 'United States' },
        { code: 'CA', name: 'Canada' },
        { code: 'GB', name: 'United Kingdom' },
        { code: 'DE', name: 'Germany' },
        { code: 'AU', name: 'Australia' },
        { code: 'HK', name: 'Hong Kong' },
        { code: 'OTHER', name: 'Other Countries' },
      ]

      const rates = []
      for (const country of countries) {
        // Standard Air rates
        rates.push({
          displayName: `${country.code} Rate`,
          shippingMethod: standardId,
          countryCode: country.code,
          countryName: country.name,
          baseWeight: 2,
          baseRate: 25,
          additionalRate: 5,
          handlingFee: 3,
          isActive: true,
          notes: 'Placeholder rate - adjust based on actual carrier costs',
          createdAt: now,
          updatedAt: now,
        })
        // Economy Sea rates
        rates.push({
          displayName: `${country.code} Rate`,
          shippingMethod: economyId,
          countryCode: country.code,
          countryName: country.name,
          baseWeight: 5,
          baseRate: 15,
          additionalRate: 2.5,
          handlingFee: 3,
          isActive: true,
          notes: 'Placeholder rate - adjust based on actual carrier costs',
          createdAt: now,
          updatedAt: now,
        })
      }

      const result = await ratesCol.insertMany(rates)
      console.log(`Inserted ${result.insertedCount} shipping rates.`)
    } else {
      console.log(`Shipping rates already exist (${existingRates}). Skipping.`)
    }

    // 3. Seed Free Shipping Rules
    const freeCol = db.collection('free-shipping-rules')
    const existingFree = await freeCol.countDocuments()

    if (existingFree === 0) {
      const result = await freeCol.insertMany([
        {
          name: 'Economy Free Shipping $500+',
          shippingMethod: economyId,
          countryCode: '',
          minimumAmount: 500,
          message: 'Add ${gap} more for free economy shipping!',
          isActive: true,
          createdAt: now,
          updatedAt: now,
        },
        {
          name: 'Standard Free Shipping $800+',
          shippingMethod: standardId,
          countryCode: '',
          minimumAmount: 800,
          message: 'Add ${gap} more for free standard shipping!',
          isActive: true,
          createdAt: now,
          updatedAt: now,
        },
      ])
      console.log(`Inserted ${result.insertedCount} free shipping rules.`)
    } else {
      console.log(`Free shipping rules already exist (${existingFree}). Skipping.`)
    }

    // 4. Update products with default weight
    const productsCol = db.collection('products')
    const noWeightCount = await productsCol.countDocuments({
      $or: [
        { 'shippingInfo.weight': { $exists: false } },
        { 'shippingInfo.weight': null },
        { 'shippingInfo.weight': 0 },
      ],
    })

    if (noWeightCount > 0) {
      const updateResult = await productsCol.updateMany(
        {
          $or: [
            { 'shippingInfo.weight': { $exists: false } },
            { 'shippingInfo.weight': null },
            { 'shippingInfo.weight': 0 },
          ],
        },
        {
          $set: {
            'shippingInfo.weight': 0.5,
            'shippingInfo.processingTime': 3,
          },
        },
      )
      console.log(`Updated ${updateResult.modifiedCount} products with default weight (0.5 kg) and processingTime (3 days).`)
    } else {
      console.log('All products already have weight configured.')
    }

    console.log('\nDone! All shipping data seeded.')
    console.log('Note: Shipping rates are placeholders. Adjust them in the admin panel.')

  } finally {
    await client.close()
  }
}

seed().catch(console.error)
