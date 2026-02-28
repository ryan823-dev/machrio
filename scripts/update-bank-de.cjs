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
      { countryCode: 'DE', currency: 'EUR' },
      {
        $set: {
          beneficiaryName: 'VertaX Limited',
          bankName: 'Banking Circle S.A.',
          accountNumber: 'DE84202208000047013297',
          localBankCode: 'DE84202208000047013297',
          localBankCodeLabel: 'IBAN',
          swiftCode: 'SXPYDEHH',
          bankAddress: 'Germany',
          updatedAt: new Date().toISOString(),
        }
      }
    )

    if (result.matchedCount === 1) {
      console.log('DE (EUR) bank account updated successfully.')
    } else {
      console.log('No matching DE/EUR account found. matchedCount:', result.matchedCount)
    }
  } finally {
    await client.close()
  }
}

update().catch(console.error)
