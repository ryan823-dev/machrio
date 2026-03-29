/**
 * 检查 orders 表结构和连接
 */

import { Pool } from 'pg'

async function checkOrdersTable() {
  console.log('🔍 Checking Orders Table and Database Connection...\n')
  
  const pool = new Pool({
    connectionString: process.env.DATABASE_URI!,
    max: 5,
    min: 1,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
  })
  
  try {
    // 1. Test connection
    console.log('1️⃣ Testing database connection...')
    const connResult = await pool.query('SELECT NOW()')
    console.log('✅ Database connected:', connResult.rows[0].now)
    
    // 2. Check if orders table exists
    console.log('\n2️⃣ Checking if orders table exists...')
    const existsResult = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'orders'
      )
    `)
    
    if (!existsResult.rows[0].exists) {
      console.error('❌ Orders table does NOT exist!')
      console.error('\n💡 Creating orders table...')
      
      // Create the table
      await pool.query(`
        CREATE TABLE orders (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          order_number TEXT UNIQUE NOT NULL,
          customer_email TEXT NOT NULL,
          customer_name TEXT NOT NULL,
          customer_phone TEXT,
          customer_company TEXT,
          status TEXT NOT NULL DEFAULT 'pending',
          payment_status TEXT NOT NULL DEFAULT 'unpaid',
          payment_method TEXT,
          subtotal NUMERIC NOT NULL DEFAULT 0,
          shipping_cost NUMERIC NOT NULL DEFAULT 0,
          tax NUMERIC NOT NULL DEFAULT 0,
          total NUMERIC NOT NULL DEFAULT 0,
          shipping_address JSONB,
          billing_address JSONB,
          items JSONB,
          notes TEXT,
          payment_info JSONB,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        )
      `)
      console.log('✅ Orders table created successfully!')
    } else {
      console.log('✅ Orders table exists')
      
      // Check columns
      console.log('\n3️⃣ Checking orders table schema...')
      const columnsResult = await pool.query(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'orders'
        ORDER BY ordinal_position
      `)
      
      console.log('\n📋 Current schema:')
      columnsResult.rows.forEach(row => {
        const nullable = row.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'
        console.log(`   ${row.column_name.padEnd(25)} ${row.data_type.padEnd(20)} (${nullable})`)
      })
    }
    
    // 4. Test order creation
    console.log('\n4️⃣ Testing order creation...')
    const testOrderNum = `TEST-${Date.now()}`
    
    const insertResult = await pool.query(`
      INSERT INTO orders (
        order_number, customer_email, customer_name, customer_phone, customer_company,
        status, payment_status, payment_method, subtotal, shipping_cost, tax, total,
        shipping_address, billing_address, items, notes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
      RETURNING *
    `, [
      testOrderNum,
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
      JSON.stringify([{
        productId: 'test-product',
        productName: 'Test Product',
        sku: 'TEST-001',
        quantity: 1,
        unitPrice: 100,
        lineTotal: 100,
      }]),
      'Test order - safe to delete'
    ])
    
    console.log('✅ Order created successfully!')
    console.log(`   Order ID: ${insertResult.rows[0].id}`)
    console.log(`   Order Number: ${insertResult.rows[0].order_number}`)
    
    // Cleanup
    await pool.query('DELETE FROM orders WHERE order_number = $1', [testOrderNum])
    console.log('✅ Test order cleaned up')
    
    console.log('\n✅ All checks passed! Database and orders table are working correctly.')
    
  } catch (error) {
    console.error('\n❌ Error:', error instanceof Error ? error.message : error)
    if ('code' in error) {
      console.error(`   Code: ${(error as any).code}`)
      console.error(`   Detail: ${(error as any).detail}`)
      console.error(`   Hint: ${(error as any).hint}`)
    }
    process.exit(1)
  } finally {
    await pool.end()
  }
}

checkOrdersTable()
