#!/usr/bin/env node

/**
 * Fixed MongoDB → Supabase Migration Tool
 * 
 * Fixes:
 * - Uses PostgreSQL uuid_generate_v4() for IDs
 * - Properly handles JSON fields
 * - Better error reporting
 * 
 * Usage:
 *   node scripts/fixed-migrate.cjs
 */

const { MongoClient } = require('mongodb');
const https = require('https');
const fs = require('fs');
const path = require('path');

// Configuration
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://mroworks_db_user:moore1982@mroworks-dev.gbqxebq.mongodb.net/machrio';
const SUPABASE_URL = 'https://yderhgkjcsaqrsfntpqm.supabase.co';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlkZXJoZ2tqY3NhcXJzZm50cHFtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDI0NDU3MiwiZXhwIjoyMDg5ODIwNTcyfQ.aX9EPl9c9NXZ2fUZ1oJSxtTeak67Y8w4cPO97EooaQM';
const COLLECTIONS = ['categories', 'products', 'articles', 'brands'];

// Load DATABASE_URI
const envPath = path.join(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  const dbMatch = envContent.match(/DATABASE_URI=(.+)/);
  if (dbMatch) {
    console.log('✅ Loaded DATABASE_URI');
  }
}

// REST API helper
function supabaseRequest(method, endpoint, data = null) {
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
        'Prefer': 'return=representation'
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve({ 
            status: res.statusCode, 
            data: body ? JSON.parse(body) : null,
            headers: res.headers 
          });
        } else {
          try {
            const error = JSON.parse(body);
            reject(new Error(`HTTP ${res.statusCode}: ${error.message}`));
          } catch (e) {
            reject(new Error(`HTTP ${res.statusCode}: ${body.substring(0, 100)}`));
          }
        }
      });
    });

    req.on('error', reject);
    if (data) req.write(JSON.stringify(data));
    req.end();
  });
}

// Transform MongoDB document - DON'T include id field, let PostgreSQL generate it
function transformDoc(doc) {
  const record = {};
  
  for (const [key, value] of Object.entries(doc)) {
    if (key === '_id') continue;
    
    const snakeKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
    
    if (key === 'parent' && value) {
      // Set parent_id to NULL - relationships will be fixed later
      record.parent_id = null;
    } else if (key === 'createdAt' && value) {
      record.created_at = value;
    } else if (key === 'updatedAt' && value) {
      record.updated_at = value;
    } else if (key === 'publishedAt' && value) {
      record.published_at = value;
    } else if (value && typeof value === 'object' && value.$oid) {
      // Skip ObjectId references
      record[snakeKey] = null;
    } else {
      record[snakeKey] = value;
    }
  }
  
  return record;
}

// Migrate collection
async function migrateCollection(mongoDb, collectionName) {
  console.log(`\n📦 Migrating ${collectionName}...`);
  
  const collection = mongoDb.collection(collectionName);
  const count = await collection.countDocuments();
  console.log(`  📊 Found ${count} records`);
  
  if (count === 0) {
    console.log('  ⚠️  No data to migrate');
    return { success: 0, failed: 0 };
  }
  
  const documents = await collection.find({}).toArray();
  
  // Clear existing data
  try {
    await supabaseRequest('DELETE', `/rest/v1/${collectionName}?gt=0`);
    console.log('  🗑️  Cleared existing data');
  } catch (err) {
    console.log('  ℹ️  Table may be empty');
  }
  
  // Insert one by one with detailed error reporting
  let success = 0;
  let failed = 0;
  const errors = [];
  
  for (let i = 0; i < documents.length; i++) {
    const doc = documents[i];
    const record = transformDoc(doc);
    
    try {
      const result = await supabaseRequest('POST', `/rest/v1/${collectionName}`, record);
      success++;
      
      if (success % 100 === 0) {
        console.log(`  → Progress: ${success}/${count} (${Math.round(success/count*100)}%)`);
      }
    } catch (err) {
      failed++;
      if (failed <= 5) {
        console.log(`  ❌ ${collectionName}[${i}]: ${err.message}`);
        errors.push({ index: i, error: err.message, doc: doc });
      }
    }
  }
  
  console.log(`  ✅ Success: ${success}, Failed: ${failed}`);
  
  if (failed > 0 && errors.length > 0) {
    console.log('  First errors:');
    errors.slice(0, 3).forEach(e => {
      console.log(`    - Index ${e.index}: ${e.error}`);
    });
  }
  
  return { success, failed };
}

async function main() {
  console.log('🚀 Fixed MongoDB → Supabase Migration');
  console.log('='.repeat(70));
  
  // Check tables exist
  console.log('\n1️⃣  Checking Supabase...');
  try {
    const result = await supabaseRequest('GET', '/rest/v1/categories?limit=1');
    console.log('  ✅ Tables exist');
  } catch (err) {
    console.log('  ❌ Tables do not exist. Run SQL first!');
    process.exit(1);
  }
  
  // Connect to MongoDB
  console.log('\n2️⃣  Connecting to MongoDB...');
  let mongoClient;
  try {
    mongoClient = new MongoClient(MONGODB_URI);
    await mongoClient.connect();
    console.log('  ✅ MongoDB connected');
  } catch (err) {
    console.log('  ❌ MongoDB connection failed');
    process.exit(1);
  }
  
  // Check collections
  console.log('\n3️⃣  Checking collections...');
  const db = mongoClient.db('machrio');
  const existingCollections = await db.listCollections().toArray();
  const collectionNames = existingCollections.map(c => c.name);
  
  for (const col of COLLECTIONS) {
    if (collectionNames.includes(col)) {
      const count = await db.collection(col).countDocuments();
      console.log(`  ✅ ${col}: ${count} records`);
    }
  }
  
  // Migrate
  console.log('\n4️⃣  Starting migration...');
  const results = {};
  
  for (const col of COLLECTIONS) {
    if (collectionNames.includes(col)) {
      results[col] = await migrateCollection(db, col);
    }
  }
  
  // Summary
  console.log('\n' + '='.repeat(70));
  console.log('📊 Migration Summary:');
  let totalSuccess = 0, totalFailed = 0;
  
  for (const [col, result] of Object.entries(results)) {
    console.log(`  ${col}: ✅ ${result.success}, ❌ ${result.failed || 0}`);
    totalSuccess += result.success;
    totalFailed += (result.failed || 0);
  }
  
  console.log('\n' + '='.repeat(70));
  console.log(`Total: ✅ ${totalSuccess} migrated, ❌ ${totalFailed} failed`);
  
  if (totalSuccess > 0 && totalFailed === 0) {
    console.log('\n🎉 Migration successful!');
  } else if (totalFailed > 0) {
    console.log('\n⚠️  Some records failed. Check errors above.');
  }
  
  await mongoClient.close();
  console.log('\n✅ Done');
}

main().catch(err => {
  console.error('\n❌ Error:', err.message);
  console.error(err.stack);
  process.exit(1);
});
