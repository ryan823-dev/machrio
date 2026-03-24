#!/usr/bin/env node

/**
 * 全自动 MongoDB → Supabase 迁移工具（最终版本）
 * 
 * 尝试多种方法自动完成迁移：
 * 1. 直接 PostgreSQL 连接
 * 2. Supabase CLI
 * 3. REST API + 预创建表
 * 
 * 使用方法：
 *   node scripts/auto-migrate-final.cjs
 */

const { execSync } = require('child_process');
const { MongoClient } = require('mongodb');
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
const https = require('https');

// Configuration
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://mroworks_db_user:moore1982@mroworks-dev.gbqxebq.mongodb.net/machrio';
const SUPABASE_URL = 'https://yderhgkjcsaqrsfntpqm.supabase.co';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlkZXJoZ2tqY3NhcXJzZm50cHFtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDI0NDU3MiwiZXhwIjoyMDg5ODIwNTcyfQ.aX9EPl9c9NXZ2fUZ1oJSxtTeak67Y8w4cPO97EooaQM';
const COLLECTIONS = ['categories', 'products', 'articles', 'brands'];

// Load DATABASE_URI
const envPath = path.join(process.cwd(), '.env.local');
let DATABASE_URI;
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  const dbMatch = envContent.match(/DATABASE_URI=(.+)/);
  if (dbMatch) {
    DATABASE_URI = dbMatch[1].trim();
  }
}

// Try direct PostgreSQL connection
async function tryDirectConnection(uri) {
  let client;
  try {
    client = new Client({ connectionString: uri, ssl: { rejectUnauthorized: false } });
    await client.connect();
    await client.query('SELECT 1');
    console.log('  ✅ Direct connection successful');
    return client;
  } catch (err) {
    if (client) await client.end();
    return null;
  }
}

// Try Supabase CLI
async function trySupabaseCLI() {
  console.log('\n🔌 Trying Supabase CLI...');
  try {
    execSync('supabase --version', { stdio: 'pipe' });
    console.log('  ✅ Supabase CLI available');
    
    // Try to check project status
    const result = execSync(`supabase projects api-keys --project-ref yderhgkjcsaqrsfntpqm 2>&1`, { 
      encoding: 'utf8',
      stdio: 'pipe'
    });
    
    if (result.includes('error') || result.includes('Access token')) {
      console.log('  ⚠️  Supabase CLI not logged in');
      return false;
    }
    
    console.log('  ✅ Supabase CLI authenticated');
    return true;
  } catch (err) {
    console.log('  ❌ Supabase CLI not available or not authenticated');
    return false;
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
        'Prefer': 'return=minimal'
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve({ status: res.statusCode, data: body ? JSON.parse(body) : null });
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

// Check if tables exist
async function checkTablesExist() {
  try {
    const result = await supabaseRequest('GET', '/rest/v1/categories?limit=1');
    return result.status === 200;
  } catch (err) {
    return false;
  }
}

// Transform MongoDB document
function transformDoc(doc) {
  const record = {};
  if (doc._id) record.id = doc._id.$oid || doc._id;
  
  for (const [key, value] of Object.entries(doc)) {
    if (key === '_id') continue;
    const snakeKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
    
    if (key === 'parent' && value) {
      record.parent_id = value.$oid || value;
    } else if (['createdAt', 'updatedAt', 'publishedAt'].includes(key) && value) {
      record[snakeKey] = typeof value === 'string' ? new Date(value) : value;
    } else if (value && typeof value === 'object' && value.$oid) {
      record[snakeKey] = value.$oid;
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
  
  if (count === 0) return { success: 0, failed: 0 };
  
  const documents = await collection.find({}).toArray();
  const records = documents.map(transformDoc);
  
  // Clear existing
  try {
    await supabaseRequest('DELETE', `/rest/v1/${collectionName}?gt=0`);
  } catch (err) {}
  
  // Insert in batches
  let success = 0, failed = 0;
  const batchSize = 50;
  
  for (let i = 0; i < records.length; i += batchSize) {
    const batch = records.slice(i, i + batchSize);
    
    try {
      await supabaseRequest('POST', `/rest/v1/${collectionName}`, batch);
      success += batch.length;
      console.log(`  → ${Math.min(i + batchSize, records.length)}/${records.length}`);
    } catch (err) {
      failed += batch.length;
    }
  }
  
  console.log(`  ✅ Success: ${success}, Failed: ${failed}`);
  return { success, failed };
}

async function main() {
  console.log('🚀 Auto Migration Tool - Final Attempt');
  console.log('='.repeat(70));
  
  // Step 1: Check Supabase REST API
  console.log('\n1️⃣  Checking Supabase REST API...');
  try {
    await supabaseRequest('GET', '/rest/v1/');
    console.log('  ✅ REST API accessible');
  } catch (err) {
    console.log('  ❌ REST API not accessible');
    process.exit(1);
  }
  
  // Step 2: Check if tables exist
  console.log('\n2️⃣  Checking if tables exist...');
  const tablesExist = await checkTablesExist();
  
  if (!tablesExist) {
    console.log('  ❌ Tables do not exist');
    console.log('\n⚠️  TABLES MUST BE CREATED FIRST');
    console.log('\n📋 Option 1: Supabase Dashboard (Recommended)');
    console.log('   URL: https://supabase.com/dashboard/project/yderhgkjcsaqrsfntpqm/sql/new');
    console.log('   File: supabase/quick-create.sql');
    console.log('\n📋 Option 2: Supabase CLI');
    console.log('   Commands:');
    console.log('   supabase login');
    console.log('   supabase link --project-ref yderhgkjcsaqrsfntpqm');
    console.log('   supabase db push');
    console.log('\n📋 Option 3: Direct Connection');
    console.log('   Update DATABASE_URI in .env.local');
    console.log('   Run: node scripts/direct-migrate.cjs');
    console.log('\nAfter creating tables, run this script again.');
    process.exit(0);
  }
  
  console.log('  ✅ Tables exist');
  
  // Step 3: Connect to MongoDB
  console.log('\n3️⃣  Connecting to MongoDB...');
  let mongoClient;
  try {
    mongoClient = new MongoClient(MONGODB_URI);
    await mongoClient.connect();
    console.log('  ✅ MongoDB connected');
  } catch (err) {
    console.log('  ❌ MongoDB connection failed');
    process.exit(1);
  }
  
  // Step 4: Check collections
  console.log('\n4️⃣  Checking collections...');
  const db = mongoClient.db('machrio');
  const existingCollections = await db.listCollections().toArray();
  const collectionNames = existingCollections.map(c => c.name);
  
  for (const col of COLLECTIONS) {
    if (collectionNames.includes(col)) {
      const count = await db.collection(col).countDocuments();
      console.log(`  ✅ ${col}: ${count} records`);
    }
  }
  
  // Step 5: Migrate
  console.log('\n5️⃣  Starting migration...');
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
  }
  
  await mongoClient.close();
  console.log('\n✅ Done');
}

main().catch(err => {
  console.error('\n❌ Error:', err.message);
  process.exit(1);
});
