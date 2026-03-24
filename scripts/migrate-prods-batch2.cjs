#!/usr/bin/env node

/**
 * Products Migration - Batch insert for speed
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

async function getExistingSkus() {
  const skus = new Set();
  let offset = 0;
  const limit = 1000;

  console.log('Fetching existing SKUs...');
  while (true) {
    const result = await new Promise((resolve) => {
      const options = {
        hostname: 'yderhgkjcsaqrsfntpqm.supabase.co',
        path: `/rest/v1/products?select=sku&limit=${limit}&offset=${offset}`,
        method: 'GET',
        headers: { 'apikey': SERVICE_KEY, 'Authorization': 'Bearer ' + SERVICE_KEY }
      };
      https.get(options, res => {
        let body = '';
        res.on('data', chunk => body += chunk);
        res.on('end', () => resolve(body));
      }).on('error', () => resolve('[]'));
    });

    try {
      const products = JSON.parse(result);
      if (products.length === 0) break;
      products.forEach(p => skus.add(p.sku));
      offset += limit;
      if (products.length < limit) break;
    } catch { break; }
  }

  console.log(`Found ${skus.size} existing SKUs`);
  return skus;
}

async function batchInsert(records) {
  return new Promise((resolve) => {
    const data = JSON.stringify(records);
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

    const req = https.request(options, res => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => resolve(res.statusCode));
    });

    req.on('error', () => resolve(0));
    req.write(data);
    req.end();
  });
}

async function connectMongo() {
  for (let retry = 0; retry < 5; retry++) {
    try {
      const client = new MongoClient(MONGO_URI, { serverSelectionTimeoutMS: 30000, socketTimeoutMS: 45000 });
      await client.connect();
      return client;
    } catch (e) {
      console.log(`MongoDB retry ${retry + 1}/5...`);
      await new Promise(r => setTimeout(r, 3000));
    }
  }
  throw new Error('Could not connect to MongoDB');
}

async function migrateProducts() {
  console.log('🚀 Products Migration (Batch)');
  console.log('='.repeat(50));

  const existingSkus = await getExistingSkus();

  let client = await connectMongo();
  console.log('✅ MongoDB connected');

  const mongo = client.db('machrio');
  const total = await mongo.collection('products').countDocuments();
  console.log(`Total in MongoDB: ${total}`);
  console.log(`Need to migrate: ${total - existingSkus.size}`);
  console.log('');

  let processed = 0;
  let newCount = 0;
  let batchNum = 0;
  const BATCH_SIZE = 200;

  while (processed < total) {
    batchNum++;
    let docs;

    try {
      docs = await mongo.collection('products')
        .find({ sku: { $nin: Array.from(existingSkus) } })
        .limit(BATCH_SIZE)
        .toArray();
    } catch (e) {
      console.log('⚠️ MongoDB error, reconnecting...');
      client = await connectMongo();
      continue;
    }

    if (!docs || docs.length === 0) break;

    const records = docs.map(doc => ({
      id: uuidFromString(doc._id.toString() + 'products'),
      sku: doc.sku,
      name: doc.name,
      status: doc.status || 'draft',
      created_at: doc.createdAt ? new Date(doc.createdAt).toISOString() : new Date().toISOString(),
      updated_at: doc.updatedAt ? new Date(doc.updatedAt).toISOString() : new Date().toISOString()
    }));

    const status = await batchInsert(records);
    const success = (status === 201 || status === 200) ? records.length : 0;
    newCount += success;
    processed += docs.length;

    console.log(`Batch ${batchNum}: +${success} | Total: ${processed}/${total}`);
    docs.forEach(d => existingSkus.add(d.sku));
  }

  console.log('\n' + '='.repeat(50));
  console.log(`✅ Done! Migrated: ${newCount}, Total in Supabase: ${existingSkus.size}`);
  await client.close();
}

migrateProducts().catch(err => {
  console.error('Failed:', err.message);
  process.exit(1);
});
