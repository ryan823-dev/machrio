#!/usr/bin/env node

/**
 * MongoDB → Supabase 全自动迁移工具（增强版）
 * 
 * 功能：
 * - 使用 Prisma 创建表结构
 * - 从 MongoDB 在线读取数据
 * - 批量插入 Supabase
 * - 详细的错误处理和日志
 * 
 * 使用方法：
 *   node scripts/migrate-to-supabase.cjs
 */

const { execSync } = require('child_process');
const { MongoClient } = require('mongodb');
const https = require('https');
const fs = require('fs');
const path = require('path');

// Configuration
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://mroworks_db_user:moore1982@mroworks-dev.gbqxebq.mongodb.net/machrio';
const SUPABASE_URL = 'https://yderhgkjcsaqrsfntpqm.supabase.co';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlkZXJoZ2tqY3NhcXJzZm50cHFtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDI0NDU3MiwiZXhwIjoyMDg5ODIwNTcyfQ.aX9EPl9c9NXZ2fUZ1oJSxtTeak67Y8w4cPO97EooaQM';
const COLLECTIONS = ['categories', 'products', 'articles', 'brands'];

// Load .env.local
const envPath = path.join(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  const dbMatch = envContent.match(/DATABASE_URI=(.+)/);
  if (dbMatch) {
    process.env.DATABASE_URI = dbMatch[1].trim();
    console.log('✅ Loaded DATABASE_URI from .env.local');
  }
}

// Supabase REST API helper
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
          resolve({ 
            status: res.statusCode, 
            data: body ? JSON.parse(body) : null,
            headers: res.headers
          });
        } else {
          try {
            const error = JSON.parse(body);
            reject(new Error(`HTTP ${res.statusCode}: ${error.message || error.hint || body.substring(0, 100)}`));
          } catch (e) {
            reject(new Error(`HTTP ${res.statusCode}: ${body.substring(0, 100)}`));
          }
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

// Test Supabase connection
async function testSupabase() {
  console.log('\n🔌 Testing Supabase connection...');
  try {
    const result = await supabaseRequest('GET', '/rest/v1/');
    console.log('  ✅ Supabase connected');
    return true;
  } catch (err) {
    console.log(`  ❌ Supabase connection failed: ${err.message}`);
    return false;
  }
}

// Create tables using SQL file
async function createTablesSQL() {
  console.log('\n🏗️  Creating tables using SQL...');
  
  const sqlFile = path.join(process.cwd(), 'supabase', 'quick-create.sql');
  if (!fs.existsSync(sqlFile)) {
    console.log('  ❌ SQL file not found');
    return false;
  }
  
  const sql = fs.readFileSync(sqlFile, 'utf8');
  
  // Split by semicolons and execute each statement
  const statements = sql.split(';').filter(s => s.trim().length > 0);
  
  for (const statement of statements) {
    const trimmed = statement.trim();
    if (trimmed.length === 0 || trimmed.startsWith('--')) continue;
    
    try {
      // Use Supabase SQL API through REST
      await supabaseRequest('POST', '/rest/v1/rpc', { 
        query: trimmed 
      });
      console.log('  ✅ Executed statement');
    } catch (err) {
      // Ignore errors for existing tables
      if (err.message.includes('already exists') || err.message.includes('IF NOT EXISTS')) {
        console.log('  ℹ️  Table may already exist');
      } else {
        console.log(`  ⚠️  Statement error: ${err.message.substring(0, 60)}`);
      }
    }
  }
  
  return true;
}

// Alternative: Try Prisma db push
async function createTablesPrisma() {
  console.log('\n🏗️  Trying Prisma to create tables...');
  
  if (!process.env.DATABASE_URI) {
    console.log('  ❌ DATABASE_URI not set');
    return false;
  }
  
  try {
    execSync('npx prisma db push --accept-data-loss', { 
      stdio: 'inherit',
      env: { ...process.env }
    });
    console.log('  ✅ Tables created via Prisma');
    return true;
  } catch (err) {
    console.log('  ❌ Prisma failed');
    return false;
  }
}

// Transform MongoDB document to PostgreSQL format
function transformDoc(doc, collectionName) {
  const record = {};
  
  // Convert _id to id
  if (doc._id) {
    record.id = doc._id.$oid || doc._id;
  }
  
  // Copy all fields
  for (const [key, value] of Object.entries(doc)) {
    if (key === '_id') continue;
    
    // Convert camelCase to snake_case
    const snakeKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
    
    // Handle special cases
    if (key === 'parent' && value) {
      record.parent_id = value.$oid || value;
    } else if ((key.endsWith('At') || key === 'publishedAt') && typeof value === 'string') {
      record[snakeKey] = new Date(value).toISOString();
    } else {
      record[snakeKey] = value;
    }
  }
  
  return record;
}

// Migrate a single collection
async function migrateCollection(mongoDb, collectionName) {
  console.log(`\n📦 Migrating ${collectionName}...`);
  
  try {
    const collection = mongoDb.collection(collectionName);
    const count = await collection.countDocuments();
    console.log(`  📊 Found ${count} records in MongoDB`);
    
    if (count === 0) {
      console.log('  ⚠️  No data to migrate');
      return { success: 0, failed: 0 };
    }
    
    // Fetch all documents
    const documents = await collection.find({}).toArray();
    
    // Transform documents
    const records = documents.map(doc => transformDoc(doc, collectionName));
    
    // Clear existing data
    try {
      await supabaseRequest('DELETE', `/rest/v1/${collectionName}?gt=0`);
      console.log('  🗑️  Cleared existing data');
    } catch (err) {
      console.log('  ℹ️  Table may be empty or not exist');
    }
    
    // Insert in batches
    const batchSize = 50;
    let success = 0;
    let failed = 0;
    
    for (let i = 0; i < records.length; i += batchSize) {
      const batch = records.slice(i, i + batchSize);
      
      try {
        await supabaseRequest('POST', `/rest/v1/${collectionName}`, batch);
        success += batch.length;
        
        const progress = Math.min(i + batchSize, records.length);
        const percent = Math.round((progress / records.length) * 100);
        console.log(`  → Progress: ${progress}/${records.length} (${percent}%)`);
      } catch (err) {
        console.log(`  ⚠️  Batch error: ${err.message.substring(0, 60)}`);
        
        // Try individual inserts for failed batch
        for (const record of batch) {
          try {
            await supabaseRequest('POST', `/rest/v1/${collectionName}`, record);
            success++;
          } catch (e) {
            failed++;
            if (failed <= 3) {
              console.log(`    ❌ ${record.id}: ${e.message.substring(0, 50)}`);
            }
          }
        }
      }
    }
    
    console.log(`  ✅ Success: ${success}, Failed: ${failed}`);
    return { success, failed };
  } catch (err) {
    console.log(`  ❌ Error: ${err.message}`);
    return { success: 0, failed: 0, error: err.message };
  }
}

async function main() {
  console.log('🚀 MongoDB → Supabase Migration Tool (Enhanced)');
  console.log('='.repeat(70));
  console.log(`MongoDB: ${MONGODB_URI.replace(/\/\/[^:]+:[^@]+@/, '//***:***@')}`);
  console.log(`Supabase: ${SUPABASE_URL}`);
  console.log('='.repeat(70));
  
  // Step 1: Test Supabase connection
  const supabaseOk = await testSupabase();
  if (!supabaseOk) {
    console.error('\n❌ Cannot connect to Supabase. Please check:');
    console.error('  1. Supabase project exists');
    console.error('  2. SERVICE_KEY is correct');
    console.error('  3. Network connection');
    process.exit(1);
  }
  
  // Step 2: Connect to MongoDB
  console.log('\n1️⃣  Connecting to MongoDB...');
  let mongoClient;
  try {
    mongoClient = new MongoClient(MONGODB_URI);
    await mongoClient.connect();
    console.log('  ✅ MongoDB connected');
  } catch (err) {
    console.error('  ❌ MongoDB connection failed:', err.message);
    process.exit(1);
  }
  
  // Step 3: Check collections
  console.log('\n2️⃣  Checking MongoDB collections...');
  const db = mongoClient.db('machrio');
  const existingCollections = await db.listCollections().toArray();
  const collectionNames = existingCollections.map(c => c.name);
  
  for (const col of COLLECTIONS) {
    if (collectionNames.includes(col)) {
      const count = await db.collection(col).countDocuments();
      console.log(`  ✅ ${col}: ${count} records`);
    } else {
      console.log(`  ⚠️  ${col}: Not found`);
    }
  }
  
  // Step 4: Create tables
  console.log('\n3️⃣  Creating database tables...');
  
  // Try Prisma first, then fall back to SQL
  let tablesCreated = await createTablesPrisma();
  if (!tablesCreated) {
    console.log('\n  Trying SQL method...');
    tablesCreated = await createTablesSQL();
  }
  
  if (!tablesCreated) {
    console.log('\n⚠️  Could not create tables automatically.');
    console.log('Please execute the SQL in supabase/quick-create.sql manually.');
  }
  
  // Step 5: Run migration
  console.log('\n4️⃣  Starting data migration...');
  const results = {};
  
  for (const col of COLLECTIONS) {
    if (collectionNames.includes(col)) {
      results[col] = await migrateCollection(db, col);
    }
  }
  
  // Step 6: Summary
  console.log('\n' + '='.repeat(70));
  console.log('📊 Migration Summary:');
  let totalSuccess = 0;
  let totalFailed = 0;
  
  for (const [col, result] of Object.entries(results)) {
    console.log(`  ${col}: ✅ ${result.success}, ❌ ${result.failed || 0}`);
    totalSuccess += result.success;
    totalFailed += (result.failed || 0);
  }
  
  console.log('\n' + '='.repeat(70));
  console.log(`Total: ✅ ${totalSuccess} migrated, ❌ ${totalFailed} failed`);
  
  if (totalFailed === 0 && totalSuccess > 0) {
    console.log('\n🎉 Migration completed successfully!');
    console.log(`\nNext steps:`);
    console.log(`1. Verify data: https://supabase.com/dashboard/project/yderhgkjcsaqrsfntpqm/editor`);
    console.log(`2. Update .env.local: Ensure USE_POSTGRES=1`);
    console.log(`3. Test your application`);
  } else if (totalFailed > 0) {
    console.log('\n⚠️  Some records failed to migrate. Check errors above.');
  }
  
  // Cleanup
  await mongoClient.close();
  console.log('\n✅ All done');
}

main().catch(err => {
  console.error('\n❌ Migration failed:', err);
  console.error(err.stack);
  process.exit(1);
});
