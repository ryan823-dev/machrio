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

async function getSupabaseSkus() {
  const skus = new Set();
  let offset = 0;
  const limit = 1000;

  while (true) {
    const result = await new Promise((resolve) => {
      const options = {
        hostname: 'yderhgkjcsaqrsfntpqm.supabase.co',
        path: `/rest/v1/products?select=sku&limit=${limit}&offset=${offset}`,
        method: 'GET',
        headers: {
          'apikey': SERVICE_KEY,
          'Authorization': 'Bearer ' + SERVICE_KEY
        }
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
      if (products.length < limit) break;
    } catch { break; }
  }

  return skus;
}

async function checkMissingProducts() {
  const client = new MongoClient(MONGO_URI);
  
  try {
    await client.connect();
    const db = client.db('machrio');
    
    const supabaseSkus = await getSupabaseSkus();
    console.log(`Supabase has ${supabaseSkus.size} SKUs`);
    
    const missingProducts = await db.collection('products').find({
      sku: { $nin: Array.from(supabaseSkus) }
    }).toArray();
    
    console.log(`\nMissing products: ${missingProducts.length}`);
    
    if (missingProducts.length > 0) {
      console.log('\nFirst 5 missing products structure:');
      missingProducts.slice(0, 5).forEach((p, i) => {
        console.log(`\n${i+1}. ${p.sku}:`);
        console.log(`   ID: ${p._id} -> UUID: ${uuidFromString(p._id.toString())}`);
        console.log(`   Name: ${p.name}`);
        console.log(`   Status: ${p.status}`);
        console.log(`   Keys: ${Object.keys(p).join(', ')}`);
      });
      
      // Check if they have all required fields
      const first = missingProducts[0];
      console.log('\n\nField check for first product:');
      console.log(`  Has SKU: ${!!first.sku}`);
      console.log(`  Has Name: ${!!first.name}`);
      console.log(`  Has Status: ${!!first.status}`);
      console.log(`  Has Categories: ${!!first.categories}`);
    }
    
  } finally {
    await client.close();
  }
}

checkMissingProducts().catch(console.error);
