import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'

export const dynamic = 'force-dynamic'

// Long timeout for Payload initialization (Vercel Pro supports up to 300s)
export const maxDuration = 300

export async function GET() {
  const startTime = Date.now()
  
  try {
    // Initialize Payload CMS - this pre-warms the serverless instance
    const payload = await getPayload({ config })
    const initTime = Date.now() - startTime
    
    return NextResponse.json({
      success: true,
      message: 'Payload CMS warmed up',
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
