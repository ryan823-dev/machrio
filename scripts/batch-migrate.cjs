const { MongoClient } = require('mongodb');
const https = require('https');

const MONGODB_URI = 'mongodb+srv://mroworks_db_user:moore1982@mroworks-dev.gbqxebq.mongodb.net/machrio';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlkZXJoZ2tqY3NhcXJzZm50cHFtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDI0NDU3MiwiZXhwIjoyMDg5ODIwNTcyfQ.aX9EPl9c9NXZ2fUZ1oJSxtTeak67Y8w4cPO97EooaQM';

const SCHEMA = {
  categories: ['name','slug','description','parent_id','level','display_order','image','icon','meta_title','meta_description','buying_guide','created_at','updated_at','short_description','icon_emoji','featured','faq','facet_groups','intro_content','seo','seo_content'],
  products: ['sku','name','short_description','full_description','primary_category_id','status','availability','purchase_mode','lead_time','min_order_quantity','package_qty','package_unit','weight','pricing','specifications','faq','images','external_image_url','additional_image_urls','categories','tags','meta_title','meta_description','focus_keyword','source_url','shipping_info','created_at','updated_at'],
  articles: ['title','slug','description','content','category','tags','featured_image','author','status','published_at','meta_title','meta_description','created_at','updated_at'],
  brands: ['name','slug','description','logo','website','created_at','updated_at']
};

function post(table, record, onConflict) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(record);
    const options = {
      hostname: 'yderhgkjcsaqrsfntpqm.supabase.co',
      port: 443,
      path: '/rest/v1/' + table + (onConflict ? '?on_conflict=' + onConflict : ''),
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
        else reject(new Error(res.statusCode + ': ' + body.slice(0, 150)));
      });
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

function transform(doc, table) {
  const allowed = SCHEMA[table];
  const r = {};
  for (const [k, v] of Object.entries(doc)) {
    if (k === '_id' || k === 'parent') continue;
    const key = k.replace(/([A-Z])/g, '_$1').toLowerCase();
    if (!allowed.includes(key)) continue;
    if (k === 'createdAt') r.created_at = v;
    else if (k === 'updatedAt') r.updated_at = v;
    else if (k === 'publishedAt') r.published_at = v;
    else if (v && typeof v === 'object' && v.$oid) r[key] = null;
    else r[key] = v;
  }
  return r;
}

async function migrateCollection(db, name, uniqueKey) {
  console.log('\n📦 ' + name + '...');
  const docs = await db.collection(name).find({}).toArray();
  console.log('  Found ' + docs.length + ' records');
  
  let ok = 0, fail = 0;
  const errors = [];
  
  for (let i = 0; i < docs.length; i++) {
    try {
      await post(name, transform(docs[i], name), uniqueKey);
      ok++;
      if (ok % 200 === 0) process.stdout.write('\r  → ' + ok + '/' + docs.length);
    } catch (e) {
      fail++;
      errors.push(e.message);
    }
  }
  
  console.log('\r  ✅ ' + ok + ' ok, ' + fail + ' failed');
  if (errors.length > 0 && fail <= 5) {
    errors.slice(0, 3).forEach(e => console.log('    ' + e.slice(0, 80)));
  }
  return { ok, fail };
}

async function main() {
  console.log('🚀 Batch Migration');
  
  const mongo = new MongoClient(MONGODB_URI);
  await mongo.connect();
  const db = mongo.db('machrio');
  
  const results = {};
  
  // Skip categories (already done)
  console.log('\n✅ Categories: 635 (already migrated)');
  
  // Products
  results.products = await migrateCollection(db, 'products', 'sku');
  
  // Articles
  results.articles = await migrateCollection(db, 'articles', 'slug');
  
  // Brands
  results.brands = await migrateCollection(db, 'brands', 'slug');
  
  await mongo.close();
  
  console.log('\n' + '='.repeat(50));
  console.log('📊 Summary:');
  console.log('  Categories: 635');
  console.log('  Products: ' + results.products.ok);
  console.log('  Articles: ' + results.articles.ok);
  console.log('  Brands: ' + results.brands.ok);
  console.log('\n🎉 Done!');
}

main().catch(e => console.error('Error:', e.message));
