#!/usr/bin/env node

/**
 * Products Migration - Handles duplicates by skipping existing
 */

const { MongoClient } = require('mongodb');
const https = require('https');
const crypto = require('crypto');

const MONGO_URI = 'mongodb+srv://mroworks_db_user:moore1982@mroworks-dev.gbqxebq.mongodb.net/machrio';
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
      res.on('end', () => {
        resolve(res.statusCode);
      });
    });

    req.on('error', () => resolve(0));
    req.write(data);
    req.end();
  });
}

async function migrateProducts() {
  console.log('🚀 Products Migration (Individual Upsert)');
  console.log('='.repeat(50));

  // Connect to MongoDB
  let client;
  for (let retries = 0; retries < 5; retries++) {
    try {
      client = new MongoClient(MONGO_URI);
      await client.connect();
      console.log('✅ MongoDB connected');
      break;
    } catch (e) {
      console.log(`MongoDB retry ${retries + 1}/5...`);
      await new Promise(r => setTimeout(r, 3000));
    }
  }

  const mongo = client.db('machrio');
  const totalCount = await mongo.collection('products').countDocuments();
  console.log(`Total products in MongoDB: ${totalCount}`);

  let success = 0;
  let skipped = 0;
  let errors = 0;

  const cursor = mongo.collection('products').find({});
  let processed = 0;

  for await (const doc of cursor) {
    const record = convertDoc(doc);
    const status = await insertProduct(record);

    if (status === 201 || status === 200) {
      success++;
    } else if (status === 409) {
      // Duplicate SKU - this is expected for re-runs
      skipped++;
    } else {
      errors++;
      if (errors <= 3) {
        console.log(`Error status: ${status}`);
      }
    }

    processed++;
    if (processed % 100 === 0) {
      process.stdout.write(`\r  Progress: ${processed}/${totalCount} (${success} ok, ${skipped} skip, ${errors} err)`);
    }
  }

  console.log(`\n\n✅ Migration complete!`);
  console.log(`   Success: ${success}`);
  console.log(`   Skipped: ${skipped}`);
  console.log(`   Errors: ${errors}`);

  await client.close();
}

migrateProducts().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
