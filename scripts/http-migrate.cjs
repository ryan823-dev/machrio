#!/usr/bin/env node

/**
 * MongoDB → Supabase HTTP 迁移工具
 * 
 * 使用原生 HTTP 请求执行 SQL 和迁移数据
 * 通过 Supabase 内部 API 执行 DDL 操作
 * 
 * 使用方法：
 *   node scripts/http-migrate.cjs
 */

const { MongoClient } = require('mongodb');
const https = require('https');
const fs = require('fs');
const path = require('path');
const { Pool, Client } = require('pg');

// Configuration
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://mroworks_db_user:moore1982@mroworks-dev.gbqxebq.mongodb.net/machrio';

// Load DATABASE_URI from .env.local
const envPath = path.join(process.cwd(), '.env.local');
let DATABASE_URI;
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  const dbMatch = envContent.match(/DATABASE_URI=(.+)/);
  if (dbMatch) {
    DATABASE_URI = dbMatch[1].trim();
    console.log('✅ Loaded DATABASE_URI from .env.local');
  }
}

if (!DATABASE_URI) {
  console.error('❌ DATABASE_URI not found in .env.local');
  process.exit(1);
}

const COLLECTIONS = ['categories', 'products', 'articles', 'brands'];
const SUPABASE_URL = 'https://yderhgkjcsaqrsfntpqm.supabase.co';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlkZXJoZ2tqY3NhcXJzZm50cHFtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDI0NDU3MiwiZXhwIjoyMDg5ODIwNTcyfQ.aX9EPl9c9NXZ2fUZ1oJSxtTeak67Y8w4cPO97EooaQM';

// Try different connection methods
async function tryDirectConnection() {
  console.log('\n🔌 Attempting direct PostgreSQL connections...');
  
  const connections = [
    {
      name: 'Primary (uvbzobhfpjbcggspassa)',
      uri: 'postgresql://postgres:qgvPF1YbGso3swVy@db.uvbzobhfpjbcggspassa.supabase.co:5432/postgres'
    },
    {
      name: 'Secondary (yderhgkjcsaqrsfntpqm)',
      uri: 'postgresql://postgres:MachrioDB2026@db.yderhgkjcsaqrsfntpqm.supabase.co:5432/postgres'
    },
    {
      name: 'Connection Pooler (6543)',
      uri: 'postgresql://postgres.qgvPF1YbGso3swVy@aws-0-us-west-1.pooler.supabase.com:6543/postgres'
    }
  ];
  
  for (const conn of connections) {
    console.log(`\n  Trying ${conn.name}...`);
    let client;
    try {
      client = new Client({ connectionString: conn.uri, ssl: { rejectUnauthorized: false } });
      await client.connect();
      await client.query('SELECT 1');
      console.log(`  ✅ SUCCESS: ${conn.name}`);
      await client.end();
      return conn.uri;
    } catch (err) {
      console.log(`  ❌ Failed: ${err.message.substring(0, 60)}`);
      if (client) await client.end();
    }
  }
  
  return null;
}

// Transform MongoDB document to PostgreSQL format
function transformDoc(doc, collectionName) {
  const record = {};
  
  if (doc._id) {
    record.id = doc._id.$oid || doc._id;
  }
  
  for (const [key, value] of Object.entries(doc)) {
    if (key === '_id') continue;
    
    const snakeKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
    
    if (key === 'parent' && value) {
      record.parent_id = value.$oid || value;
    } else if (key === 'createdAt' && value) {
      record.created_at = typeof value === 'string' ? new Date(value) : value;
    } else if (key === 'updatedAt' && value) {
      record.updated_at = typeof value === 'string' ? new Date(value) : value;
    } else if (key === 'publishedAt' && value) {
      record.published_at = typeof value === 'string' ? new Date(value) : value;
    } else if (value && typeof value === 'object' && value.$oid) {
      record[snakeKey] = value.$oid;
    } else {
      record[snakeKey] = value;
    }
  }
  
  return record;
}

// Create tables using direct connection
async function createTablesWithDirectConnection(client) {
  console.log('\n🏗️  Creating database tables...');
  
  const sqlFile = path.join(process.cwd(), 'supabase', 'quick-create.sql');
  const sql = fs.readFileSync(sqlFile, 'utf8');
  
  const statements = sql.split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'));
  
  let successCount = 0;
  for (const statement of statements) {
    try {
      await client.query(statement);
      successCount++;
      if (statement.includes('CREATE TABLE')) {
        const match = statement.match(/CREATE TABLE (?:IF NOT EXISTS )?(\w+)/);
        if (match) {
          console.log(`  ✅ Created table: ${match[1]}`);
        }
      }
    } catch (err) {
      if (!err.message.includes('already exists')) {
        console.log(`  ⚠️  Error: ${err.message.substring(0, 60)}`);
      }
    }
  }
  
  console.log(`  ✅ Executed ${successCount} statements`);
}

// Migrate data using direct connection
async function migrateDataWithDirectConnection(client, mongoDb, collectionName) {
  console.log(`\n📦 Migrating ${collectionName}...`);
  
  const collection = mongoDb.collection(collectionName);
  const count = await collection.countDocuments();
  console.log(`  📊 Found ${count} records in MongoDB`);
  
  if (count === 0) {
    console.log('  ⚠️  No data to migrate');
    return { success: 0, failed: 0 };
  }
  
  const documents = await collection.find({}).toArray();
  const records = documents.map(doc => transformDoc(doc, collectionName));
  
  // Clear existing data
  try {
    await client.query(`TRUNCATE TABLE ${collectionName} CASCADE`);
    console.log('  🗑️  Cleared existing data');
  } catch (err) {
    console.log('  ℹ️  Table may be empty');
  }
  
  // Insert data
  let success = 0;
  let failed = 0;
  
  for (const record of records) {
    try {
      const columns = Object.keys(record);
      const values = Object.values(record);
      const placeholders = values.map((_, i) => `$${i + 1}`).join(', ');
      
      const query = `
        INSERT INTO ${collectionName} (${columns.join(', ')})
        VALUES (${placeholders})
        ON CONFLICT (id) DO UPDATE SET ${columns.map(c => `${c} = EXCLUDED.${c}`).join(', ')}
      `;
      
      await client.query(query, values);
      success++;
      
      if (success % 100 === 0) {
        console.log(`  → Progress: ${success}/${records.length} (${Math.round(success/records.length*100)}%)`);
      }
    } catch (err) {
      failed++;
      if (failed <= 3) {
        console.log(`  ❌ ${record.id}: ${err.message.substring(0, 50)}`);
      }
    }
  }
  
  console.log(`  ✅ Success: ${success}, Failed: ${failed}`);
  return { success, failed };
}

async function main() {
  console.log('🚀 MongoDB → Supabase Direct Migration Tool');
  console.log('='.repeat(70));
  console.log(`MongoDB: ${MONGODB_URI.replace(/\/\/[^:]+:[^@]+@/, '//***:***@')}`);
  console.log('='.repeat(70));
  
  // Step 1: Try direct connection
  const workingUri = await tryDirectConnection();
  
  if (!workingUri) {
    console.error('\n❌ Cannot establish direct PostgreSQL connection.');
    console.error('\n⚠️  MANUAL STEP REQUIRED:');
    console.error('   Please execute SQL in Supabase Dashboard:');
    console.error('   https://supabase.com/dashboard/project/yderhgkjcsaqrsfntpqm/sql/new');
    console.error('\n   Copy and paste the contents of: supabase/quick-create.sql');
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
  
  // Step 3: Connect to PostgreSQL
  console.log('\n2️⃣  Connecting to PostgreSQL...');
  let pgClient;
  try {
    pgClient = new Client({ connectionString: workingUri, ssl: { rejectUnauthorized: false } });
    await pgClient.connect();
    await pgClient.query('SELECT 1');
    console.log('  ✅ PostgreSQL connected');
  } catch (err) {
    console.error('  ❌ PostgreSQL connection failed:', err.message);
    await mongoClient.close();
    process.exit(1);
  }
  
  // Step 4: Create tables
  await createTablesWithDirectConnection(pgClient);
  
  // Step 5: Check collections
  console.log('\n3️⃣  Checking MongoDB collections...');
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
  
  // Step 6: Run migration
  console.log('\n4️⃣  Starting data migration...');
  const results = {};
  
  for (const col of COLLECTIONS) {
    if (collectionNames.includes(col)) {
      results[col] = await migrateDataWithDirectConnection(pgClient, db, col);
    }
  }
  
  // Step 7: Summary
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
    console.log(`2. Ensure .env.local has USE_POSTGRES=1`);
    console.log(`3. Test your application`);
  } else if (totalFailed > 0) {
    console.log('\n⚠️  Some records failed to migrate.');
  }
  
  // Cleanup
  await mongoClient.close();
  await pgClient.end();
  console.log('\n✅ All done');
}

main().catch(err => {
  console.error('\n❌ Migration failed:', err);
  console.error(err.stack);
  process.exit(1);
});
