import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

/**
 * 运行时获取 Stripe Publishable Key
 * 解决 Next.js 构建时环境变量内联问题
 */
export async function GET() {
  const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY

  const isValid = publishableKey && publishableKey.startsWith('pk_')

  if (!isValid) {
    return NextResponse.json({
      error: 'Stripe publishable key not configured',
      configured: false,
    }, { status: 503 })
  }

  return NextResponse.json({
    publishableKey,
    keyType: publishableKey.startsWith('pk_live_') ? 'live' : 'test',
    configured: true,
  })
}