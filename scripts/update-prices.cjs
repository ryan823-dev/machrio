// Direct MongoDB batch price update script
// Faster than going through Payload API one by one
const { MongoClient } = require('mongodb');
const fs = require('fs');
const path = require('path');

const MONGODB_URI = 'mongodb+srv://mroworks_db_user:SAEvhA4d4A2pzlMX@mroworks-dev.gbqxebq.mongodb.net/mroworks?retryWrites=true&w=majority&appName=mroworks-dev';

async function updatePricing() {
  console.log('=== Batch Price Update ===\n');

  // Read corrected import data
  const importPath = path.join(__dirname, 'import-data.json');
  const products = JSON.parse(fs.readFileSync(importPath, 'utf-8'));
  console.log(`Loaded ${products.length} products from import-data.json`);

  // Connect to MongoDB directly
  console.log('Connecting to MongoDB...');
  const client = new MongoClient(MONGODB_URI);
  await client.connect();
  console.log('Connected!\n');

  const db = client.db('mroworks');
  const productsCollection = db.collection('products');

  // Check current count
  const totalBefore = await productsCollection.countDocuments();
  console.log(`Products in database: ${totalBefore}`);

  // Build bulk update operations
  const bulkOps = products.map(product => ({
    updateOne: {
      filter: { sku: product.sku },
      update: {
        $set: {
          'pricing.basePrice': product.pricing.basePrice,
          'pricing.priceUnit': product.pricing.priceUnit,
          'pricing.currency': 'USD',
          'pricing.tieredPricing': product.pricing.tieredPricing,
        }
      }
    }
  }));

  // Execute in batches of 100
  let updated = 0;
  const batchSize = 100;
  for (let i = 0; i < bulkOps.length; i += batchSize) {
    const batch = bulkOps.slice(i, i + batchSize);
    const result = await productsCollection.bulkWrite(batch);
    updated += result.modifiedCount;
    console.log(`Batch ${Math.floor(i / batchSize) + 1}: ${result.modifiedCount} updated, ${result.matchedCount} matched`);
  }

  console.log(`\n=== Summary ===`);
  console.log(`Total updated: ${updated}`);

  // Verify a few samples
  console.log('\n=== Verification Samples ===');
  const samples = await productsCollection.find({}).limit(5).toArray();
  samples.forEach(p => {
    console.log(`${p.sku}: $${p.pricing?.basePrice} (tier1: $${p.pricing?.tieredPricing?.[0]?.unitPrice})`);
  });

  await client.close();
  console.log('\nDone!');
}

updatePricing().catch(err => {
  console.error('Fatal error:', err.message);
  process.exit(1);
});
