const { MongoClient } = require('mongodb');
const https = require('https');

const MONGO_URI = 'mongodb+srv://mroworks_db_user:moore1982@mroworks-dev.gbqxebq.mongodb.net/machrio';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlkZXJoZ2tqY3NhcXJzZm50cHFtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDI0NDU3MiwiZXhwIjoyMDg5ODIwNTcyfQ.aX9EPl9c9NXZ2fUZ1oJSxtTeak67Y8w4cPO97EooaQM';

async function findExtraProducts() {
  const client = new MongoClient(MONGO_URI);
  
  try {
    await client.connect();
    const db = client.db('machrio');
    const mongoProducts = await db.collection('products').find({}).toArray();
    
    const mongoSkus = new Set(mongoProducts.map(p => p.sku));
    console.log(`MongoDB has ${mongoSkus.size} SKUs`);
    
    const supabaseSkus = new Set();
    let offset = 0;
    const limit = 1000;

    console.log('Fetching Supabase SKUs...');
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
        products.forEach(p => supabaseSkus.add(p.sku));
        offset += limit;
        if (products.length < limit) break;
      } catch { break; }
    }

    console.log(`Supabase has ${supabaseSkus.size} SKUs`);
    
    const extraInSupabase = [...supabaseSkus].filter(sku => !mongoSkus.has(sku));
    const missingInSupabase = [...mongoSkus].filter(sku => !supabaseSkus.has(sku));
    
    console.log(`\nExtra in Supabase (${extraInSupabase.length}):`);
    extraInSupabase.slice(0, 10).forEach(sku => console.log(`  ${sku}`));
    
    console.log(`\nMissing in Supabase (${missingInSupabase.length}):`);
    missingInSupabase.slice(0, 10).forEach(sku => console.log(`  ${sku}`));
    
  } finally {
    await client.close();
  }
}

findExtraProducts().catch(console.error);
