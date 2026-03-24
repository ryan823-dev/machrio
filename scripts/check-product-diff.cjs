const { MongoClient } = require('mongodb');
const https = require('https');

const MONGO_URI = 'mongodb+srv://mroworks_db_user:moore1982@mroworks-dev.gbqxebq.mongodb.net/machrio';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlkZXJoZ2tqY3NhcXJzZm50cHFtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDI0NDU3MiwiZXhwIjoyMDg5ODIwNTcyfQ.aX9EPl9c9NXZ2fUZ1oJSxtTeak67Y8w4cPO97EooaQM';

async function getSupabaseSkus() {
  const skus = new Set();
  let offset = 0;
  const limit = 1000;

  console.log('Fetching SKUs from Supabase...');
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

  console.log(`Found ${skus.size} SKUs in Supabase`);
  return skus;
}

async function checkMongoProducts() {
  const client = new MongoClient(MONGO_URI);
  
  try {
    await client.connect();
    const db = client.db('machrio');
    const products = await db.collection('products').find({}).toArray();
    
    console.log(`\nMongoDB Products Analysis:`);
    console.log(`Total: ${products.length}`);
    
    // Check status distribution
    const statusCount = {};
    products.forEach(p => {
      const status = p.status || 'unknown';
      statusCount[status] = (statusCount[status] || 0) + 1;
    });
    
    console.log('\nStatus distribution:');
    Object.entries(statusCount).forEach(([status, count]) => {
      console.log(`  ${status}: ${count}`);
    });
    
    // Check which products are not in Supabase
    const supabaseSkus = await getSupabaseSkus();
    const missingProducts = products.filter(p => !supabaseSkus.has(p.sku));
    
    console.log(`\nMissing in Supabase: ${missingProducts.length}`);
    
    if (missingProducts.length > 0) {
      console.log('\nFirst 10 missing products:');
      missingProducts.slice(0, 10).forEach(p => {
        console.log(`  - ${p.sku}: ${p.name} (status: ${p.status})`);
      });
    }
    
  } finally {
    await client.close();
  }
}

checkMongoProducts().catch(console.error);
