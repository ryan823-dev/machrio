const fs = require('fs')
const path = require('path')
const { MongoClient } = require('mongodb')

const envPath = path.join(__dirname, '..', '.env.local')
const envContent = fs.readFileSync(envPath, 'utf8')
const envLine = envContent.split('\n').find(l => l.startsWith('MONGODB_URI='))
const MONGODB_URI = envLine ? envLine.split('=').slice(1).join('=').trim() : ''
if (!MONGODB_URI) { console.error('MONGODB_URI not found'); process.exit(1) }

const commonFields = {
  beneficiaryName: 'VertaX Limited',
  bankName: 'DBS Bank (Hong Kong) Limited',
  accountNumber: '795005251',
  localBankCode: '016-478',
  localBankCodeLabel: 'Bank Code - Branch Code',
  swiftCode: 'DHBKHKHH',
  bankAddress: 'Hong Kong',
  additionalInfo: 'Supports ACH, RTGS, FPS (domestic) and SWIFT (international)',
  updatedAt: new Date().toISOString(),
}

async function update() {
  const client = new MongoClient(MONGODB_URI)
  try {
    await client.connect()
    const db = client.db()
    const col = db.collection('bank-accounts')

    // Update HKD account
    const r1 = await col.updateOne(
      { countryCode: 'HK', currency: 'HKD' },
      { $set: { ...commonFields } }
    )
    console.log(`HK (HKD): ${r1.matchedCount === 1 ? 'updated' : 'NOT FOUND'}`)

    // Update CNY account
    const r2 = await col.updateOne(
      { countryCode: 'HK', currency: 'CNY' },
      { $set: { ...commonFields } }
    )
    console.log(`HK (CNY): ${r2.matchedCount === 1 ? 'updated' : 'NOT FOUND'}`)

  } finally {
    await client.close()
  }
}

update().catch(console.error)
