import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

/**
 * Active middleware for:
 * 1. URL normalization (lowercase)
 * 2. Product redirect / 410 handling
 * 3. Glossary recovery / redirect handling
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

  const productMatch = pathname.match(/^\/product\/([^/]+)\/([^/]+)\/?$/)
  if (productMatch) {
    const category = productMatch[1]
    const slug = productMatch[2]

    try {
      const checkUrl = new URL('/api/internal/check-product', publicBaseUrl)
      checkUrl.searchParams.set('category', category)
      checkUrl.searchParams.set('slug', slug)
      checkUrl.searchParams.set('pathname', pathname)

      const response = await fetch(checkUrl.toString(), {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        cache: 'no-store',
      })

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

        if (!data.exists) {
          return new NextResponse(
            `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="robots" content="noindex, nofollow">
  <title>Product No Longer Available | Machrio</title>
  <link rel="stylesheet" href="/_next/static/css/app/layout.css">
  <style>
    body { font-family: system-ui, -apple-system, sans-serif; background: #f9fafb; margin: 0; }
    .container { max-width: 1280px; margin: 0 auto; padding: 0 1rem; }
    .content { text-align: center; padding: 5rem 1rem; }
    .emoji { font-size: 4rem; margin-bottom: 1.5rem; }
    h1 { font-size: 1.875rem; font-weight: 700; color: #111827; margin: 0 0 1rem; }
    p { font-size: 1.125rem; color: #4b5563; margin: 0 0 2rem; }
    .btn-group { display: flex; flex-direction: column; gap: 1rem; align-items: center; }
    @media (min-width: 640px) { .btn-group { flex-direction: row; justify-content: center; } }
    .btn { display: inline-block; padding: 0.75rem 1.5rem; border-radius: 0.5rem; font-weight: 500; text-decoration: none; }
    .btn-primary { background: #2563eb; color: white; }
    .btn-primary:hover { background: #1d4ed8; }
    .btn-secondary { background: #e5e7eb; color: #374151; }
    .btn-secondary:hover { background: #d1d5db; }
    .btn-accent { background: #f59e0b; color: white; }
    .btn-accent:hover { background: #d97706; }
    .help-text { margin-top: 2rem; font-size: 0.875rem; color: #9ca3af; }
    .help-text a { color: #2563eb; }
  </style>
</head>
<body>
  <div class="container">
    <div class="content">
      <div class="emoji">📦</div>
      <h1>This Product Is No Longer Available</h1>
      <p>The product you're looking for has been permanently removed from our catalog. It may have been discontinued or replaced.</p>
      <div class="btn-group">
        <a href="/category" class="btn btn-primary">Browse All Products</a>
        <a href="/rfq" class="btn btn-accent">Request a Custom Quote</a>
        <a href="/" class="btn btn-secondary">Go to Homepage</a>
      </div>
      <p class="help-text">Questions? Contact <a href="mailto:support@machrio.com">support@machrio.com</a></p>
    </div>
  </div>
</body>
</html>`,
            {
              status: 410,
              headers: {
                'Content-Type': 'text/html; charset=utf-8',
                'Cache-Control': 'public, max-age=0, s-maxage=86400',
              },
            },
          )
        }
      }
    } catch (error) {
      console.error('[middleware] product existence check failed:', error)
    }
  }

  const glossaryMatch = pathname.match(/^\/glossary\/([^/]+)\/?$/)
  if (glossaryMatch) {
    const slug = glossaryMatch[1]

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
      })

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
      console.error('[middleware] glossary existence check failed:', error)
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)',
  ],
}
