import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

/**
 * Combined middleware for:
 * 1. URL normalization (trailing slashes, lowercase)
 * 2. Product 410 Gone handling
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Skip admin, api, and static files
  if (
    pathname.startsWith('/admin') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/media') ||
    pathname.includes('.')
  ) {
    return NextResponse.next()
  }

  // Handle Product 410 Gone
  const productMatch = pathname.match(/^\/product\/([^\/]+)\/([^\/]+)\/?$/)
  if (productMatch) {
    const slug = productMatch[2]

    try {
      // Call internal API to check if product exists
      const checkUrl = new URL('/api/internal/check-product', request.url)
      checkUrl.searchParams.set('slug', slug)

      const response = await fetch(checkUrl.toString(), {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const data = await response.json()

      // If product doesn't exist, return 410 Gone
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
            },
          }
        )
      }
    } catch (error) {
      console.error('Middleware product check error:', error)
    }
  }

  // Enforce lowercase URLs (do this before trailing slash redirect)
  if (pathname !== pathname.toLowerCase()) {
    const url = request.nextUrl.clone()
    url.pathname = pathname.toLowerCase()
    return NextResponse.redirect(url, 308)
  }

  // Skip trailing slash redirect for category and product pages
  // These pages work better without trailing slashes
  if (!pathname.startsWith('/category') && !pathname.startsWith('/product')) {
    if (!pathname.endsWith('/')) {
      const url = request.nextUrl.clone()
      url.pathname = `${pathname}/`
      return NextResponse.redirect(url, 308)
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    // Match all paths except static files and API routes
    '/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)',
  ],
}
