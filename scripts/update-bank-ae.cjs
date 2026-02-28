const fs = require('fs')
const path = require('path')
const { MongoClient } = require('mongodb')

const envPath = path.join(__dirname, '..', '.env.local')
const envContent = fs.readFileSync(envPath, 'utf8')
const envLine = envContent.split('\n').find(l => l.startsWith('MONGODB_URI='))
const MONGODB_URI = envLine ? envLine.split('=').slice(1).join('=').trim() : ''
if (!MONGODB_URI) { console.error('MONGODB_URI not found'); process.exit(1) }

async function update() {
  const client = new MongoClient(MONGODB_URI)
  try {
    await client.connect()
    const db = client.db()
    const col = db.collection('bank-accounts')

    // Update UAE / AED account
    const result = await col.updateOne(
      { countryCode: 'AE', currency: 'AED' },
      {
        $set: {
          beneficiaryName: 'VertaX Limited',
          bankName: 'Standard Chartered Bank Dubai Branch',
          accountNumber: 'AE150446498900000105035',
          localBankCode: 'AE150446498900000105035',
          localBankCodeLabel: 'IBAN',
          swiftCode: 'SCBLAEAD',
          bankAddress: 'Dubai, United Arab Emirates',
          updatedAt: new Date().toISOString(),
        }
      }
    )

    if (result.matchedCount === 1) {
      console.log('UAE (AED) bank account updated successfully.')
    } else {
      console.log('No matching UAE/AED account found. matchedCount:', result.matchedCount)
    }
  } finally {
    await client.close()
  }
}

update().catch(console.error)
