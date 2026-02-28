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

    const result = await col.updateOne(
      { countryCode: 'US', currency: 'USD' },
      {
        $set: {
          beneficiaryName: 'VertaX Limited',
          bankName: 'Community Federal Savings Bank',
          accountNumber: '8488242596',
          localBankCode: '026073150',
          localBankCodeLabel: 'ACH Routing Number',
          swiftCode: 'CMFGUS33',
          additionalInfo: 'Fedwire Routing Number: 026073008',
          bankAddress: 'United States',
          updatedAt: new Date().toISOString(),
        }
      }
    )

    if (result.matchedCount === 1) {
      console.log('US (USD) bank account updated successfully.')
    } else {
      console.log('No matching US/USD account found. matchedCount:', result.matchedCount)
    }
  } finally {
    await client.close()
  }
}

update().catch(console.error)
