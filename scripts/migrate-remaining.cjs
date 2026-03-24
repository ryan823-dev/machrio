const { MongoClient } = require('mongodb');
const https = require('https');
const crypto = require('crypto');

const MONGO_URI = 'mongodb+srv://mroworks_db_user:moore1982@mroworks-dev.gbqxebq.mongodb.net/machrio';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlkZXJoZ2tqY3NhcXJzZm50cHFtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDI0NDU3MiwiZXhwIjoyMDg5ODIwNTcyfQ.aX9EPl9c9NXZ2fUZ1oJSxtTeak67Y8w4cPO97EooaQM';

function uuidFromString(str) {
  const hash = crypto.createHash('sha256').update(str || 'default').digest();
  const bytes = Buffer.from(hash.slice(0, 16));
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = bytes.toString('hex');
  return [hex.slice(0,8), hex.slice(8,12), hex.slice(12,16), hex.slice(16,20), hex.slice(20,32)].join('-');
}

async function getExistingSkus() {
  const skus = new Set();
  let offset = 0;
  const limit = 1000;

  console.log('Fetching existing SKUs from Supabase...');
  while (true) {
    const result = await new Promise((resolve) => {
      const options = {
        hostname: 'yderhgkjcsaqrsfntpqm.supabase.co',
        path: `/rest/v1/products?select=sku&limit=${limit}&offset=${offset}`,
        method: 'GET',
        headers: { 'apikey': SERVICE_KEY, 'Authorization': 'Bearer ' + SERVICE_KEY }
      };
      https.get(options, res => {
        let body = '';
        res.on('data', chunk => body += chunk);
        res.on('end', () => resolve(body));
      }).on('error', () => resolve('[]'));
    });

    try {
      const products = JSON.parse(result);
      if (products.length === 0) break;
      products.forEach(p => skus.add(p.sku));
      offset += limit;
      console.log(`  Fetched ${offset} SKUs...`);
      if (products.length < limit) break;
    } catch (e) { 
      console.log('  Error parsing, breaking');
      break; 
    }
  }

  console.log(`Found ${skus.size} existing SKUs`);
  return skus;
}

function transformProduct(mongoProd) {
  const id = uuidFromString(mongoProd._id.toString());
  
  const categories = mongoProd.categories || [];
  const categoryIds = categories.map(c => {
    const catId = c.categoryId || c;
    return uuidFromString(catId.toString());
  });
  
  const primaryCategoryId = mongoProd.primaryCategory 
    ? uuidFromString(mongoProd.primaryCategory.toString())
    : null;

  return {
    id,
    sku: mongoProd.sku,
    name: mongoProd.name,
    status: mongoProd.status || 'published',
    short_description: mongoProd.shortDescription || null,
    full_description: mongoProd.fullDescription || null,
    purchase_mode: mongoProd.purchaseMode || null,
    pricing: mongoProd.pricing ? JSON.stringify(mongoProd.pricing) : null,
    availability: mongoProd.availability || null,
    min_order_quantity: mongoProd.minOrderQuantity || null,
    package_qty: mongoProd.packageQty || null,
    package_unit: mongoProd.packageUnit || null,
    weight: null,
    specifications: mongoProd.specifications ? JSON.stringify(mongoProd.specifications) : null,
    faq: mongoProd.faq ? JSON.stringify(mongoProd.faq) : null,
    images: mongoProd.industries ? JSON.stringify(mongoProd.industries) : null,
    external_image_url: mongoProd.externalImageUrl || null,
    additional_image_urls: null,
    categories: categoryIds.length > 0 ? categoryIds : null,
    tags: null,
    meta_title: mongoProd.seo?.metaTitle || null,
    meta_description: mongoProd.seo?.metaDescription || null,
    focus_keyword: mongoProd.seo?.focusKeyword || null,
    source_url: mongoProd.sourceUrl || null,
    shipping_info: mongoProd.shippingInfo || null,
    primary_category_id: primaryCategoryId
  };
}

async function batchInsert(records) {
  return new Promise((resolve) => {
    const data = JSON.stringify(records);
    const options = {
      hostname: 'yderhgkjcsaqrsfntpqm.supabase.co',
      path: '/rest/v1/products',
      method: 'POST',
      headers: {
        'apikey': SERVICE_KEY,
        'Authorization': 'Bearer ' + SERVICE_KEY,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      }
    };

    const req = https.request(options, res => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        if (res.statusCode === 201 || res.statusCode === 200) {
          resolve(records.length);
        } else if (res.statusCode === 409) {
          resolve(0);
        } else {
          console.log(`  HTTP ${res.statusCode}: ${body.substring(0, 100)}`);
          resolve(0);
        }
      });
    });

    req.on('error', (e) => {
      console.log('  Request error:', e.message);
      resolve(0);
    });
    req.write(data);
    req.end();
  });
}

async function main() {
  const client = new MongoClient(MONGO_URI);
  
  try {
    await client.connect();
    console.log('✅ MongoDB connected\n');
    
    const db = client.db('machrio');
    const existingSkus = await getExistingSkus();
    
    const missingProducts = await db.collection('products').find({
      sku: { $nin: Array.from(existingSkus) }
    }).toArray();
    
    console.log(`\nFound ${missingProducts.length} products to migrate\n`);
    
    if (missingProducts.length === 0) {
      console.log('✅ All products already migrated!');
      return;
    }
    
    // Migrate in batches
    const batchSize = 50;
    let totalInserted = 0;
    
    for (let i = 0; i < missingProducts.length; i += batchSize) {
      const batch = missingProducts.slice(i, i + batchSize);
      const records = batch.map(transformProduct);
      
      const inserted = await batchInsert(records);
      totalInserted += inserted;
      
      console.log(`Batch ${Math.floor(i/batchSize)+1}: +${inserted} | Total: ${i + batch.length}/${missingProducts.length}`);
    }
    
    console.log(`\n==================================================`);
    console.log(`✅ Done! Migrated: ${totalInserted}, Total in Supabase: ${existingSkus.size + totalInserted}`);
    
  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    await client.close();
  }
}

main().catch(console.error);
