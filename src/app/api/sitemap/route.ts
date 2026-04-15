import { NextResponse } from 'next/server'

/**
 * Legacy sitemap endpoint kept for backward compatibility.
 * Always redirect crawlers to the canonical sitemap entry point.
 */
export async function GET(request: Request) {
  const publicBaseUrl = process.env.NEXT_PUBLIC_SERVER_URL || new URL(request.url).origin
  return NextResponse.redirect(new URL('/sitemap.xml', publicBaseUrl), 308)
}
