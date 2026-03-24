#!/usr/bin/env node

/**
 * Execute Supabase Database Migration
 * 
 * Usage:
 *   node scripts/execute-supabase-migration.js
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

// Configuration
const SUPABASE_URL = 'https://yderhgkjcsaqrsfntpqm.supabase.co';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlkZXJoZ2tqY3NhcXJzZm50cHFtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDI0NDU3MiwiZXhwIjoyMDg5ODIwNTcyfQ.aX9EPl9c9NXZ2fUZ1oJSxtTeak67Y8w4cPO97EooaQM';

// Read SQL migration file
const migrationPath = path.join(__dirname, '../supabase/migrations/009_full_schema.sql');
const sqlContent = fs.readFileSync(migrationPath, 'utf8');

console.log('🚀 Executing Supabase Migration');
console.log('='.repeat(50));
console.log(`Project: yderhgkjcsaqrsfntpqm`);
console.log(`Migration: 009_full_schema.sql`);
console.log('='.repeat(50));

// Execute SQL via PostgRPC
function executeSQL(sql) {
  return new Promise((resolve, reject) => {
    const url = new URL('/rpc/exec_sql', SUPABASE_URL);
    
    const options = {
      hostname: url.hostname,
      port: 443,
      path: url.pathname,
      method: 'POST',
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
          resolve({ status: res.statusCode, data: body });
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${body}`));
        }
      });
    });

    req.on('error', reject);
    req.write(JSON.stringify({ query: sql }));
    req.end();
  });
}

// Alternative: Execute via direct SQL endpoint
function executeSQLDirect(sql) {
  return new Promise((resolve, reject) => {
    const url = new URL('/rest/v1/', SUPABASE_URL);
    
    const options = {
      hostname: url.hostname,
      port: 443,
      path: url.pathname,
      method: 'POST',
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
        // 400 is expected for schema creation (tables already exist)
        if (res.statusCode === 200 || res.statusCode === 201 || res.statusCode === 400) {
          resolve({ status: res.statusCode, data: body });
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${body}`));
        }
      });
    });

    req.on('error', reject);
    req.end();
  });
}

async function main() {
  try {
    console.log('\n📝 Checking existing tables...');
    
    // Check if tables exist
    const checkResponse = await fetch(`${SUPABASE_URL}/rest/v1/categories?select=id&limit=1`, {
      headers: {
        'apikey': SERVICE_KEY,
        'Authorization': `Bearer ${SERVICE_KEY}`,
      }
    });
    
    if (checkResponse.ok) {
      console.log('✅ Tables already exist');
    } else {
      console.log('⚠️  Tables do not exist, will create them');
    }

    console.log('\n💡 Note: This script checks table existence.');
    console.log('To create tables, use the Supabase Dashboard SQL Editor:');
    console.log(`https://supabase.com/dashboard/project/yderhgkjcsaqrsfntpqm/sql/new`);
    console.log('\nOr run:');
    console.log('  cd machrio');
    console.log('  npx prisma db push');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

main();
