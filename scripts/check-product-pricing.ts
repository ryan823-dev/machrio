import { getPool } from '../src/lib/db'

async function checkProductPricing() {
  const pool = getPool()
  
  try {
    // Get categories
    const catResult = await pool.query(
      "SELECT id, slug FROM categories WHERE slug IN ('instant-adhesives', 'construction-adhesives', 'wood-glues')"
    )
    
    for (const cat of catResult.rows) {
      console.log(`\n=== Category: ${cat.slug} (${cat.id}) ===`)
      
      // Get products in this category
      const productResult = await pool.query(
        `SELECT id, name, sku, pricing, status 
         FROM products 
         WHERE primary_category_id = $1 
         LIMIT 5`,
        [cat.id]
      )
      
      if (productResult.rows.length === 0) {
        console.log('  No products found')
      } else {
        for (const p of productResult.rows) {
          console.log(`\n  Product: ${p.name}`)
          console.log(`  SKU: ${p.sku}`)
          console.log(`  Status: ${p.status}`)
          console.log(`  Pricing type: ${typeof p.pricing}`)
          console.log(`  Pricing value:`, p.pricing)
          
          if (p.pricing) {
            try {
              let pricingData = typeof p.pricing === 'string' 
                ? JSON.parse(p.pricing) 
                : p.pricing
              
              console.log(`  Parsed pricing:`, pricingData)
              console.log(`  basePrice type: ${typeof pricingData.basePrice}`)
              console.log(`  basePrice value:`, pricingData.basePrice)
            } catch (e) {
              console.log(`  Parse error:`, e.message)
            }
          }
        }
      }
    }
    
    process.exit(0)
  } catch (error) {
    console.error('Error:', error)
    process.exit(1)
  }
}

checkProductPricing()
