#!/usr/bin/env node

/**
 * MongoDB to Supabase Migration Script
 * Maps MongoDB fields to Supabase schema
 */

const { MongoClient } = require('mongodb');
const https = require('https');

const SUPABASE_URL = 'https://yderhgkjcsaqrsfntpqm.supabase.co';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlkZXJoZ2tqY3NhcXJzZm50cHFtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDI0NDU3MiwiZXhwIjoyMDg5ODIwNTcyfQ.aX9EPl9c9NXZ2fUZ1oJSxtTeak67Y8w4cPO97EooaQM';
const MONGO_URI = 'mongodb+srv://mroworks_db_user:moore1982@mroworks-dev.gbqxebq.mongodb.net/machrio';

// Field mapping: MongoDB field -> Supabase field
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
    'externalImageUrl': 'external_image_url',
    'shippingInfo': 'shipping_info',
    'specifications': 'specifications',
    'faq': 'faq',
    'sourceUrl': 'source_url',
    'primaryCategory': 'primary_category_id',
    'categories': 'categories',
    'brand': 'brand_id',
    'seo': 'seo',
    'facets': 'facets',
    'industries': 'industries',
    'packageQty': 'package_qty',
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
    'author': 'author',
    'status': 'status',
    'publishedAt': 'published_at',
    'seo': 'seo',
    'relatedCategories': 'related_categories',
    'readingTime': 'reading_time',
    'featuredImage': 'featured_image',
    'createdAt': 'created_at',
    'updatedAt': 'updated_at'
  },
  brands: {
    'name': 'name',
    'slug': 'slug',
    'description': 'description',
    'logo': 'logo',
    'website': 'website',
    'featured': 'featured',
    'seo': 'seo',
    'createdAt': 'created_at',
    'updatedAt': 'updated_at'
  }
};

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
            reject(new Error(`HTTP ${res.statusCode}: ${JSON.stringify(result)?.substring(0, 300)}`));
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

// Convert MongoDB document to Supabase format
function convertDoc(doc, fieldMap) {
  const record = {};

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
          // Keep objects as JSON string
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
      if (value && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date)) {
        value = JSON.stringify(value);
      }

      record[supabaseField] = value;
    }
  }

  return record;
}

// Batch upsert
async function batchUpsert(table, records) {
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
            console.log(`    Error: ${e.message.substring(0, 120)}`);
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
  const records = docs.map(doc => convertDoc(doc, fieldMap));
  console.log(`  🔄 Converted ${records.length} records`);

  const result = await batchUpsert(table, records);
  console.log(`  ✅ Success: ${result.success}, Failed: ${result.failed}`);

  return result;
}

async function main() {
  console.log('🚀 MongoDB to Supabase Migration');
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
