import { NextResponse } from 'next/server'
import { getPool } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET() {
  const startTime = Date.now()
  
  try {
    // Test database connection - this pre-warms the serverless instance
    const pool = getPool()
    await pool.query('SELECT 1')
    const initTime = Date.now() - startTime
    
    return NextResponse.json({
      success: true,
      message: 'Database connection warmed up',
      initTimeMs: initTime,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    const errorTime = Date.now() - startTime
    console.error('Warmup error after', errorTime, 'ms:', error)
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timeMs: errorTime,
    }, { status: 500 })
  }
}