#!/usr/bin/env node

/**
 * 迁移验证工具
 * 
 * 验证 MongoDB 和 Supabase 之间的数据一致性
 * 生成详细的验证报告
 * 
 * 使用方法：
 *   node scripts/verify-migration.cjs
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

// REST API helper
function supabaseRequest(method, endpoint) {
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
        'Content-Type': 'application/json'
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
    req.end();
  });
}

// Get count using aggregate function
function getSupabaseCount(table) {
  return new Promise((resolve) => {
    const url = `${SUPABASE_URL}/rest/v1/${table}?select=count`;
    const options = {
      hostname: 'yderhgkjcsaqrsfntpqm.supabase.co',
      path: `/rest/v1/${table}?select=count`,
      method: 'GET',
      headers: {
        'apikey': SERVICE_KEY,
        'Authorization': 'Bearer ' + SERVICE_KEY
      }
    };

    https.get(options, res => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const result = JSON.parse(body);
          if (Array.isArray(result) && result.length > 0 && result[0].count) {
            resolve(result[0].count);
          } else {
            resolve(0);
          }
        } catch {
          resolve(0);
        }
      });
    }).on('error', () => resolve(0));
  });
}

// Get MongoDB stats
async function getMongoStats() {
  console.log('\n📊 MongoDB Statistics');
  console.log('='.repeat(70));
  
  let mongoClient;
  try {
    mongoClient = new MongoClient(MONGODB_URI);
    await mongoClient.connect();
    const db = mongoClient.db('machrio');
    
    const stats = {};
    for (const col of COLLECTIONS) {
      try {
        const count = await db.collection(col).countDocuments();
        const sample = await db.collection(col).findOne();
        stats[col] = {
          count,
          hasData: count > 0,
          sampleFields: sample ? Object.keys(sample).slice(0, 10) : []
        };
        console.log(`  ${col.padEnd(15)} ${count.toString().padStart(6)} records`);
      } catch (err) {
        stats[col] = { count: 0, error: err.message };
        console.log(`  ${col.padEnd(15)} ❌ Error: ${err.message.substring(0, 40)}`);
      }
    }
    
    await mongoClient.close();
    return stats;
  } catch (err) {
    console.error('  ❌ MongoDB connection failed:', err.message);
    return null;
  }
}

// Get Supabase stats
async function getSupabaseStats() {
  console.log('\n📊 Supabase Statistics');
  console.log('='.repeat(70));
  
  const stats = {};
  
  for (const col of COLLECTIONS) {
    try {
      // Get count using aggregate function
      const count = await getSupabaseCount(col);
      
      // Get sample
      const sampleResult = await supabaseRequest('GET', `/rest/v1/${col}?select=*&limit=1`);
      const sample = Array.isArray(sampleResult.data) && sampleResult.data.length > 0 
        ? sampleResult.data[0] 
        : null;
      
      stats[col] = {
        count,
        hasData: count > 0,
        sampleFields: sample ? Object.keys(sample).slice(0, 10) : []
      };
      console.log(`  ${col.padEnd(15)} ${count.toString().padStart(6)} records`);
    } catch (err) {
      stats[col] = { count: 0, error: err.message };
      console.log(`  ${col.padEnd(15)} ❌ ${err.message.substring(0, 40)}`);
    }
  }
  
  return stats;
}

// Compare data
async function compareData(mongoStats, supaStats) {
  console.log('\n📈 Data Comparison');
  console.log('='.repeat(70));
  
  const comparisons = [];
  
  for (const col of COLLECTIONS) {
    const mongo = mongoStats[col] || { count: 0 };
    const supa = supaStats[col] || { count: 0 };
    
    const mongoCount = mongo.count || 0;
    const supaCount = supa.count || 0;
    
    const match = mongoCount === supaCount;
    const status = match ? '✅' : supaCount === 0 ? '⚠️' : '❌';
    
    comparisons.push({
      collection: col,
      mongo: mongoCount,
      supabase: supaCount,
      match,
      status
    });
    
    console.log(`  ${status} ${col.padEnd(15)} MongoDB: ${mongoCount.toString().padStart(6)} | Supabase: ${supaCount.toString().padStart(6)} ${match ? '✅' : `(${supaCount - mongoCount > 0 ? '+' : ''}${supaCount - mongoCount})`}`);
  }
  
  return comparisons;
}

// Check data integrity
async function checkDataIntegrity() {
  console.log('\n🔍 Data Integrity Checks');
  console.log('='.repeat(70));
  
  const checks = [];
  
  for (const col of COLLECTIONS) {
    try {
      const result = await supabaseRequest('GET', `/rest/v1/${col}?select=id,created_at&limit=5`);
      
      if (result.status === 200 && Array.isArray(result.data)) {
        const hasIds = result.data.every(row => row.id);
        const hasDates = result.data.every(row => row.created_at);
        
        checks.push({
          collection: col,
          hasIds,
          hasDates,
          sampleCount: result.data.length
        });
        
        console.log(`  ${col.padEnd(15)} ${hasIds ? '✅' : '❌'} IDs | ${hasDates ? '✅' : '❌'} Timestamps | ${result.data.length} samples`);
      }
    } catch (err) {
      // Ignore errors
    }
  }
  
  return checks;
}

// Generate report
function generateReport(mongoStats, supaStats, comparisons) {
  const report = {
    timestamp: new Date().toISOString(),
    mongodb: mongoStats,
    supabase: supaStats,
    comparisons,
    summary: {
      totalCollections: COLLECTIONS.length,
      migratedCollections: comparisons.filter(c => c.supabase > 0).length,
      fullyMigrated: comparisons.filter(c => c.match).length,
      totalRecords: comparisons.reduce((sum, c) => sum + c.supabase, 0)
    }
  };
  
  // Save report
  const reportPath = path.join(process.cwd(), 'migration-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`\n📄 Report saved to: ${reportPath}`);
  
  return report;
}

// Print summary
function printSummary(report) {
  console.log('\n' + '='.repeat(70));
  console.log('📋 MIGRATION SUMMARY');
  console.log('='.repeat(70));
  console.log(`Timestamp: ${report.timestamp}`);
  console.log(`Collections: ${report.summary.totalCollections}`);
  console.log(`Migrated: ${report.summary.migratedCollections}`);
  console.log(`Fully Matched: ${report.summary.fullyMigrated}`);
  console.log(`Total Records in Supabase: ${report.summary.totalRecords}`);
  
  if (report.summary.fullyMigrated === report.summary.totalCollections) {
    console.log('\n🎉 ALL COLLECTIONS MIGRATED SUCCESSFULLY!');
  } else if (report.summary.migratedCollections > 0) {
    console.log('\n⚠️  PARTIAL MIGRATION - Some collections need attention');
  } else {
    console.log('\n❌ NO DATA MIGRATED - Tables may not exist');
  }
}

async function main() {
  console.log('🔍 Migration Verification Tool');
  console.log('='.repeat(70));
  console.log(`MongoDB: ${MONGODB_URI.replace(/\/\/[^:]+:[^@]+@/, '//***:***@')}`);
  console.log(`Supabase: ${SUPABASE_URL}`);
  console.log('='.repeat(70));
  
  // Get stats
  const mongoStats = await getMongoStats();
  const supaStats = await getSupabaseStats();
  
  if (!mongoStats) {
    console.error('\n❌ Cannot connect to MongoDB');
    process.exit(1);
  }
  
  // Compare
  const comparisons = await compareData(mongoStats, supaStats);
  
  // Check integrity
  await checkDataIntegrity();
  
  // Generate report
  const report = generateReport(mongoStats, supaStats, comparisons);
  
  // Print summary
  printSummary(report);
  
  // Exit code based on migration status
  if (report.summary.fullyMigrated === report.summary.totalCollections) {
    process.exit(0); // Success
  } else if (report.summary.migratedCollections > 0) {
    process.exit(1); // Partial
  } else {
    process.exit(2); // Failed
  }
}

main().catch(err => {
  console.error('\n❌ Verification failed:', err.message);
  process.exit(2);
});
