#!/usr/bin/env node

/**
 * MongoDB to Supabase Migration - Products Only
 * Products table doesn't have slug, so uses plain INSERT
 */

const { MongoClient } = require('mongodb');
const https = require('https');
const crypto = require('crypto');

const MONGO_URI = 'mongodb+srv://mroworks_db_user:moore1982@mroworks-dev.gbqxebq.mongodb.net/machrio';
const SUPABASE_URL = 'https://yderhgkjcsaqrsfntpqm.supabase.co';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlkZXJoZ2tqY3NhcXJzZm50cHFtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDI0NDU3MiwiZXhwIjoyMDg5ODIwNTcyfQ.aX9EPl9c9NXZ2fUZ1oJSxtTeak67Y8w4cPO97EooaQM';

const FIELD_MAP = {
  'name': 'name',
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
  'shippingInfo': 'shipping_info',
  'primaryCategory': 'primary_category_id'
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
  const record = {
    id: uuidFromString((doc._id?.toString() || '') + 'products'),
    created_at: doc.createdAt ? new Date(doc.createdAt).toISOString() : new Date().toISOString(),
    updated_at: doc.updatedAt ? new Date(doc.updatedAt).toISOString() : new Date().toISOString()
  };

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

function apiRequest(method, endpoint, data = null) {
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
        'Prefer': 'return=minimal'
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        if (res.statusCode >= 400) {
          reject(new Error(`HTTP ${res.statusCode}: ${body.substring(0, 200)}`));
        } else {
          resolve(res.statusCode);
        }
      });
    });

    req.on('error', reject);
    if (data) req.write(JSON.stringify(data));
    req.end();
  });
}

async function migrateBatch(batch) {
  const records = batch.map(convertDoc);
  await apiRequest('POST', '/rest/v1/products', records);
}

async function migrateProducts() {
  console.log('🚀 Products Migration');
  console.log('='.repeat(50));

  let client;
  for (let retries = 0; retries < 3; retries++) {
    try {
      client = new MongoClient(MONGO_URI);
      await client.connect();
      break;
    } catch (e) {
      console.log(`MongoDB retry ${retries + 1}/3...`);
      await new Promise(r => setTimeout(r, 3000));
    }
  }

  const mongo = client.db('machrio');
  const totalCount = await mongo.collection('products').countDocuments();
  console.log(`Total products in MongoDB: ${totalCount}`);

  const BATCH_SIZE = 100;
  let processed = 0;
  let success = 0;
  let errors = 0;

  const cursor = mongo.collection('products').find({});
  let batch = [];

  for await (const doc of cursor) {
    batch.push(doc);

    if (batch.length >= BATCH_SIZE) {
      try {
        await migrateBatch(batch);
        success += batch.length;
      } catch (e) {
        errors += batch.length;
        if (errors <= 3) console.log(`Error: ${e.message.substring(0, 100)}`);
      }

      processed += batch.length;
      process.stdout.write(`\r  Progress: ${processed}/${totalCount} (${success} ok, ${errors} err)`);
      batch = [];
    }
  }

  // Process remaining
  if (batch.length > 0) {
    try {
      await migrateBatch(batch);
      success += batch.length;
    } catch (e) {
      errors += batch.length;
    }
    processed += batch.length;
  }

  console.log(`\n\n✅ Done: ${success} success, ${errors} errors`);

  await client.close();
}

migrateProducts().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
