// Seed script for bank accounts placeholder data
// Run with: node scripts/seed-bank-accounts.cjs

const { MongoClient } = require('mongodb')
const fs = require('fs')
const path = require('path')

// Read .env.local manually (no dotenv dependency)
const envPath = path.join(__dirname, '..', '.env.local')
const envContent = fs.readFileSync(envPath, 'utf8')
const envLine = envContent.split('\n').find(l => l.startsWith('MONGODB_URI='))
const MONGODB_URI = envLine ? envLine.split('=').slice(1).join('=').trim() : ''
if (!MONGODB_URI) { console.error('MONGODB_URI not found in .env.local'); process.exit(1) }

const bankAccounts = [
  { accountName: 'HKD - Hong Kong', country: 'Hong Kong', countryCode: 'HK', flag: '🇭🇰', currency: 'HKD', bankName: '[Bank Name TBD]', beneficiaryName: 'VERTAX LIMITED', accountNumber: '[TBD]', localBankCode: '', localBankCodeLabel: 'Bank Code', swiftCode: '[TBD]', sortOrder: 0 },
  { accountName: 'CNY - Hong Kong', country: 'Hong Kong', countryCode: 'HK', flag: '🇭🇰', currency: 'CNY', bankName: '[Bank Name TBD]', beneficiaryName: 'VERTAX LIMITED', accountNumber: '[TBD]', localBankCode: '', localBankCodeLabel: 'Bank Code', swiftCode: '[TBD]', sortOrder: 1 },
  { accountName: 'USD - United States', country: 'United States', countryCode: 'US', flag: '🇺🇸', currency: 'USD', bankName: '[Bank Name TBD]', beneficiaryName: 'VERTAX LIMITED', accountNumber: '[TBD]', localBankCode: '[TBD]', localBankCodeLabel: 'Routing Number', swiftCode: '[TBD]', sortOrder: 2 },
  { accountName: 'EUR - Germany', country: 'Germany', countryCode: 'DE', flag: '🇩🇪', currency: 'EUR', bankName: '[Bank Name TBD]', beneficiaryName: 'VERTAX LIMITED', accountNumber: '[TBD]', localBankCode: '[TBD]', localBankCodeLabel: 'IBAN', swiftCode: '[TBD]', sortOrder: 3 },
  { accountName: 'GBP - United Kingdom', country: 'United Kingdom', countryCode: 'GB', flag: '🇬🇧', currency: 'GBP', bankName: '[Bank Name TBD]', beneficiaryName: 'VERTAX LIMITED', accountNumber: '[TBD]', localBankCode: '[TBD]', localBankCodeLabel: 'Sort Code', swiftCode: '[TBD]', sortOrder: 4 },
  { accountName: 'CAD - Canada', country: 'Canada', countryCode: 'CA', flag: '🇨🇦', currency: 'CAD', bankName: '[Bank Name TBD]', beneficiaryName: 'VERTAX LIMITED', accountNumber: '[TBD]', localBankCode: '[TBD]', localBankCodeLabel: 'Transit/Institution', swiftCode: '[TBD]', sortOrder: 5 },
  { accountName: 'AUD - Australia', country: 'Australia', countryCode: 'AU', flag: '🇦🇺', currency: 'AUD', bankName: '[Bank Name TBD]', beneficiaryName: 'VERTAX LIMITED', accountNumber: '[TBD]', localBankCode: '[TBD]', localBankCodeLabel: 'BSB', swiftCode: '[TBD]', sortOrder: 6 },
  { accountName: 'NZD - New Zealand', country: 'New Zealand', countryCode: 'NZ', flag: '🇳🇿', currency: 'NZD', bankName: '[Bank Name TBD]', beneficiaryName: 'VERTAX LIMITED', accountNumber: '[TBD]', localBankCode: '', localBankCodeLabel: '', swiftCode: '[TBD]', sortOrder: 7 },
  { accountName: 'SGD - Singapore', country: 'Singapore', countryCode: 'SG', flag: '🇸🇬', currency: 'SGD', bankName: '[Bank Name TBD]', beneficiaryName: 'VERTAX LIMITED', accountNumber: '[TBD]', localBankCode: '', localBankCodeLabel: '', swiftCode: '[TBD]', sortOrder: 8 },
  { accountName: 'AED - UAE', country: 'United Arab Emirates', countryCode: 'AE', flag: '🇦🇪', currency: 'AED', bankName: '[Bank Name TBD]', beneficiaryName: 'VERTAX LIMITED', accountNumber: '[TBD]', localBankCode: '[TBD]', localBankCodeLabel: 'IBAN', swiftCode: '[TBD]', sortOrder: 9 },
  { accountName: 'MXN - Mexico', country: 'Mexico', countryCode: 'MX', flag: '🇲🇽', currency: 'MXN', bankName: '[Bank Name TBD]', beneficiaryName: 'VERTAX LIMITED', accountNumber: '[TBD]', localBankCode: '[TBD]', localBankCodeLabel: 'CLABE', swiftCode: '[TBD]', sortOrder: 10 },
  { accountName: 'PHP - Philippines', country: 'Philippines', countryCode: 'PH', flag: '🇵🇭', currency: 'PHP', bankName: '[Bank Name TBD]', beneficiaryName: 'VERTAX LIMITED', accountNumber: '[TBD]', localBankCode: '', localBankCodeLabel: '', swiftCode: '[TBD]', sortOrder: 11 },
  { accountName: 'IDR - Indonesia', country: 'Indonesia', countryCode: 'ID', flag: '🇮🇩', currency: 'IDR', bankName: '[Bank Name TBD]', beneficiaryName: 'VERTAX LIMITED', accountNumber: '[TBD]', localBankCode: '', localBankCodeLabel: '', swiftCode: '[TBD]', sortOrder: 12 },
  { accountName: 'ILS - Israel', country: 'Israel', countryCode: 'IL', flag: '🇮🇱', currency: 'ILS', bankName: '[Bank Name TBD]', beneficiaryName: 'VERTAX LIMITED', accountNumber: '[TBD]', localBankCode: '[TBD]', localBankCodeLabel: 'Branch Code', swiftCode: '[TBD]', sortOrder: 13 },
  { accountName: 'DKK - Denmark', country: 'Denmark', countryCode: 'DK', flag: '🇩🇰', currency: 'DKK', bankName: '[Bank Name TBD]', beneficiaryName: 'VERTAX LIMITED', accountNumber: '[TBD]', localBankCode: '[TBD]', localBankCodeLabel: 'IBAN', swiftCode: '[TBD]', sortOrder: 14 },
]

async function seed() {
  const client = new MongoClient(MONGODB_URI)
  try {
    await client.connect()
    const db = client.db()
    const collection = db.collection('bank-accounts')

    // Check existing
    const existing = await collection.countDocuments()
    if (existing > 0) {
      console.log(`Already ${existing} bank accounts exist. Skipping seed.`)
      return
    }

    const now = new Date().toISOString()
    const docs = bankAccounts.map(acc => ({
      ...acc,
      isActive: true,
      bankAddress: '',
      additionalInfo: '',
      createdAt: now,
      updatedAt: now,
    }))

    const result = await collection.insertMany(docs)
    console.log(`Inserted ${result.insertedCount} bank accounts.`)
  } finally {
    await client.close()
  }
}

seed().catch(console.error)
