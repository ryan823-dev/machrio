#!/usr/bin/env node

/**
 * Export products from MongoDB with retry logic
 */

const { MongoClient } = require('mongodb');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const MONGO_URI = 'mongodb+srv://mroworks_db_user:moore1982@mroworks-dev.gbqxebq.mongodb.net/machrio';
const SUPABASE_URL = 'https://yderhgkjcsaqrsfntpqm.supabase.co';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlkZXJoZ2tqY3NhcXJzZm50cHFtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDI0NDU3MiwiZXhwIjoyMDg5ODIwNTcyfQ.aX9EPl9c9NXZ2fUZ1oJSxtTeak67Y8w4cPO97EooaQM';

const FIELD_MAP = {
  'name': 'name',
  'slug': 'slug',
  'sku': 'sku',
  'status': 'status',
  'shortDescription': 'short_description',
  'fullDescription': 'full_description',
  'purchaseMode': 'purchase_mode',
  'pricing': 'pricing',
  'availability': 'availability',
  'minOrderQuantity': 'min_order_quantity',
  'packageQty': 'package_qty',
  'packageUnit': 'package_unit',
  'weight': 'weight',
  'specifications': 'specifications',
  'faq': 'faq',
  'images': 'images',
  'externalImageUrl': 'external_image_url',
  'additionalImageUrls': 'additional_image_urls',
  'categories': 'categories',
  'tags': 'tags',
  'metaTitle': 'meta_title',
  'metaDescription': 'meta_description',
  'focusKeyword': 'focus_keyword',
  'sourceUrl': 'source_url',
  'shippingInfo': 'shipping_info'
};

function uuidFromString(str) {
  const hash = crypto.createHash('sha256').update(str || 'default').digest();
  const bytes = Buffer.from(hash.slice(0, 16));
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = bytes.toString('hex');
  return [hex.slice(0,8), hex.slice(8,12), hex.slice(12,16), hex.slice(16,20), hex.slice(20,32)].join('-');
}

function convertDoc(doc) {
  const record = {};
  record.id = uuidFromString((doc._id?.toString() || '') + 'products');
  record.created_at = doc.createdAt ? new Date(doc.createdAt).toISOString() : new Date().toISOString();
  record.updated_at = doc.updatedAt ? new Date(doc.updatedAt).toISOString() : new Date().toISOString();

  for (const [mongoField, supabaseField] of Object.entries(FIELD_MAP)) {
    if (doc[mongoField] !== undefined) {
      let value = doc[mongoField];

      if (value && typeof value === 'object' && value.$date) {
        value = new Date(value.$date).toISOString();
      }

      if (Array.isArray(value)) {
        value = value.map(item => {
          if (item && typeof item === 'object' && item.$oid) return item.$oid;
          if (item && typeof item === 'object') return JSON.stringify(item);
          return item;
        });
      } else if (value && typeof value === 'object' && value.$oid) {
        value = value.$oid;
      } else if (value && typeof value === 'object') {
        value = JSON.stringify(value);
      }

      record[supabaseField] = value;
    }
  }

  return record;
}

// Supabase API
function apiRequest(method, endpoint, data = null, extraHeaders = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(endpoint, SUPABASE_URL);
    const options = {
      hostname: url.hostname,
      port: 443,
      path: url.pathname + url.search,
      method,
      headers: {
        'apikey': SERVICE_KEY,
        'Authorization': `Bearer ${SERVICE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': data ? 'return=representation' : 'return=minimal',
        ...extraHeaders
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const result = body ? JSON.parse(body) : null;
          if (res.statusCode >= 400) {
            reject(new Error(`HTTP ${res.statusCode}: ${JSON.stringify(result)?.substring(0, 200)}`));
          } else {
            resolve(result);
          }
        } catch (e) {
          resolve(body);
        }
      });
    });

    req.on('error', reject);
    if (data) req.write(JSON.stringify(data));
    req.end();
  });
}

const https = require('https');

async function migrateWithRetry(collection, batchSize = 50, maxRetries = 3) {
  let totalSuccess = 0;
  let totalFailed = 0;
  let skip = 0;

  while (true) {
    let docs;
    let retries = 0;

    while (retries < maxRetries) {
      try {
        const client = new MongoClient(MONGO_URI);
        await client.connect();
        const mongo = client.db('machrio');
        docs = await mongo.collection(collection).find({}).skip(skip).limit(batchSize).toArray();
        await client.close();
        break;
      } catch (err) {
        retries++;
        console.log(`  Retry ${retries}/${maxRetries} for batch starting at ${skip}...`);
        await new Promise(r => setTimeout(r, 2000 * retries));
      }
    }

    if (!docs || docs.length === 0) break;

    const records = docs.map(convertDoc);
    let success = 0;
    let failed = 0;

    // Insert batch
    try {
      await apiRequest('POST', '/rest/v1/products', records, {
        'Prefer': 'resolution=merge-duplicates',
        'On Conflict': 'slug'
      });
      success = records.length;
    } catch (err) {
      // Try one by one
      for (const record of records) {
        try {
          await apiRequest('POST', '/rest/v1/products', record, {
            'Prefer': 'resolution=merge-duplicates'
          });
          success++;
        } catch (e) {
          failed++;
        }
      }
    }

    totalSuccess += success;
    totalFailed += failed;
    skip += batchSize;

    process.stdout.write(`\r  Progress: ${skip} products migrated (${totalSuccess} success, ${totalFailed} failed)`);

    if (docs.length < batchSize) break;
  }

  console.log();
  return { success: totalSuccess, failed: totalFailed };
}

async function main() {
  console.log('🚀 Products Migration with Retry');
  console.log('='.repeat(60));

  // First check current count in Supabase
  console.log('\n1️⃣  Checking current state...');
  try {
    const res = await apiRequest('GET', '/rest/v1/products?select=id');
    console.log(`  Products in Supabase: ${Array.isArray(res) ? res.length : 'unknown'}`);
  } catch (e) {
    console.log('  Could not check count');
  }

  // Count in MongoDB
  console.log('\n2️⃣  Counting MongoDB products...');
  let mongoCount = 0;
  for (let retries = 0; retries < 3; retries++) {
    try {
      const client = new MongoClient(MONGO_URI);
      await client.connect();
      mongoCount = await client.db('machrio').collection('products').countDocuments();
      await client.close();
      break;
    } catch (e) {
      console.log(`  Retry ${retries + 1}/3...`);
      await new Promise(r => setTimeout(r, 2000));
    }
  }
  console.log(`  MongoDB products: ${mongoCount}`);

  // Start migration
  console.log('\n3️⃣  Migrating products...');
  const result = await migrateWithRetry('products', 100);

  console.log('\n' + '='.repeat(60));
  console.log(`✅ Success: ${result.success}, Failed: ${result.failed}`);
  console.log('🎉 Done!');
}

main().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
