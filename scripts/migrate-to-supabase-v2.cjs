#!/usr/bin/env node

/**
 * MongoDB to Supabase Migration Script (v2)
 * 
 * Usage:
 *   node scripts/migrate-to-supabase-v2.cjs
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

// Configuration
const SUPABASE_URL = 'https://yderhgkjcsaqrsfntpqm.supabase.co';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlkZXJoZ2tqY3NhcXJzZm50cHFtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDI0NDU3MiwiZXhwIjoyMDg5ODIwNTcyfQ.aX9EPl9c9NXZ2fUZ1oJSxtTeak67Y8w4cPO97EooaQM';
const BACKUP_DIR = '/Users/oceanlink/Documents/Qoder-1/backup/mongodb-export';

// Collections to migrate
const COLLECTIONS = ['categories', 'products', 'articles', 'brands'];

// REST API helper
function apiRequest(method, endpoint, data = null) {
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
        'Prefer': data ? 'return=representation' : 'return=minimal'
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const result = body ? JSON.parse(body) : null;
          if (res.statusCode >= 400) {
            reject(new Error(`HTTP ${res.statusCode}: ${JSON.stringify(result)}`));
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

async function migrateCollection(collectionName) {
  console.log(`\n📦 Migrating ${collectionName}...`);
  
  const filePath = path.join(BACKUP_DIR, `${collectionName}.json`);
  
  if (!fs.existsSync(filePath)) {
    console.log(`  ⚠️  Backup file not found: ${filePath}`);
    return { success: 0, failed: 0 };
  }
  
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  console.log(`  📄 Found ${data.length} records`);
  
  // Clear existing data
  try {
    await apiRequest('DELETE', `/rest/v1/${collectionName}?gt=0`);
    console.log(`  🗑️  Cleared existing data`);
  } catch (err) {
    console.log(`  ⚠️  Clear failed (table may be empty): ${err.message.substring(0, 50)}`);
  }
  
  // Insert records
  let success = 0;
  let failed = 0;
  
  for (let i = 0; i < data.length; i++) {
    const doc = data[i];
    try {
      // Convert MongoDB _id to id
      const record = {
        id: doc._id?.$oid || doc._id || doc.id,
        ...doc,
      };
      delete record._id;
      
      // Convert dates
      if (record.createdAt) {
        record.createdAt = new Date(record.createdAt).toISOString();
      }
      if (record.updatedAt) {
        record.updatedAt = new Date(record.updatedAt).toISOString();
      }
      
      await apiRequest('POST', `/rest/v1/${collectionName}`, record);
      success++;
      
      if (success % 50 === 0) {
        console.log(`  → Progress: ${success}/${data.length}`);
      }
    } catch (err) {
      failed++;
      if (failed <= 3) {
        console.log(`  ❌ Failed: ${err.message.substring(0, 80)}`);
      }
    }
  }
  
  console.log(`  ✅ Success: ${success}, Failed: ${failed}`);
  return { success, failed };
}

async function main() {
  console.log('🚀 MongoDB to Supabase Migration (v2)');
  console.log('='.repeat(60));
  console.log(`Target: ${SUPABASE_URL}`);
  console.log(`Backup: ${BACKUP_DIR}`);
  console.log('='.repeat(60));
  
  // Test connection
  console.log('\n1️⃣  Testing Supabase connection...');
  try {
    await apiRequest('GET', '/rest/v1/');
    console.log('  ✅ Supabase REST API connected');
  } catch (err) {
    console.error('  ❌ Connection failed:', err.message);
    process.exit(1);
  }
  
  // Check backup files
  console.log('\n2️⃣  Checking backup files...');
  for (const col of COLLECTIONS) {
    const filePath = path.join(BACKUP_DIR, `${col}.json`);
    if (fs.existsSync(filePath)) {
      const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      console.log(`  ✅ ${col}: ${data.length} records`);
    } else {
      console.log(`  ⚠️  ${col}: Not found`);
    }
  }
  
  // Confirm migration
  console.log('\n⚠️  This will clear existing data and migrate from MongoDB.');
  console.log('Continue? (y/N)');
  
  const readline = require('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  const answer = await new Promise(resolve => {
    rl.question('> ', resolve);
  });
  rl.close();
  
  if (answer.toLowerCase() !== 'y') {
    console.log('Migration cancelled');
    process.exit(0);
  }
  
  // Run migration
  console.log('\n3️⃣  Starting migration...');
  const results = {};
  
  for (const col of COLLECTIONS) {
    try {
      results[col] = await migrateCollection(col);
    } catch (err) {
      console.error(`  ❌ ${col} migration failed:`, err.message);
      results[col] = { success: 0, failed: 0, error: err.message };
    }
  }
  
  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 Migration Summary:');
  let totalSuccess = 0;
  let totalFailed = 0;
  
  for (const [col, result] of Object.entries(results)) {
    console.log(`  ${col}: ✅ ${result.success}, ❌ ${result.failed}`);
    totalSuccess += result.success;
    totalFailed += result.failed;
  }
  
  console.log('\n' + '='.repeat(60));
  console.log(`Total: ✅ ${totalSuccess} migrated, ❌ ${totalFailed} failed`);
  console.log('🎉 Migration complete!');
}

main().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
