const { Client } = require('pg');

async function checkProductPricing() {
  const client = new Client({
    connectionString: 'postgresql://postgres:sGmPTCagRVFtHszbygRzSvYTdUXgCFfH@crossover.proxy.rlwy.net:38475/railway'
  });

  try {
    await client.connect();
    console.log('Connected to database\n');

    // Get categories
    const catResult = await client.query(
      "SELECT id, slug FROM categories WHERE slug IN ('instant-adhesives', 'construction-adhesives', 'wood-glues')"
    );
    
    for (const cat of catResult.rows) {
      console.log(`=== Category: ${cat.slug} ===`);
      
      // Get products in this category
      const productResult = await client.query(
        `SELECT id, name, sku, pricing, status, external_image_url
         FROM products 
         WHERE primary_category_id = $1 
         LIMIT 5`,
        [cat.id]
      );
      
      if (productResult.rows.length === 0) {
        console.log('  No products found\n');
      } else {
        console.log(`  Found ${productResult.rows.length} product(s):\n`);
        for (const p of productResult.rows) {
          console.log(`  Product: ${p.name}`);
          console.log(`  SKU: ${p.sku}`);
          console.log(`  Status: ${p.status}`);
          console.log(`  Image: ${p.external_image_url || 'none'}`);
          
          if (p.pricing) {
            try {
              let pricingData = typeof p.pricing === 'string' 
                ? JSON.parse(p.pricing) 
                : p.pricing;
              
              console.log(`  basePrice type: ${typeof pricingData.basePrice}`);
              console.log(`  basePrice value: ${pricingData.basePrice}`);
              
              // Test if toFixed would work
              if (typeof pricingData.basePrice === 'number') {
                console.log(`  ✓ toFixed() would work: ${pricingData.basePrice.toFixed(2)}`);
              } else {
                console.log(`  ✗ toFixed() would FAIL!`);
              }
            } catch (e) {
              console.log(`  Parse error: ${e.message}`);
            }
          } else {
            console.log(`  Pricing: NULL`);
          }
          console.log('');
        }
      }
    }
    
    await client.end();
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

checkProductPricing();
