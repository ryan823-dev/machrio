#!/usr/bin/env node

/**
 * MongoDB → Supabase REST 迁移工具
 * 
 * 使用 Supabase REST API 进行迁移（无需直接数据库连接）
 * 通过批量插入数据来让 Supabase 自动推断表结构
 * 
 * 使用方法：
 *   node scripts/rest-migrate.cjs
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

// Table schemas for Supabase
const TABLE_SCHEMAS = {
  categories: {
    create: `CREATE TABLE IF NOT EXISTS categories (
      id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
      name text NOT NULL,
      slug text UNIQUE NOT NULL,
      description text,
      parent_id uuid REFERENCES categories(id),
      level integer DEFAULT 1,
      display_order integer DEFAULT 0,
      image text,
      icon text,
      meta_title text,
      meta_description text,
      buying_guide jsonb,
      created_at timestamptz DEFAULT now(),
      updated_at timestamptz DEFAULT now()
    );`,
    indexes: [
      'CREATE INDEX IF NOT EXISTS categories_slug_idx ON categories (slug);',
      'CREATE INDEX IF NOT EXISTS categories_parent_idx ON categories (parent_id);'
    ]
  },
  products: {
    create: `CREATE TABLE IF NOT EXISTS products (
      id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
      sku text UNIQUE NOT NULL,
      name text NOT NULL,
      short_description text,
      full_description jsonb,
      primary_category_id uuid,
      status text DEFAULT 'draft',
      availability text DEFAULT 'contact',
      purchase_mode text DEFAULT 'both',
      lead_time text,
      min_order_quantity integer DEFAULT 1,
      package_qty integer,
      package_unit text,
      weight numeric,
      pricing jsonb,
      specifications jsonb DEFAULT '[]'::jsonb,
      faq jsonb DEFAULT '[]'::jsonb,
      images jsonb DEFAULT '[]'::jsonb,
      external_image_url text,
      additional_image_urls jsonb DEFAULT '[]'::jsonb,
      categories jsonb DEFAULT '[]'::jsonb,
      tags jsonb DEFAULT '[]'::jsonb,
      meta_title text,
      meta_description text,
      focus_keyword text,
      source_url text,
      shipping_info jsonb,
      created_at timestamptz DEFAULT now(),
      updated_at timestamptz DEFAULT now()
    );`,
    indexes: [
      'CREATE INDEX IF NOT EXISTS products_sku_idx ON products (sku);',
      'CREATE INDEX IF NOT EXISTS products_status_idx ON products (status);'
    ]
  },
  articles: {
    create: `CREATE TABLE IF NOT EXISTS articles (
      id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
      title text NOT NULL,
      slug text UNIQUE NOT NULL,
      description text,
      content jsonb,
      category text,
      tags jsonb DEFAULT '[]'::jsonb,
      featured_image text,
      author text,
      status text DEFAULT 'draft',
      published_at timestamptz,
      meta_title text,
      meta_description text,
      created_at timestamptz DEFAULT now(),
      updated_at timestamptz DEFAULT now()
    );`,
    indexes: [
      'CREATE INDEX IF NOT EXISTS articles_slug_idx ON articles (slug);',
      'CREATE INDEX IF NOT EXISTS articles_status_idx ON articles (status);'
    ]
  },
  brands: {
    create: `CREATE TABLE IF NOT EXISTS brands (
      id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
      name text UNIQUE NOT NULL,
      slug text UNIQUE,
      description text,
      logo text,
      website text,
      created_at timestamptz DEFAULT now(),
      updated_at timestamptz DEFAULT now()
    );`,
    indexes: [
      'CREATE INDEX IF NOT EXISTS brands_slug_idx ON brands (slug);'
    ]
  }
};

// Supabase REST API helper
function supabaseRequest(method, endpoint, data = null, headers = {}) {
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
        ...headers
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
      req.write(typeof data === 'string' ? data : JSON.stringify(data));
    }
    req.end();
  });
}

// Test Supabase connection
async function testSupabase() {
  console.log('\n🔌 Testing Supabase connection...');
  try {
    const result = await supabaseRequest('GET', '/rest/v1/');
    console.log('  ✅ Supabase REST API connected');
    return true;
  } catch (err) {
    console.log(`  ❌ Supabase connection failed: ${err.message}`);
    return false;
  }
}

// Create tables using Supabase Management API
async function createTables() {
  console.log('\n🏗️  Creating database tables...');
  
  // Note: Supabase REST API doesn't support DDL directly
  // We need to use the Management API or create tables through the Dashboard
  console.log('  ⚠️  Supabase REST API does not support CREATE TABLE directly');
  console.log('  ℹ️  Please execute the SQL in supabase/quick-create.sql manually');
  console.log('     Or visit: https://supabase.com/dashboard/project/yderhgkjcsaqrsfntpqm/sql/new');
  return false;
}

// Transform MongoDB document to PostgreSQL format
function transformDoc(doc, collectionName) {
  const record = {};
  
  // Convert _id to id (UUID string)
  if (doc._id) {
    record.id = doc._id.$oid || doc._id;
  }
  
  // Copy and transform fields
  for (const [key, value] of Object.entries(doc)) {
    if (key === '_id') continue;
    
    // Convert camelCase to snake_case
    const snakeKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
    
    // Handle special cases
    if (key === 'parent' && value) {
      record.parent_id = value.$oid || value;
    } else if (key === 'createdAt' && value) {
      record.created_at = typeof value === 'string' ? new Date(value).toISOString() : value;
    } else if (key === 'updatedAt' && value) {
      record.updated_at = typeof value === 'string' ? new Date(value).toISOString() : value;
    } else if (key === 'publishedAt' && value) {
      record.published_at = typeof value === 'string' ? new Date(value).toISOString() : value;
    } else if (value && typeof value === 'object' && value.$oid) {
      // Handle ObjectId references
      record[snakeKey] = value.$oid;
    } else {
      record[snakeKey] = value;
    }
  }
  
  return record;
}

// Clear existing data
async function clearData(collectionName) {
  try {
    await supabaseRequest('DELETE', `/rest/v1/${collectionName}?gt=0`);
    console.log('  🗑️  Cleared existing data');
  } catch (err) {
    console.log('  ℹ️  Table may be empty or not exist');
  }
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
    await clearData(collectionName);
    
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
        console.log(`  ⚠️  Batch error: ${err.message.substring(0, 80)}`);
        
        // Try individual inserts for failed batch
        for (const record of batch) {
          try {
            await supabaseRequest('POST', `/rest/v1/${collectionName}`, record);
            success++;
          } catch (e) {
            failed++;
            if (failed <= 3) {
              console.log(`    ❌ ${record.id}: ${e.message.substring(0, 60)}`);
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
  console.log('🚀 MongoDB → Supabase REST Migration Tool');
  console.log('='.repeat(70));
  console.log(`MongoDB: ${MONGODB_URI.replace(/\/\/[^:]+:[^@]+@/, '//***:***@')}`);
  console.log(`Supabase: ${SUPABASE_URL}`);
  console.log('='.repeat(70));
  
  // Step 1: Test Supabase connection
  const supabaseOk = await testSupabase();
  if (!supabaseOk) {
    console.error('\n❌ Cannot connect to Supabase REST API');
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
  console.log('');
  console.log('⚠️  IMPORTANT: Supabase REST API does not support CREATE TABLE.');
  console.log('   You need to create tables manually first.');
  console.log('');
  console.log('📋 Option 1: Execute SQL in Supabase Dashboard');
  console.log('   URL: https://supabase.com/dashboard/project/yderhgkjcsaqrsfntpqm/sql/new');
  console.log('   File: supabase/quick-create.sql');
  console.log('');
  console.log('📋 Option 2: Use Supabase CLI (if logged in)');
  console.log('   Command: supabase db push');
  console.log('');
  console.log('After creating tables, run this script again to migrate data.');
  console.log('');
  
  // Step 5: Try data migration (will fail if tables don't exist)
  console.log('\n4️⃣  Attempting data migration...');
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
    console.log(`2. Ensure .env.local has USE_POSTGRES=1`);
    console.log(`3. Test your application`);
  } else if (totalFailed > 0) {
    console.log('\n⚠️  Migration failed. Most likely tables do not exist.');
    console.log('   Please create tables first using the SQL file, then run again.');
  }
  
  // Cleanup
  await mongoClient.close();
  console.log('\n✅ Done');
}

main().catch(err => {
  console.error('\n❌ Migration failed:', err);
  console.error(err.stack);
  process.exit(1);
});
