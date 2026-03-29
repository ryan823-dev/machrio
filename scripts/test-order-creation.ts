/**
 * 测试订单创建功能
 * 用于诊断下单失败问题
 */

import { Pool } from 'pg'

async function testOrderCreation() {
  console.log('🔍 Testing Order Creation...\n')
  
  // 1. Test database connection
  console.log('1️⃣ Testing database connection...')
  const pool = new Pool({
    connectionString: process.env.DATABASE_URI,
    max: 5,
    min: 1,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
  })
  
  try {
    const connectionResult = await pool.query('SELECT NOW()')
    console.log('✅ Database connection successful:', connectionResult.rows[0].now)
  } catch (error) {
    console.error('❌ Database connection failed:', error instanceof Error ? error.message : error)
    console.error('\n💡 Make sure DATABASE_URI is set in .env')
    process.exit(1)
  }
  
  // 2. Check if orders table exists
  console.log('\n2️⃣ Checking if orders table exists...')
  try {
    const tableCheck = await pool.query(
      `SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'orders'
      )`
    )
    
    const exists = tableCheck.rows[0].exists
    if (exists) {
      console.log('✅ Orders table exists')
    } else {
      console.error('❌ Orders table does not exist')
      console.error('\n💡 You need to create the orders table first')
      console.error('See: GOOGLE-MERCHANT-GUIDE.md for table creation SQL')
      process.exit(1)
    }
  } catch (error) {
    console.error('❌ Error checking orders table:', error instanceof Error ? error.message : error)
    process.exit(1)
  }
  
  // 3. Check orders table schema
  console.log('\n3️⃣ Checking orders table schema...')
  try {
    const schemaResult = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'orders'
      ORDER BY ordinal_position
    `)
    
    console.log('✅ Orders table columns:')
    const requiredColumns = [
      'id', 'order_number', 'customer_email', 'customer_name', 
      'status', 'payment_status', 'subtotal', 'shipping_cost', 
      'tax', 'total', 'shipping_address', 'billing_address', 'items'
    ]
    
    const foundColumns = schemaResult.rows.map(r => r.column_name)
    const missingColumns = requiredColumns.filter(c => !foundColumns.includes(c))
    
    if (missingColumns.length > 0) {
      console.error(`❌ Missing required columns: ${missingColumns.join(', ')}`)
      process.exit(1)
    } else {
      console.log('✅ All required columns exist')
    }
    
    // Show all columns
    console.log('\n📋 Full schema:')
    schemaResult.rows.forEach(row => {
      const nullable = row.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'
      console.log(`   - ${row.column_name}: ${row.data_type} (${nullable})`)
    })
  } catch (error) {
    console.error('❌ Error checking schema:', error instanceof Error ? error.message : error)
    process.exit(1)
  }
  
  // 4. Test order creation
  console.log('\n4️⃣ Testing order creation...')
  const testOrderNumber = `TEST-${Date.now()}`
  
  try {
    const insertResult = await pool.query(
      `INSERT INTO orders (
        order_number, customer_email, customer_name, customer_phone, customer_company,
        status, payment_status, payment_method, subtotal, shipping_cost, tax, total,
        shipping_address, billing_address, items, notes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
      RETURNING *`,
      [
        testOrderNumber,
        'test@example.com',
        'Test User',
        '+1234567890',
        'Test Company',
        'pending',
        'unpaid',
        'stripe',
        100.00,
        10.00,
        0,
        110.00,
        JSON.stringify({ address: '123 Test St', city: 'Test City', state: 'TS', postalCode: '12345', country: 'US' }),
        JSON.stringify({}),
        JSON.stringify([
          {
            productId: 'test-product',
            productName: 'Test Product',
            sku: 'TEST-001',
            quantity: 1,
            unitPrice: 100,
            lineTotal: 100,
          }
        ]),
        'Test order - can be deleted'
      ]
    )
    
    console.log('✅ Order creation successful!')
    console.log(`   Order ID: ${insertResult.rows[0].id}`)
    console.log(`   Order Number: ${insertResult.rows[0].order_number}`)
    
    // Clean up test order
    await pool.query('DELETE FROM orders WHERE order_number = $1', [testOrderNumber])
    console.log('✅ Test order cleaned up')
    
  } catch (error) {
    console.error('❌ Order creation failed:', error instanceof Error ? error.message : error)
    if (error instanceof Error && 'code' in error) {
      console.error(`   Error code: ${(error as any).code}`)
      console.error(`   Detail: ${(error as any).detail}`)
    }
    process.exit(1)
  }
  
  await pool.end()
  
  console.log('\n✅ All tests passed! Order creation is working correctly.')
  console.log('\n📌 If checkout is still failing, check:')
  console.log('   1. Railway deployment logs for errors')
  console.log('   2. DATABASE_URI environment variable is set correctly')
  console.log('   3. Network connectivity between Vercel and Railway')
}

testOrderCreation()
