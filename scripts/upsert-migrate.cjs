const { MongoClient } = require('mongodb');
const https = require('https');

const MONGODB_URI = 'mongodb+srv://mroworks_db_user:moore1982@mroworks-dev.gbqxebq.mongodb.net/machrio';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlkZXJoZ2tqY3NhcXJzZm50cHFtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDI0NDU3MiwiZXhwIjoyMDg5ODIwNTcyfQ.aX9EPl9c9NXZ2fUZ1oJSxtTeak67Y8w4cPO97EooaQM';

function upsert(table, record, uniqueKey) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(record);
    const options = {
      hostname: 'yderhgkjcsaqrsfntpqm.supabase.co',
      port: 443,
      path: '/rest/v1/' + table + '?on_conflict=' + uniqueKey,
      method: 'POST',
      headers: {
        'apikey': SERVICE_KEY,
        'Authorization': 'Bearer ' + SERVICE_KEY,
        'Content-Type': 'application/json',
        'Prefer': 'resolution=merge-duplicates'
      }
    };
    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) resolve(true);
        else reject(new Error(res.statusCode + ': ' + body.slice(0, 80)));
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
  console.log('🚀 Upsert Migration\n');
  
  const mongo = new MongoClient(MONGODB_URI);
  await mongo.connect();
  const db = mongo.db('machrio');

  // Categories
  console.log('📦 Categories...');
  const cats = await db.collection('categories').find({}).toArray();
  let ok = 0, fail = 0;
  for (const doc of cats) {
    try {
      await upsert('categories', transform(doc), 'slug');
      ok++;
      if (ok % 100 === 0) console.log('  → ' + ok + '/' + cats.length);
    } catch (e) {
      fail++;
      if (fail <= 3) console.log('  ❌ ' + doc.slug + ': ' + e.message.slice(0, 50));
    }
  }
  console.log('  ✅ ' + ok + ' ok, ' + fail + ' failed\n');

  // Products
  console.log('📦 Products...');
  const prods = await db.collection('products').find({}).toArray();
  ok = 0, fail = 0;
  for (const doc of prods) {
    try {
      await upsert('products', transform(doc), 'sku');
      ok++;
      if (ok % 500 === 0) console.log('  → ' + ok + '/' + prods.length);
    } catch (e) {
      fail++;
      if (fail <= 5) console.log('  ❌ ' + doc.sku + ': ' + e.message.slice(0, 50));
    }
  }
  console.log('  ✅ ' + ok + ' ok, ' + fail + ' failed\n');

  // Articles
  console.log('📦 Articles...');
  const arts = await db.collection('articles').find({}).toArray();
  ok = 0;
  for (const doc of arts) {
    try { await upsert('articles', transform(doc), 'slug'); ok++; } catch (e) {}
  }
  console.log('  ✅ ' + ok + '/' + arts.length + '\n');

  // Brands
  console.log('📦 Brands...');
  const brands = await db.collection('brands').find({}).toArray();
  ok = 0;
  for (const doc of brands) {
    try { await upsert('brands', transform(doc), 'slug'); ok++; } catch (e) {}
  }
  console.log('  ✅ ' + ok + '/' + brands.length + '\n');

  await mongo.close();
  console.log('🎉 Migration Complete!');
}

migrate().catch(e => console.error('Error:', e.message));
