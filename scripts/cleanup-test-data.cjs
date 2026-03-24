const https = require('https');

const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlkZXJoZ2tqY3NhcXJzZm50cHFtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDI0NDU3MiwiZXhwIjoyMDg5ODIwNTcyfQ.aX9EPl9c9NXZ2fUZ1oJSxtTeak67Y8w4cPO97EooaQM';

async function findAndDeleteTestSkus() {
  console.log('Finding test SKUs in Supabase...\n');
  
  const testSkus = [];
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
        if (p.sku.startsWith('TEST-') || p.sku.includes('test')) {
          testSkus.push(p);
        }
      });
      
      offset += limit;
      if (products.length < limit) break;
    } catch { break; }
  }

  console.log(`Found ${testSkus.length} test SKUs:\n`);
  testSkus.forEach(t => {
    console.log(`  ${t.sku} (${t.id})`);
  });

  if (testSkus.length > 0) {
    console.log('\nDeleting test SKUs...');
    for (const t of testSkus) {
      const result = await new Promise((resolve) => {
        const options = {
          hostname: 'yderhgkjcsaqrsfntpqm.supabase.co',
          path: `/rest/v1/products?id=eq.${t.id}`,
          method: 'DELETE',
          headers: { 
            'apikey': SERVICE_KEY, 
            'Authorization': 'Bearer ' + SERVICE_KEY 
          }
        };
        https.request(options, res => {
          resolve(res.statusCode);
        }).on('error', () => resolve(0)).end();
      });
      console.log(`  Deleted ${t.sku}: HTTP ${result}`);
    }
  }

  console.log('\n✅ Cleanup complete!');
}

findAndDeleteTestSkus().catch(console.error);
