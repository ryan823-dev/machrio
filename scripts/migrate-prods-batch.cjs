#!/usr/bin/env node

/**
 * Products Migration - Batched with pauses
 * Processes in small batches with delays to avoid connection issues
 */

const { MongoClient } = require('mongodb');
const https = require('https');
const crypto = require('crypto');

const MONGO_URI = 'mongodb+srv://mroworks_db_user:moore1982@mroworks-dev.gbqxebq.mongodb.net/machrio';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlkZXJoZ2tqY3NhcXJzZm50cHFtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDI0NDU3MiwiZXhwIjoyMDg5ODIwNTcyfQ.aX9EPl9c9NXZ2fUZ1oJSxtTeak67Y8w4cPO97EooaQM';

const BATCH_SIZE = 100;      // Products per batch
const PAUSE_MS = 500;        // Pause between batches
const RETRY_DELAY = 3000;     // Delay on retry
const MAX_RETRIES = 3;

function uuidFromString(str) {
  const hash = crypto.createHash('sha256').update(str || 'default').digest();
  const bytes = Buffer.from(hash.slice(0, 16));
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = bytes.toString('hex');
  return [hex.slice(0,8), hex.slice(8,12), hex.slice(12,16), hex.slice(16,20), hex.slice(20,32)].join('-');
}

async function insertProduct(record) {
  return new Promise((resolve) => {
    const data = JSON.stringify(record);
    const options = {
      hostname: 'yderhgkjcsaqrsfntpqm.supabase.co',
      path: '/rest/v1/products',
      method: 'POST',
      headers: {
        'apikey': SERVICE_KEY,
        'Authorization': 'Bearer ' + SERVICE_KEY,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => resolve(res.statusCode));
    });

    req.on('error', () => resolve(0));
    req.write(data);
    req.end();
  });
}

async function processBatch(docs, startIdx) {
  let newCount = 0;
  let dupCount = 0;
  let errCount = 0;

  for (let i = 0; i < docs.length; i++) {
    const doc = docs[i];
    const record = {
      id: uuidFromString((doc._id?.toString() || '') + 'products'),
      sku: doc.sku,
      name: doc.name,
      status: doc.status || 'draft',
      created_at: doc.createdAt ? new Date(doc.createdAt).toISOString() : new Date().toISOString(),
      updated_at: doc.updatedAt ? new Date(doc.updatedAt).toISOString() : new Date().toISOString()
    };

    const status = await insertProduct(record);
    if (status === 201) newCount++;
    else if (status === 409) dupCount++;
    else errCount++;

    // Progress indicator every 10 items
    if ((i + 1) % 10 === 0) {
      process.stdout.write('.');
    }
  }

  return { newCount, dupCount, errCount };
}

async function migrateProducts() {
  console.log('🚀 Products Migration (Batched)');
  console.log('='.repeat(50));
  console.log(`Batch size: ${BATCH_SIZE}, Pause: ${PAUSE_MS}ms`);

  // Connect to MongoDB
  let client;
  for (let retry = 0; retry < MAX_RETRIES; retry++) {
    try {
      client = new MongoClient(MONGO_URI, { serverSelectionTimeoutMS: 30000 });
      await client.connect();
      console.log('✅ MongoDB connected');
      break;
    } catch (e) {
      if (retry === MAX_RETRIES - 1) {
        console.log('❌ Failed to connect');
        process.exit(1);
      }
      console.log(`Retry ${retry + 1}/${MAX_RETRIES}...`);
      await new Promise(r => setTimeout(r, RETRY_DELAY));
    }
  }

  const mongo = client.db('machrio');
  const total = await mongo.collection('products').countDocuments();
  console.log(`Total products in MongoDB: ${total}`);

  // Get current count in Supabase
  const currentCount = await new Promise((resolve) => {
    const options = {
      hostname: 'yderhgkjcsaqrsfntpqm.supabase.co',
      path: '/rest/v1/products?select=id',
      method: 'GET',
      headers: { 'apikey': SERVICE_KEY, 'Authorization': 'Bearer ' + SERVICE_KEY }
    };
    https.get(options, res => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(body).length); } catch { resolve(0); }
      });
    }).on('error', () => resolve(0));
  });

  console.log(`Current products in Supabase: ${currentCount}`);
  console.log(`Need to migrate: ${total - currentCount}`);
  console.log('');

  let processed = 0;
  let totalNew = 0;
  let totalDup = 0;
  let batchNum = 0;

  while (processed < total) {
    batchNum++;
    const skip = processed;
    let docs;
    let retries = 0;

    // Fetch batch with retry
    while (retries < MAX_RETRIES) {
      try {
        docs = await mongo.collection('products').find({}).skip(skip).limit(BATCH_SIZE).toArray();
        break;
      } catch (e) {
        retries++;
        console.log(`\n⚠️ Batch ${batchNum}: MongoDB error, retry ${retries}/${MAX_RETRIES}`);
        await new Promise(r => setTimeout(r, RETRY_DELAY));
        if (retries >= MAX_RETRIES) {
          processed += BATCH_SIZE; // Skip this batch
          docs = [];
        }
      }
    }

    if (docs.length === 0) continue;

    process.stdout.write(`\nBatch ${batchNum} (${skip}-${skip + docs.length}): `);

    const result = await processBatch(docs, skip);
    totalNew += result.newCount;
    totalDup += result.dupCount;

    processed += docs.length;

    console.log(`\n  → Progress: ${processed}/${total} | New: ${totalNew} | Dup: ${totalDup} | Err: ${result.errCount}`);

    // Pause between batches
    if (processed < total) {
      await new Promise(r => setTimeout(r, PAUSE_MS));
    }
  }

  console.log('\n' + '='.repeat(50));
  console.log(`✅ Migration complete!`);
  console.log(`   New products: ${totalNew}`);
  console.log(`   Duplicates: ${totalDup}`);
  console.log(`   Total in Supabase: ${currentCount + totalNew}`);

  await client.close();
}

migrateProducts().catch(err => {
  console.error('Failed:', err.message);
  process.exit(1);
});
