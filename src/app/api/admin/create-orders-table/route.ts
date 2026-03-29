import { NextResponse } from 'next/server'
import { getPool } from '@/lib/db'

/**
 * Admin API to create orders table
 * Call this once to set up the orders table
 * DELETE THIS ENDPOINT AFTER USE for security
 */
export async function POST() {
  const pool = getPool()
  
  try {
    // Create orders table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS orders (
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
    
    // Create indexes
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_orders_order_number ON orders(order_number)
    `)
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_orders_customer_email ON orders(customer_email)
    `)
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status)
    `)
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at)
    `)
    
    return NextResponse.json({
      success: true,
      message: 'Orders table created successfully',
    })
  } catch (error) {
    console.error('Error creating orders table:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 })
  }
}
