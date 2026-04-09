/**
 * Test script to verify category API returns products
 */

async function testAPI() {
  const categoryId = '92a83859-5f9e-45fa-8007-43071d4f258c' // Fasteners
  const limit = 8
  
  try {
    console.log(`Testing API: /api/category/${categoryId}/random-products?limit=${limit}`)
    
    const response = await fetch(`http://localhost:3000/api/category/${categoryId}/random-products?limit=${limit}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })
    
    console.log(`Response status: ${response.status} ${response.statusText}`)
    
    if (!response.ok) {
      console.error('❌ Request failed')
      return
    }
    
    const data = await response.json()
    console.log(`✅ Success! Got ${data.products?.length || 0} products`)
    
    if (data.products && data.products.length > 0) {
      console.log('\nFirst product:')
      console.log(JSON.stringify(data.products[0], null, 2))
    }
  } catch (error) {
    console.error('❌ Error:', error instanceof Error ? error.message : error)
  }
}

testAPI()
