import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { DEFAULT_LOCALE, isLocale } from '@/i18n/config'
import { stripLocaleFromPathname } from '@/i18n/routing'

/**
 * Active middleware for:
 * 1. URL normalization (lowercase)
 * 2. Glossary recovery / redirect handling
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const locale = pathname.split('/').filter(Boolean)[0]
  const activeLocale = isLocale(locale) ? locale : DEFAULT_LOCALE
  const normalizedPathname = stripLocaleFromPathname(pathname)
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

  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-machrio-locale', activeLocale)
  requestHeaders.set('x-machrio-pathname', pathname)

  const glossaryMatch = normalizedPathname.match(/^\/glossary\/([^/]+)\/?$/)
  if (glossaryMatch) {
    const slug = glossaryMatch[1]
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 1500)

    try {
      const checkUrl = new URL('/api/internal/check-glossary', publicBaseUrl)
      checkUrl.searchParams.set('slug', slug)
      checkUrl.searchParams.set('pathname', normalizedPathname)

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

        if (data.redirectTo && data.redirectTo !== normalizedPathname) {
          const url = request.nextUrl.clone()
          url.pathname = data.redirectTo
          if (activeLocale !== DEFAULT_LOCALE) {
            url.pathname = `/${activeLocale}${url.pathname}`
          }
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

  if (activeLocale !== DEFAULT_LOCALE) {
    const url = request.nextUrl.clone()
    url.pathname = normalizedPathname
    return NextResponse.rewrite(url, {
      request: {
        headers: requestHeaders,
      },
    })
  }

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  })
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)',
  ],
}
