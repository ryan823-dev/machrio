const https = require('https');

const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlkZXJoZ2tqY3NhcXJzZm50cHFtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDI0NDU3MiwiZXhwIjoyMDg5ODIwNTcyfQ.aX9EPl9c9NXZ2fUZ1oJSxtTeak67Y8w4cPO97EooaQM';

async function getDuplicateSkus() {
  console.log('Checking for duplicate SKUs in Supabase...\n');
  
  const skuMap = new Map();
  let offset = 0;
  const limit = 1000;

  while (true) {
    const result = await new Promise((resolve) => {
      const options = {
        hostname: 'yderhgkjcsaqrsfntpqm.supabase.co',
        path: `/rest/v1/products?select=id,sku&limit=${limit}&offset=${offset}`,
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
      
      products.forEach(p => {
        if (skuMap.has(p.sku)) {
          skuMap.get(p.sku).push(p.id);
        } else {
          skuMap.set(p.sku, [p.id]);
        }
      });
      
      offset += limit;
      console.log(`Checked ${offset} products...`);
      if (products.length < limit) break;
    } catch { break; }
  }

  const duplicates = [];
  skuMap.forEach((ids, sku) => {
    if (ids.length > 1) {
      duplicates.push({ sku, ids });
    }
  });

  console.log(`\nFound ${duplicates.length} duplicate SKUs:\n`);
  duplicates.slice(0, 10).forEach(d => {
    console.log(`  ${d.sku}: ${d.ids.length} records`);
    console.log(`    IDs: ${d.ids.join(', ')}`);
  });

  return duplicates;
}

getDuplicateSkus().catch(console.error);
