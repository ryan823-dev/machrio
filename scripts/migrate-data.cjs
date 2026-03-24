#!/usr/bin/env node

/**
 * MongoDB Data Migration to Supabase
 * 
 * This script migrates data from MongoDB backup files to Supabase PostgreSQL.
 * 
 * Prerequisites:
 * 1. Tables must be created first (run create-tables.sql in Supabase SQL Editor)
 * 2. Backup files must exist in /Users/oceanlink/Documents/Qoder-1/backup/mongodb-export/
 * 
 * Usage:
 *   node scripts/migrate-data.cjs
 */

const https = require('https');
const fs = require('fs');

const SUPABASE_URL = 'https://yderhgkjcsaqrsfntpqm.supabase.co';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlkZXJoZ2tqY3NhcXJzZm50cHFtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDI0NDU3MiwiZXhwIjoyMDg5ODIwNTcyfQ.aX9EPl9c9NXZ2fUZ1oJSxtTeak67Y8w4cPO97EooaQM';
const BACKUP_DIR = '/Users/oceanlink/Documents/Qoder-1/backup/mongodb-export';

// Collections to migrate with field mappings
const COLLECTIONS = {
  'categories': {
    file: 'categories.json',
    table: 'categories',
    fields: ['id', 'name', 'slug', 'description', 'parent', 'level', 'displayOrder', 'image', 'icon', 'meta_title', 'meta_description', 'buying_guide', 'createdAt', 'updatedAt']
  },
  'products': {
    file: 'products_p1.json',
    table: 'products',
    fields: ['id', 'sku', 'name', 'shortDescription', 'fullDescription', 'category', 'status', 'availability', 'purchaseMode', 'leadTime', 'minOrderQuantity', 'packageQty', 'packageUnit', 'weight', 'pricing', 'specifications', 'faq', 'images', 'externalImageUrl', 'additionalImageUrls', 'categories', 'tags', 'metaTitle', 'metaDescription', 'focusKeyword', 'sourceUrl', 'shippingInfo', 'createdAt', 'updatedAt']
  },
  'articles': {
    file: 'articles.json',
    table: 'articles',
    fields: ['id', 'title', 'slug', 'description', 'content', 'category', 'tags', 'featuredImage', 'author', 'status', 'publishedAt', 'metaTitle', 'metaDescription', 'createdAt', 'updatedAt']
  },
  'brands': {
    file: 'brands.json',
    table: 'brands',
    fields: ['id', 'name', 'slug', 'description', 'logo', 'website', 'createdAt', 'updatedAt']
  }
};

// REST API helper for batch insert
function insertRecords(table, records) {
  return new Promise((resolve, reject) => {
    const url = new URL(`/rest/v1/${table}`, SUPABASE_URL);
    const options = {
      hostname: url.hostname,
      port: 443,
      path: url.pathname,
      method: 'POST',
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
          resolve({ success: records.length });
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
    req.write(JSON.stringify(records));
    req.end();
  });
}

// Transform MongoDB document to PostgreSQL record
function transformDoc(collection, doc) {
  const record = {};
  
  // Convert _id to id
  record.id = doc._id?.$oid || doc._id || doc.id;
  
  // Copy fields with name mapping
  for (const [key, value] of Object.entries(doc)) {
    if (key === '_id') continue;
    
    // Convert camelCase to snake_case for PostgreSQL
    const snakeKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
    
    // Convert dates
    if (key.endsWith('At') && typeof value === 'string') {
      record[snakeKey] = new Date(value).toISOString();
    } else if (key === 'parent' && value) {
      // Handle parent reference
      record.parent_id = value.$oid || value;
    } else {
      record[snakeKey] = value;
    }
  }
  
  return record;
}

async function migrateCollection(name, config) {
  console.log(`\n📦 Migrating ${name}...`);
  
  const filePath = `${BACKUP_DIR}/${config.file}`;
  
  if (!fs.existsSync(filePath)) {
    console.log(`  ⚠️  File not found: ${filePath}`);
    return { success: 0, failed: 0 };
  }
  
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  console.log(`  📄 Found ${data.length} records`);
  
  // Transform documents
  const records = data.map(doc => transformDoc(name, doc));
  
  // Insert in batches of 100
  const batchSize = 100;
  let success = 0;
  let failed = 0;
  
  for (let i = 0; i < records.length; i += batchSize) {
    const batch = records.slice(i, i + batchSize);
    
    try {
      await insertRecords(config.table, batch);
      success += batch.length;
      console.log(`  → Progress: ${Math.min(i + batchSize, records.length)}/${records.length}`);
    } catch (err) {
      // Try inserting one by one for failed batch
      console.log(`  ⚠️  Batch failed, trying individual inserts: ${err.message.substring(0, 60)}`);
      
      for (const record of batch) {
        try {
          await insertRecords(config.table, [record]);
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
}

async function main() {
  console.log('🚀 MongoDB to Supabase Data Migration');
  console.log('='.repeat(60));
  console.log(`Target: ${SUPABASE_URL}`);
  console.log(`Backup: ${BACKUP_DIR}`);
  console.log('='.repeat(60));
  
  // Test connection
  console.log('\n1️⃣  Testing connection...');
  try {
    const test = await fetch(`${SUPABASE_URL}/rest/v1/`, {
      headers: {
        'apikey': SERVICE_KEY,
        'Authorization': `Bearer ${SERVICE_KEY}`
      }
    });
    if (test.ok) {
      console.log('  ✅ Supabase connected');
    } else {
      console.error('  ❌ Connection failed');
      process.exit(1);
    }
  } catch (err) {
    console.error('  ❌ Error:', err.message);
    process.exit(1);
  }
  
  // Check files
  console.log('\n2️⃣  Checking backup files...');
  for (const [name, config] of Object.entries(COLLECTIONS)) {
    const filePath = `${BACKUP_DIR}/${config.file}`;
    if (fs.existsSync(filePath)) {
      const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      console.log(`  ✅ ${name}: ${data.length} records`);
    } else {
      console.log(`  ⚠️  ${name}: File not found`);
    }
  }
  
  // Confirm
  console.log('\n⚠️  This will insert data into Supabase tables.');
  console.log('Make sure tables are created first!');
  console.log('\nContinue? (y/N)');
  
  const readline = require('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  const answer = await new Promise(resolve => rl.question('> ', resolve));
  rl.close();
  
  if (answer.toLowerCase() !== 'y') {
    console.log('Migration cancelled');
    process.exit(0);
  }
  
  // Run migration
  console.log('\n3️⃣  Starting migration...');
  const results = {};
  
  for (const [name, config] of Object.entries(COLLECTIONS)) {
    try {
      results[name] = await migrateCollection(name, config);
    } catch (err) {
      console.error(`  ❌ ${name} failed:`, err.message);
      results[name] = { success: 0, failed: 0, error: err.message };
    }
  }
  
  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 Migration Summary:');
  let totalSuccess = 0;
  let totalFailed = 0;
  
  for (const [name, result] of Object.entries(results)) {
    console.log(`  ${name}: ✅ ${result.success}, ❌ ${result.failed}`);
    totalSuccess += result.success;
    totalFailed += result.failed;
  }
  
  console.log('\n' + '='.repeat(60));
  console.log(`Total: ✅ ${totalSuccess} migrated, ❌ ${totalFailed} failed`);
  console.log('🎉 Migration complete!');
  
  if (totalFailed === 0 && totalSuccess > 0) {
    console.log('\n✅ All data migrated successfully!');
  } else if (totalFailed > 0) {
    console.log('\n⚠️  Some records failed. Check errors above.');
  }
}

main().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
