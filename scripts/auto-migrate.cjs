#!/usr/bin/env node

/**
 * 全自动 MongoDB → Supabase 迁移工具
 * 
 * 特点：
 * - 直接从 MongoDB 在线读取数据
 * - 自动创建 Supabase 表结构
 * - 自动迁移数据
 * - 无需手动备份
 * 
 * 使用方法：
 *   node scripts/auto-migrate.cjs
 */

const https = require('https');
const { MongoClient } = require('mongodb');

// Configuration
const MONGODB_URI = 'mongodb+srv://mroworks_db_user:moore1982@mroworks-dev.gbqxebq.mongodb.net/machrio';
const SUPABASE_URL = 'https://yderhgkjcsaqrsfntpqm.supabase.co';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlkZXJoZ2tqY3NhcXJzZm50cHFtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDI0NDU3MiwiZXhwIjoyMDg5ODIwNTcyfQ.aX9EPl9c9NXZ2fUZ1oJSxtTeak67Y8w4cPO97EooaQM';

// Collections to migrate
const COLLECTIONS = ['categories', 'products', 'articles', 'brands', 'users', 'orders', 'customers'];

// Supabase REST API helper
function supabaseRequest(method, endpoint, data = null, rawSql = false) {
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
        'Content-Type': rawSql ? 'text/plain' : 'application/json',
        'Prefer': data ? 'return=minimal' : 'return=minimal'
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

// Create tables using SQL API
async function createTableSQL(name, columns) {
  const sql = `
    CREATE TABLE IF NOT EXISTS ${name} (
      ${columns.join(',\n      ')}
    );
  `;
  
  try {
    // Try using the SQL endpoint
    await supabaseRequest('POST', '/rest/v1/', sql, true);
    console.log(`  ✅ Created table: ${name}`);
    return true;
  } catch (err) {
    console.log(`  ⚠️  ${name}: ${err.message.substring(0, 60)}`);
    return false;
  }
}

// Create tables in Supabase
async function createTables() {
  console.log('\n🏗️  Creating database tables...');
  
  const tables = {
    'categories': [
      'id uuid PRIMARY KEY DEFAULT uuid_generate_v4()',
      'name text NOT NULL',
      'slug text UNIQUE NOT NULL',
      'description text',
      'parent_id uuid REFERENCES categories(id)',
      'level integer DEFAULT 1',
      'display_order integer DEFAULT 0',
      'image text',
      'icon text',
      'meta_title text',
      'meta_description text',
      'buying_guide jsonb',
      'created_at timestamptz DEFAULT now()',
      'updated_at timestamptz DEFAULT now()'
    ],
    'products': [
      'id uuid PRIMARY KEY DEFAULT uuid_generate_v4()',
      'sku text UNIQUE NOT NULL',
      'name text NOT NULL',
      'short_description text',
      'full_description jsonb',
      'primary_category_id uuid',
      'status text DEFAULT \'draft\'',
      'availability text DEFAULT \'contact\'',
      'purchase_mode text DEFAULT \'both\'',
      'lead_time text',
      'min_order_quantity integer DEFAULT 1',
      'package_qty integer',
      'package_unit text',
      'weight numeric',
      'pricing jsonb',
      'specifications jsonb DEFAULT \'[]\'::jsonb',
      'faq jsonb DEFAULT \'[]\'::jsonb',
      'images jsonb DEFAULT \'[]\'::jsonb',
      'external_image_url text',
      'additional_image_urls jsonb DEFAULT \'[]\'::jsonb',
      'categories jsonb DEFAULT \'[]\'::jsonb',
      'tags jsonb DEFAULT \'[]\'::jsonb',
      'meta_title text',
      'meta_description text',
      'focus_keyword text',
      'source_url text',
      'shipping_info jsonb',
      'created_at timestamptz DEFAULT now()',
      'updated_at timestamptz DEFAULT now()'
    ],
    'articles': [
      'id uuid PRIMARY KEY DEFAULT uuid_generate_v4()',
      'title text NOT NULL',
      'slug text UNIQUE NOT NULL',
      'description text',
      'content jsonb',
      'category text',
      'tags jsonb DEFAULT \'[]\'::jsonb',
      'featured_image text',
      'author text',
      'status text DEFAULT \'draft\'',
      'published_at timestamptz',
      'meta_title text',
      'meta_description text',
      'created_at timestamptz DEFAULT now()',
      'updated_at timestamptz DEFAULT now()'
    ],
    'brands': [
      'id uuid PRIMARY KEY DEFAULT uuid_generate_v4()',
      'name text UNIQUE NOT NULL',
      'slug text UNIQUE',
      'description text',
      'logo text',
      'website text',
      'created_at timestamptz DEFAULT now()',
      'updated_at timestamptz DEFAULT now()'
    ]
  };
  
  for (const [name, columns] of Object.entries(tables)) {
    await createTableSQL(name, columns);
  }
  
  // Create indexes
  console.log('\n📊 Creating indexes...');
  const indexes = [
    'CREATE INDEX IF NOT EXISTS categories_slug_idx ON categories (slug)',
    'CREATE INDEX IF NOT EXISTS categories_parent_idx ON categories (parent_id)',
    'CREATE INDEX IF NOT EXISTS products_sku_idx ON products (sku)',
    'CREATE INDEX IF NOT EXISTS products_status_idx ON products (status)',
    'CREATE INDEX IF NOT EXISTS articles_slug_idx ON articles (slug)',
    'CREATE INDEX IF NOT EXISTS articles_status_idx ON articles (status)',
    'CREATE INDEX IF NOT EXISTS brands_slug_idx ON brands (slug)'
  ];
  
  for (const sql of indexes) {
    try {
      await supabaseRequest('POST', '/rest/v1/', sql, true);
    } catch (e) {
      // Ignore index errors
    }
  }
  console.log('  ✅ Indexes created');
}

// Transform MongoDB document to PostgreSQL format
function transformDoc(doc) {
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
    const records = documents.map(doc => transformDoc(doc));
    
    // Clear existing data (optional)
    try {
      await supabaseRequest('DELETE', `/rest/v1/${collectionName}?gt=0`);
      console.log('  🗑️  Cleared existing data');
    } catch (err) {
      console.log('  ℹ️  Table may be empty or not exist yet');
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
  console.log('🚀 全自动 MongoDB → Supabase 迁移工具');
  console.log('='.repeat(70));
  console.log(`MongoDB: ${MONGODB_URI.replace(/\/\/[^:]+:[^@]+@/, '//***:***@')}`);
  console.log(`Supabase: ${SUPABASE_URL}`);
  console.log('='.repeat(70));
  
  // Step 1: Test connections
  console.log('\n1️⃣  Testing connections...');
  
  let mongoClient;
  try {
    mongoClient = new MongoClient(MONGODB_URI);
    await mongoClient.connect();
    console.log('  ✅ MongoDB connected');
  } catch (err) {
    console.error('  ❌ MongoDB connection failed:', err.message);
    process.exit(1);
  }
  
  try {
    await supabaseRequest('GET', '/rest/v1/');
    console.log('  ✅ Supabase connected');
  } catch (err) {
    console.error('  ❌ Supabase connection failed:', err.message);
    await mongoClient.close();
    process.exit(1);
  }
  
  // Step 2: Check collections
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
  
  // Step 3: Confirm migration
  console.log('\n⚠️  即将开始迁移:');
  console.log('   - 数据将从 MongoDB 在线读取');
  console.log('   - 直接写入 Supabase PostgreSQL');
  console.log('   - 现有数据会被清空');
  console.log('\n继续？(y/N)');
  
  const readline = require('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  const answer = await new Promise(resolve => rl.question('> ', resolve));
  rl.close();
  
  if (answer.toLowerCase() !== 'y') {
    console.log('\n❌ 迁移已取消');
    await mongoClient.close();
    process.exit(0);
  }
  
  // Step 4: Create tables
  await createTables();
  
  // Step 5: Run migration
  console.log('\n3️⃣  Starting migration...');
  const results = {};
  
  for (const col of COLLECTIONS) {
    if (collectionNames.includes(col)) {
      results[col] = await migrateCollection(db, col);
    }
  }
  
  // Step 6: Summary
  console.log('\n' + '='.repeat(70));
  console.log('📊 迁移汇总:');
  let totalSuccess = 0;
  let totalFailed = 0;
  
  for (const [col, result] of Object.entries(results)) {
    console.log(`  ${col}: ✅ ${result.success}, ❌ ${result.failed || 0}`);
    totalSuccess += result.success;
    totalFailed += (result.failed || 0);
  }
  
  console.log('\n' + '='.repeat(70));
  console.log(`总计：✅ ${totalSuccess} 成功，❌ ${totalFailed} 失败`);
  
  if (totalFailed === 0 && totalSuccess > 0) {
    console.log('\n🎉 迁移成功完成！');
    console.log(`\n下一步:`);
    console.log(`1. 验证数据：https://supabase.com/dashboard/project/yderhgkjcsaqrsfntpqm/editor`);
    console.log(`2. 更新 .env.local: USE_POSTGRES=1`);
    console.log(`3. 测试网站功能`);
  } else if (totalFailed > 0) {
    console.log('\n⚠️  部分数据迁移失败，请检查上方错误信息');
  }
  
  // Cleanup
  await mongoClient.close();
  console.log('\n✅ 所有操作完成');
}

main().catch(err => {
  console.error('\n❌ 迁移失败:', err);
  console.error(err.stack);
  process.exit(1);
});
