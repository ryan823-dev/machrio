#!/usr/bin/env node

const { MongoClient } = require('mongodb');
const https = require('https');

const MONGODB_URI = 'mongodb+srv://mroworks_db_user:moore1982@mroworks-dev.gbqxebq.mongodb.net/machrio';
const SUPABASE_URL = 'yderhgkjcsaqrsfntpqm.supabase.co';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlkZXJoZ2tqY3NhcXJzZm50cHFtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDI0NDU3MiwiZXhwIjoyMDg5ODIwNTcyfQ.aX9EPl9c9NXZ2fUZ1oJSxtTeak67Y8w4cPO97EooaQM';

function insert(table, record) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(record);
    const options = {
      hostname: SUPABASE_URL,
      port: 443,
      path: '/rest/v1/' + table,
      method: 'POST',
      headers: {
        'apikey': SERVICE_KEY,
        'Authorization': 'Bearer ' + SERVICE_KEY,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) resolve(true);
        else reject(new Error(res.statusCode + ': ' + body.slice(0, 100)));
      });
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

function transform(doc) {
  const r = {};
  for (const [k, v] of Object.entries(doc)) {
    if (k === '_id' || k === 'parent') continue;
    const key = k.replace(/([A-Z])/g, '_$1').toLowerCase();
    if (k === 'createdAt') r.created_at = v;
    else if (k === 'updatedAt') r.updated_at = v;
    else if (v && typeof v === 'object' && v.$oid) r[key] = null;
    else r[key] = v;
  }
  return r;
}

async function migrate() {
  console.log('Migration starting...');
  
  const mongo = new MongoClient(MONGODB_URI);
  await mongo.connect();
  const db = mongo.db('machrio');

  // Categories
  console.log('\nCategories:');
  const cats = await db.collection('categories').find({}).toArray();
  let ok = 0, fail = 0;
  for (const doc of cats) {
    try {
      await insert('categories', transform(doc));
      ok++;
      if (ok % 50 === 0) console.log('  ' + ok + '/' + cats.length);
    } catch (e) {
      fail++;
      if (fail <= 3) console.log('  Error: ' + e.message.slice(0, 50));
    }
  }
  console.log('  Done: ' + ok + ' ok, ' + fail + ' failed');

  // Products
  console.log('\nProducts:');
  const prods = await db.collection('products').find({}).toArray();
  ok = 0, fail = 0;
  for (const doc of prods) {
    try {
      await insert('products', transform(doc));
      ok++;
      if (ok % 200 === 0) console.log('  ' + ok + '/' + prods.length);
    } catch (e) {
      fail++;
      if (fail <= 5) console.log('  Error: ' + e.message.slice(0, 50));
    }
  }
  console.log('  Done: ' + ok + ' ok, ' + fail + ' failed');

  // Articles
  console.log('\nArticles:');
  const arts = await db.collection('articles').find({}).toArray();
  ok = 0;
  for (const doc of arts) {
    try { await insert('articles', transform(doc)); ok++; } catch (e) {}
  }
  console.log('  Done: ' + ok + '/' + arts.length);

  // Brands
  console.log('\nBrands:');
  const brands = await db.collection('brands').find({}).toArray();
  ok = 0;
  for (const doc of brands) {
    try { await insert('brands', transform(doc)); ok++; } catch (e) {}
  }
  console.log('  Done: ' + ok + '/' + brands.length);

  await mongo.close();
  console.log('\n✅ Complete!');
}

migrate().catch(e => console.error('Error:', e.message));
