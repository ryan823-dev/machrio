#!/usr/bin/env node

/**
 * MongoDB to Supabase Migration Script (v3)
 * Maps fields correctly to existing Supabase schema
 */

const { MongoClient } = require('mongodb');
const https = require('https');
const crypto = require('crypto');

const SUPABASE_URL = 'https://yderhgkjcsaqrsfntpqm.supabase.co';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlkZXJoZ2tqY3NhcXJzZm50cHFtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDI0NDU3MiwiZXhwIjoyMDg5ODIwNTcyfQ.aX9EPl9c9NXZ2fUZ1oJSxtTeak67Y8w4cPO97EooaQM';
const MONGO_URI = 'mongodb+srv://mroworks_db_user:moore1982@mroworks-dev.gbqxebq.mongodb.net/machrio';

// Only map fields that exist in Supabase tables
const FIELD_MAPS = {
  products: {
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
    'shippingInfo': 'shipping_info',
    'createdAt': 'created_at',
    'updatedAt': 'updated_at'
  },
  articles: {
    'title': 'title',
    'slug': 'slug',
    'excerpt': 'description',
    'content': 'content',
    'category': 'category',
    'tags': 'tags',
    'featuredImage': 'featured_image',
    'author': 'author',
    'status': 'status',
    'publishedAt': 'published_at',
    'metaTitle': 'meta_title',
    'metaDescription': 'meta_description',
    'createdAt': 'created_at',
    'updatedAt': 'updated_at'
  },
  brands: {
    'name': 'name',
    'slug': 'slug',
    'description': 'description',
    'logo': 'logo',
    'website': 'website',
    'createdAt': 'created_at',
    'updatedAt': 'updated_at'
  }
};

// Generate UUID from string (valid UUID v4 format)
function uuidFromString(str) {
  const hash = crypto.createHash('sha256').update(str || 'default').digest();
  const bytes = Buffer.from(hash.slice(0, 16));
  // Set version (4) and variant bits
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = bytes.toString('hex');
  return [hex.slice(0,8), hex.slice(8,12), hex.slice(12,16), hex.slice(16,20), hex.slice(20,32)].join('-');
}

// REST API helper
function apiRequest(method, endpoint, data = null, extraHeaders = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(endpoint, SUPABASE_URL);
    const options = {
      hostname: url.hostname,
      port: 443,
      path: url.pathname + url.search,
      method: method,
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

// Convert MongoDB document
function convertDoc(doc, fieldMap, table) {
  const record = {};

  // Generate UUID from MongoDB _id
  const mongoId = doc._id?.$oid || doc._id?.toString() || '';
  record.id = uuidFromString(mongoId + table);

  for (const [mongoField, supabaseField] of Object.entries(fieldMap)) {
    if (doc[mongoField] !== undefined) {
      let value = doc[mongoField];

      // Convert MongoDB dates
      if (value && typeof value === 'object' && value.$date) {
        value = new Date(value.$date).toISOString();
      }

      // Convert arrays of objects with $oid
      if (Array.isArray(value)) {
        value = value.map(item => {
          if (item && typeof item === 'object' && item.$oid) {
            return item.$oid;
          }
          if (item && typeof item === 'object') {
            return JSON.stringify(item);
          }
          return item;
        });
      }

      // Convert single $oid
      if (value && typeof value === 'object' && value.$oid) {
        value = value.$oid;
      }

      // Convert nested objects to JSON string
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        value = JSON.stringify(value);
      }

      record[supabaseField] = value;
    }
  }

  return record;
}

// Batch insert
async function batchInsert(table, records) {
  let success = 0;
  let failed = 0;
  const batchSize = 50;

  for (let i = 0; i < records.length; i += batchSize) {
    const batch = records.slice(i, i + batchSize);

    try {
      await apiRequest('POST', `/rest/v1/${table}`, batch, {
        'Prefer': 'resolution=merge-duplicates',
        'On Conflict': 'slug'
      });
      success += batch.length;
    } catch (err) {
      // Try one by one
      for (const record of batch) {
        try {
          await apiRequest('POST', `/rest/v1/${table}`, record, {
            'Prefer': 'resolution=merge-duplicates'
          });
          success++;
        } catch (e) {
          failed++;
          if (failed <= 5) {
            console.log(`    Error: ${e.message.substring(0, 100)}`);
          }
        }
      }
    }

    process.stdout.write(`\r  Progress: ${Math.min(i + batchSize, records.length)}/${records.length}`);
  }

  console.log();
  return { success, failed };
}

async function migrateCollection(mongo, table) {
  console.log(`\n📦 Migrating ${table}...`);

  const docs = await mongo.collection(table).find({}).toArray();
  console.log(`  📄 Found ${docs.length} records`);

  if (docs.length === 0) return { success: 0, failed: 0 };

  const fieldMap = FIELD_MAPS[table];
  const records = docs.map(doc => convertDoc(doc, fieldMap, table));
  console.log(`  🔄 Converted ${records.length} records`);

  const result = await batchInsert(table, records);
  console.log(`  ✅ Success: ${result.success}, Failed: ${result.failed}`);

  return result;
}

async function main() {
  console.log('🚀 MongoDB to Supabase Migration (v3)');
  console.log('='.repeat(60));

  // Connect to MongoDB
  console.log('\n1️⃣  Connecting to MongoDB...');
  const mongoClient = new MongoClient(MONGO_URI);
  await mongoClient.connect();
  const mongo = mongoClient.db('machrio');
  console.log('  ✅ Connected');

  // Test Supabase
  console.log('\n2️⃣  Testing Supabase...');
  try {
    await apiRequest('GET', '/rest/v1/');
    console.log('  ✅ Connected');
  } catch (err) {
    console.error('  ❌ Failed:', err.message);
    process.exit(1);
  }

  // Migrate
  console.log('\n3️⃣  Starting migration...');
  const collections = ['brands', 'articles', 'products'];
  const results = {};

  for (const col of collections) {
    try {
      results[col] = await migrateCollection(mongo, col);
    } catch (err) {
      console.error(`  ❌ ${col} failed:`, err.message);
      results[col] = { success: 0, failed: 0 };
    }
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 Migration Summary:');
  let total = 0;
  for (const [col, r] of Object.entries(results)) {
    const emoji = r.success > 0 ? '✅' : '❌';
    console.log(`  ${emoji} ${col}: ${r.success} success, ${r.failed} failed`);
    total += r.success;
  }
  console.log(`\nTotal: ${total} records migrated`);

  await mongoClient.close();
  console.log('🎉 Done!');
}

main().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
