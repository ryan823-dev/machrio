#!/usr/bin/env node

/**
 * Products Migration - Using _id cursor for reliability
 */

const { MongoClient, ObjectId } = require('mongodb');
const https = require('https');
const crypto = require('crypto');

const MONGO_URI = 'mongodb+srv://mroworks_db_user:moore1982@mroworks-dev.gbqxebq.mongodb.net/machrio';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlkZXJoZ2tqY3NhcXJzZm50cHFtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDI0NDU3MiwiZXhwIjoyMDg5ODIwNTcyfQ.aX9EPl9c9NXZ2fUZ1oJSxtTeak67Y8w4cPO97EooaQM';

const BATCH_SIZE = 50;
const PAUSE_MS = 300;

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

async function migrateProducts() {
  console.log('🚀 Products Migration (_id cursor)');
  console.log('='.repeat(50));

  const client = new MongoClient(MONGO_URI, { serverSelectionTimeoutMS: 30000 });
  await client.connect();
  console.log('✅ MongoDB connected');

  const mongo = client.db('machrio');
  const total = await mongo.collection('products').countDocuments();
  console.log(`Total: ${total} products`);

  // Get current count in Supabase (from Content-Range header)
  const currentCount = await new Promise((resolve) => {
    const options = {
      hostname: 'yderhgkjcsaqrsfntpqm.supabase.co',
      path: '/rest/v1/products?select=id',
      method: 'GET',
      headers: { 'apikey': SERVICE_KEY, 'Authorization': 'Bearer ' + SERVICE_KEY, 'Prefer': 'count=exact' }
    };
    https.get(options, res => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        const range = res.headers['content-range'];
        if (range) {
          const match = range.match(/\/(\d+)$/);
          resolve(match ? parseInt(match[1]) : 0);
        } else {
          try { resolve(JSON.parse(body).length); } catch { resolve(0); }
        }
      });
    }).on('error', () => resolve(0));
  });

  console.log(`Already in Supabase: ${currentCount}`);
  console.log('');

  let lastId = null;
  let processed = 0;
  let newCount = 0;
  let batchNum = 0;

  while (processed < total - currentCount) {  // Only process what we need
    batchNum++;
    let query = {};
    if (lastId) {
      query._id = { $gt: new ObjectId(lastId) };
    }

    const docs = await mongo.collection('products')
      .find(query)
      .sort({ _id: 1 })
      .limit(BATCH_SIZE)
      .toArray();

    if (docs.length === 0) break;

    let batchNew = 0;
    let batchDup = 0;
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
        batchNew++;
        newCount++;
      } else if (status === 409) {
        batchDup++;
      }
    }

    lastId = docs[docs.length - 1]._id.toString();
    processed += docs.length;

    console.log(`Batch ${batchNum}: ${batchNew} new, ${batchDup} dup | progress: ${processed}/${total - currentCount}`);

    await new Promise(r => setTimeout(r, PAUSE_MS));
  }

  console.log('\n' + '='.repeat(50));
  console.log(`✅ Done! ${newCount} new products migrated`);
  console.log(`   Total in Supabase: ${currentCount + newCount}`);

  await client.close();
}

migrateProducts().catch(err => {
  console.error('Failed:', err.message);
  process.exit(1);
});
