#!/usr/bin/env node

/**
 * MongoDB → Supabase 直接迁移工具
 * 
 * 使用原生 PostgreSQL 连接创建表并迁移数据
 * 
 * 使用方法：
 *   node scripts/direct-migrate.cjs
 */

const { MongoClient } = require('mongodb');
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

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

// Create PostgreSQL pool
const pool = new Pool({
  connectionString: DATABASE_URI,
  ssl: {
    rejectUnauthorized: false
  },
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

// Transform MongoDB document to PostgreSQL format
function transformDoc(doc, collectionName) {
  const record = {};
  
  // Convert _id to id (UUID format)
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
      record.created_at = typeof value === 'string' ? new Date(value) : value;
    } else if (key === 'updatedAt' && value) {
      record.updated_at = typeof value === 'string' ? new Date(value) : value;
    } else if (key === 'publishedAt' && value) {
      record.published_at = typeof value === 'string' ? new Date(value) : value;
    } else if (value && typeof value === 'object' && value.$oid) {
      // Handle ObjectId references
      record[snakeKey] = value.$oid;
    } else {
      record[snakeKey] = value;
    }
  }
  
  return record;
}

// Create tables
async function createTables() {
  console.log('\n🏗️  Creating database tables...');
  
  const sqlFile = path.join(process.cwd(), 'supabase', 'quick-create.sql');
  const sql = fs.readFileSync(sqlFile, 'utf8');
  
  // Split by semicolons
  const statements = sql.split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'));
  
  let successCount = 0;
  for (const statement of statements) {
    try {
      await pool.query(statement);
      successCount++;
      if (statement.includes('CREATE TABLE')) {
        const match = statement.match(/CREATE TABLE (?:IF NOT EXISTS )?(\w+)/);
        if (match) {
          console.log(`  ✅ Created table: ${match[1]}`);
        }
      }
    } catch (err) {
      // Ignore "already exists" errors
      if (err.message.includes('already exists')) {
        console.log(`  ℹ️  Table already exists`);
      } else {
        console.log(`  ⚠️  Error: ${err.message.substring(0, 60)}`);
      }
    }
  }
  
  console.log(`  ✅ Executed ${successCount} statements`);
}

// Clear all data
async function clearData() {
  console.log('\n🗑️  Clearing existing data...');
  
  const tables = ['brands', 'articles', 'products', 'categories'];
  
  for (const table of tables) {
    try {
      await pool.query(`TRUNCATE TABLE ${table} CASCADE`);
      console.log(`  🗑️  Cleared ${table}`);
    } catch (err) {
      if (err.message.includes('does not exist')) {
        console.log(`  ℹ️  ${table} doesn't exist yet`);
      } else {
        console.log(`  ⚠️  Error clearing ${table}: ${err.message.substring(0, 50)}`);
      }
    }
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
    
    // Insert in batches
    const batchSize = 100;
    let success = 0;
    let failed = 0;
    
    for (let i = 0; i < records.length; i += batchSize) {
      const batch = records.slice(i, i + batchSize);
      
      try {
        // Build INSERT query
        for (const record of batch) {
          const columns = Object.keys(record);
          const values = Object.values(record);
          const placeholders = values.map((_, i) => `$${i + 1}`).join(', ');
          
          // Handle JSON fields
          const jsonFields = ['full_description', 'pricing', 'specifications', 'faq', 'images', 
                            'additional_image_urls', 'categories', 'tags', 'shipping_info',
                            'buying_guide', 'content'];
          
          const insertColumns = columns.map(col => {
            if (jsonFields.includes(col) && record[col] !== null && record[col] !== undefined) {
              return `${col} = ${col}::jsonb`;
            }
            return col;
          }).join(', ');
          
          const query = `
            INSERT INTO ${collectionName} (${columns.join(', ')})
            VALUES (${placeholders})
            ON CONFLICT (id) DO UPDATE SET ${insertColumns}
          `;
          
          await pool.query(query, values);
          success++;
        }
        
        const progress = Math.min(i + batchSize, records.length);
        const percent = Math.round((progress / records.length) * 100);
        console.log(`  → Progress: ${progress}/${records.length} (${percent}%)`);
        
      } catch (err) {
        console.log(`  ⚠️  Batch error: ${err.message.substring(0, 80)}`);
        failed += batch.length;
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
  console.log('🚀 Direct MongoDB → PostgreSQL Migration Tool');
  console.log('='.repeat(70));
  console.log(`MongoDB: ${MONGODB_URI.replace(/\/\/[^:]+:[^@]+@/, '//***:***@')}`);
  console.log(`PostgreSQL: ${DATABASE_URI.replace(/\/\/[^:]+:[^@]+@/, '//***:***@')}`);
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
    await pool.query('SELECT 1');
    console.log('  ✅ PostgreSQL connected');
  } catch (err) {
    console.error('  ❌ PostgreSQL connection failed:', err.message);
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
  console.log('\n⚠️  About to start migration:');
  console.log('   - Data will be read from MongoDB online');
  console.log('   - Tables will be created in PostgreSQL');
  console.log('   - Existing data will be truncated');
  console.log('\nContinue? (y/N)');
  
  const readline = require('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  const answer = await new Promise(resolve => rl.question('> ', resolve));
  rl.close();
  
  if (answer.toLowerCase() !== 'y') {
    console.log('\n❌ Migration cancelled');
    await mongoClient.close();
    await pool.end();
    process.exit(0);
  }
  
  // Step 4: Create tables
  await createTables();
  
  // Step 5: Clear existing data
  await clearData();
  
  // Step 6: Run migration
  console.log('\n3️⃣  Starting data migration...');
  const results = {};
  
  for (const col of COLLECTIONS) {
    if (collectionNames.includes(col)) {
      results[col] = await migrateCollection(db, col);
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
    console.log(`2. Update .env.local: Ensure USE_POSTGRES=1`);
    console.log(`3. Test your application`);
  } else if (totalFailed > 0) {
    console.log('\n⚠️  Some records failed to migrate. Check errors above.');
  }
  
  // Cleanup
  await mongoClient.close();
  await pool.end();
  console.log('\n✅ All done');
}

main().catch(err => {
  console.error('\n❌ Migration failed:', err);
  console.error(err.stack);
  process.exit(1);
});
