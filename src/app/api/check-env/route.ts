import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  const hasDatabaseUri = !!process.env.DATABASE_URI
  const databaseUriSet = process.env.DATABASE_URI ? 'yes' : 'no'
  const databaseUriLength = process.env.DATABASE_URI?.length || 0
  
  return NextResponse.json({
    success: true,
    env: {
      hasDatabaseUri,
      databaseUriSet,
      databaseUriLength,
      nodeEnv: process.env.NODE_ENV,
      hasUsePostgres: !!process.env.USE_POSTGRES,
    }
  })
}
