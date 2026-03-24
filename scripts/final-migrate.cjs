#!/usr/bin/env node

/**
 * MongoDB to Supabase Migration Script (Final)
 * Efficient batch migration with upsert support
 */

const { MongoClient } = require('mongodb');
const https = require('https');

const SUPABASE_URL = 'https://yderhgkjcsaqrsfntpqm.supabase.co';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlkZXJoZ2tqY3NhcXJzZm50cHFtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDI0NDU3MiwiZXhwIjoyMDg5ODIwNTcyfQ.aX9EPl9c9NXZ2fUZ1oJSxtTeak67Y8w4cPO97EooaQM';
const MONGO_URI = 'mongodb+srv://mroworks_db_user:moore1982@mroworks-dev.gbqxebq.mongodb.net/machrio';

// Schema whitelist for each collection
const SCHEMAS = {
  products: ['sku', 'name', 'slug', 'short_description', 'full_description', 'primary_category_id',
    'status', 'availability', 'purchase_mode', 'lead_time', 'min_order_quantity', 'package_qty',
    'package_unit', 'weight', 'pricing', 'specifications', 'faq', 'images', 'external_image_url',
    'additional_image_urls', 'categories', 'tags', 'meta_title', 'meta_description', 'focus_keyword',
    'source_url', 'shipping_info', 'created_at', 'updated_at', 'brand_id', 'featured'],
  articles: ['title', 'slug', 'description', 'content', 'category', 'tags', 'featured_image',
    'author', 'status', 'published_at', 'meta_title', 'meta_description', 'created_at', 'updated_at'],
  brands: ['name', 'slug', 'description', 'logo', 'website', 'created_at', 'updated_at']
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
    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

// Convert MongoDB document to Supabase format
function convertDoc(doc, schema) {
  const record = {};

  // DO NOT set id manually - let Supabase auto-generate UUID
  // MongoDB ObjectId (24 chars) is not valid PostgreSQL UUID format

  // Map allowed fields
  for (const field of schema) {
    if (doc[field] !== undefined) {
      let value = doc[field];

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
          return item;
        });
      }

      // Convert single $oid
      if (value && typeof value === 'object' && value.$oid) {
        value = value.$oid;
      }

      record[field] = value;
    }
  }

  return record;
}

// Batch upsert to Supabase
async function batchUpsert(table, records, batchSize = 100) {
  let success = 0;
  let failed = 0;

  for (let i = 0; i < records.length; i += batchSize) {
    const batch = records.slice(i, i + batchSize);

    try {
      // Try upsert with slug as conflict target
      const result = await apiRequest('POST', `/rest/v1/${table}`, batch, {
        'Prefer': 'resolution=merge-duplicates',
        'On Conflict': 'slug'
      });

      success += batch.length;
    } catch (err) {
      // Fallback to individual inserts
      for (const record of batch) {
        try {
          await apiRequest('POST', `/rest/v1/${table}`, record, {
            'Prefer': 'resolution=merge-duplicates'
          });
          success++;
        } catch (e) {
          failed++;
          if (failed <= 3) {
            console.log(`    Error: ${e.message.substring(0, 80)}`);
          }
        }
      }
    }

    if ((i / batchSize) % 10 === 0) {
      process.stdout.write(`\r  Progress: ${Math.min(i + batchSize, records.length)}/${records.length}`);
    }
  }

  console.log(`\r  Progress: ${records.length}/${records.length} ✅`);
  return { success, failed };
}

async function migrateCollection(mongo, table) {
  console.log(`\n📦 Migrating ${table}...`);

  const mongoTable = table; // MongoDB collection name
  const schema = SCHEMAS[table];

  // Get all documents from MongoDB
  const docs = await mongo.collection(mongoTable).find({}).toArray();
  console.log(`  📄 Found ${docs.length} records in MongoDB`);

  if (docs.length === 0) {
    return { success: 0, failed: 0 };
  }

  // Convert to Supabase format
  const records = docs.map(doc => convertDoc(doc, schema));
  console.log(`  🔄 Converted ${records.length} records`);

  // Batch upsert
  const result = await batchUpsert(table, records);
  console.log(`  ✅ Success: ${result.success}, Failed: ${result.failed}`);

  return result;
}

async function main() {
  console.log('🚀 MongoDB to Supabase Migration (Final)');
  console.log('='.repeat(60));

  // Connect to MongoDB
  console.log('\n1️⃣  Connecting to MongoDB...');
  const mongoClient = new MongoClient(MONGO_URI);
  await mongoClient.connect();
  const mongo = mongoClient.db('machrio');
  console.log('  ✅ MongoDB connected');

  // Test Supabase
  console.log('\n2️⃣  Testing Supabase connection...');
  try {
    await apiRequest('GET', '/rest/v1/');
    console.log('  ✅ Supabase REST API connected');
  } catch (err) {
    console.error('  ❌ Supabase connection failed:', err.message);
    process.exit(1);
  }

  // Migrate collections
  console.log('\n3️⃣  Starting migration...');
  const collections = ['brands', 'articles', 'products'];
  const results = {};

  for (const col of collections) {
    try {
      results[col] = await migrateCollection(mongo, col);
    } catch (err) {
      console.error(`  ❌ ${col} failed:`, err.message);
      results[col] = { success: 0, failed: 0, error: err.message };
    }
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 Migration Summary:');
  let totalSuccess = 0;
  let totalFailed = 0;

  for (const [col, result] of Object.entries(results)) {
    const status = result.success > 0 ? '✅' : '❌';
    console.log(`  ${status} ${col}: ${result.success} success, ${result.failed} failed`);
    totalSuccess += result.success;
    totalFailed += result.failed;
  }

  console.log('\n' + '='.repeat(60));
  console.log(`Total: ✅ ${totalSuccess} migrated, ❌ ${totalFailed} failed`);

  await mongoClient.close();
  console.log('\n🎉 Migration complete!');
}

main().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
