import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

/**
 * Middleware to handle gone products
 * Returns 410 Gone for products that no longer exist in the database
 *
 * Note: This middleware calls an internal API to check product existence
 * because Edge Runtime doesn't support the pg library directly.
 *
 * TEMPORARILY DISABLED: The fetch call to internal API is causing issues
 * in the Railway environment. Product pages will return 404 instead of 410
 * for non-existent products, which is acceptable.
 */
export async function middleware(request: NextRequest) {
  // Middleware temporarily disabled to fix Railway deployment issues
  // Product pages will handle 404 themselves
  return NextResponse.next()
}

export const config = {
  matcher: '/product/:category/:slug',
}