#!/usr/bin/env node

/**
 * Create Supabase Tables
 * 
 * Usage:
 *   node scripts/create-tables.cjs
 */

const https = require('https');

const SUPABASE_URL = 'https://yderhgkjcsaqrsfntpqm.supabase.co';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlkZXJoZ2tqY3NhcXJzZm50cHFtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDI0NDU3MiwiZXhwIjoyMDg5ODIwNTcyfQ.aX9EPl9c9NXZ2fUZ1oJSxtTeak67Y8w4cPO97EooaQM';

// Execute SQL via Supabase SQL endpoint
function executeSQL(sql) {
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
        // Success codes: 200, 201, 204
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve({ status: res.statusCode });
        } else {
          try {
            const error = JSON.parse(body);
            reject(new Error(`HTTP ${res.statusCode}: ${error.message || JSON.stringify(error)}`));
          } catch (e) {
            reject(new Error(`HTTP ${res.statusCode}: ${body.substring(0, 200)}`));
          }
        }
      });
    });

    req.on('error', reject);
    req.write(sql);
    req.end();
  });
}

async function createTable(name, columns) {
  console.log(`Creating table: ${name}...`);
  
  const sql = `
    CREATE TABLE IF NOT EXISTS "${name}" (
      ${columns.join(',\n      ')}
    );
  `;
  
  try {
    await executeSQL(sql);
    console.log(`  ✅ ${name} created`);
  } catch (err) {
    console.log(`  ⚠️  ${name}: ${err.message.substring(0, 100)}`);
  }
}

async function main() {
  console.log('🏗️  Creating Supabase Tables');
  console.log('='.repeat(50));
  
  // Categories
  await createTable('categories', [
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
  ]);
  
  // Products
  await createTable('products', [
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
    'specifications jsonb DEFAULT \'[]\'',
    'faq jsonb DEFAULT \'[]\'',
    'images jsonb DEFAULT \'[]\'',
    'external_image_url text',
    'additional_image_urls jsonb DEFAULT \'[]\'',
    'categories jsonb DEFAULT \'[]\'',
    'tags jsonb DEFAULT \'[]\'',
    'meta_title text',
    'meta_description text',
    'focus_keyword text',
    'source_url text',
    'shipping_info jsonb',
    'created_at timestamptz DEFAULT now()',
    'updated_at timestamptz DEFAULT now()'
  ]);
  
  // Articles
  await createTable('articles', [
    'id uuid PRIMARY KEY DEFAULT uuid_generate_v4()',
    'title text NOT NULL',
    'slug text UNIQUE NOT NULL',
    'description text',
    'content jsonb',
    'category text',
    'tags jsonb DEFAULT \'[]\'',
    'featured_image text',
    'author text',
    'status text DEFAULT \'draft\'',
    'published_at timestamptz',
    'meta_title text',
    'meta_description text',
    'created_at timestamptz DEFAULT now()',
    'updated_at timestamptz DEFAULT now()'
  ]);
  
  // Brands
  await createTable('brands', [
    'id uuid PRIMARY KEY DEFAULT uuid_generate_v4()',
    'name text UNIQUE NOT NULL',
    'slug text UNIQUE',
    'description text',
    'logo text',
    'website text',
    'created_at timestamptz DEFAULT now()',
    'updated_at timestamptz DEFAULT now()'
  ]);
  
  console.log('\n✅ Table creation complete!');
  console.log('\nNext step: Run migration script to import data');
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
