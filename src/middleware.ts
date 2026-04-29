import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

/**
 * Active middleware for:
 * 1. URL normalization (lowercase)
 * 2. Glossary recovery / redirect handling
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const forwardedHost = request.headers.get('x-forwarded-host') || request.headers.get('host')
  const forwardedProto = request.headers.get('x-forwarded-proto') || 'https'
  const publicBaseUrl = forwardedHost
    ? `${forwardedProto}://${forwardedHost}`
    : process.env.NEXT_PUBLIC_SERVER_URL || request.headers.get('origin') || request.nextUrl.origin

  if (
    pathname.startsWith('/admin') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/media') ||
    pathname.includes('.')
  ) {
    return NextResponse.next()
  }

  if (pathname !== pathname.toLowerCase()) {
    const url = request.nextUrl.clone()
    url.pathname = pathname.toLowerCase()
    return NextResponse.redirect(url, 308)
  }

  const glossaryMatch = pathname.match(/^\/glossary\/([^/]+)\/?$/)
  if (glossaryMatch) {
    const slug = glossaryMatch[1]
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 1500)

    try {
      const checkUrl = new URL('/api/internal/check-glossary', publicBaseUrl)
      checkUrl.searchParams.set('slug', slug)
      checkUrl.searchParams.set('pathname', pathname)

      const response = await fetch(checkUrl.toString(), {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        cache: 'no-store',
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (response.ok) {
        const data = (await response.json()) as {
          exists?: boolean
          redirectTo?: string
          statusCode?: number
        }

        if (data.redirectTo && data.redirectTo !== pathname) {
          const url = request.nextUrl.clone()
          url.pathname = data.redirectTo
          return NextResponse.redirect(url, data.statusCode || 301)
        }
      }
    } catch (error) {
      clearTimeout(timeoutId)

      if (error instanceof Error && error.name === 'AbortError') {
        console.warn('[middleware] glossary existence check timed out, allowing request to continue')
      } else {
        console.error('[middleware] glossary existence check failed:', error)
      }
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)',
  ],
}
