#!/usr/bin/env node

/**
 * Products Migration - Simple & Stable
 */

const { MongoClient } = require('mongodb');
const https = require('https');
const crypto = require('crypto');

const MONGO_URI = 'mongodb+srv://mroworks_db_user:moore1982@mroworks-dev.gbqxebq.mongodb.net/machrio';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlkZXJoZ2tqY3NhcXJzZm50cHFtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDI0NDU3MiwiZXhwIjoyMDg5ODIwNTcyfQ.aX9EPl9c9NXZ2fUZ1oJSxtTeak67Y8w4cPO97EooaQM';

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

async function migrateBatch(mongo, skip, limit) {
  const docs = await mongo.collection('products').find({}).skip(skip).limit(limit).toArray();

  let success = 0;
  let skipCount = 0;
  for (const doc of docs) {
    const record = {
      id: uuidFromString((doc._id?.toString() || '') + 'products'),
      sku: doc.sku,
      name: doc.name,
      status: doc.status || 'draft',
      created_at: doc.createdAt ? new Date(doc.createdAt).toISOString() : new Date().toISOString(),
      updated_at: doc.updatedAt ? new Date(doc.updatedAt).toISOString() : new Date().toISOString()
    };

    const status = await insertProduct(record);
    if (status === 201) {
      success++;
    } else if (status === 409) {
      skipCount++;  // Duplicate
    }
  }

  return { docs: docs.length, success, skipCount };
}

async function migrateProducts() {
  console.log('🚀 Products Migration');
  console.log('='.repeat(50));

  // Connect
  let client;
  for (let retry = 0; retry < 5; retry++) {
    try {
      client = new MongoClient(MONGO_URI, { serverSelectionTimeoutMS: 30000 });
      await client.connect();
      console.log('✅ Connected to MongoDB');
      break;
    } catch (e) {
      console.log(`Retry ${retry + 1}/5...`);
      await new Promise(r => setTimeout(r, 3000));
    }
  }

  const mongo = client.db('machrio');
  const total = await mongo.collection('products').countDocuments();
  console.log(`Total: ${total} products`);

  let processed = 0;
  let success = 0;
  let skipped = 0;
  const BATCH = 50;

  while (processed < total) {
    try {
      const result = await migrateBatch(mongo, processed, BATCH);
      success += result.success;
      skipped += result.skipCount;
      processed += result.docs;
      process.stdout.write(`\r  ${processed}/${total} (${success} new, ${skipped} dup)`);
    } catch (e) {
      console.log('\nBatch error, retrying...');
      await new Promise(r => setTimeout(r, 2000));
    }
  }

  console.log(`\n\n✅ Done! ${success} new, ${skipped} duplicates skipped`);
  await client.close();
}

migrateProducts().catch(err => {
  console.error('Failed:', err.message);
  process.exit(1);
});
