import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

/**
 * Active product middleware.
 * Returns 410 Gone for deleted products so crawlers can drop dead URLs faster.
 */
export async function middleware(request: NextRequest) {
  const productMatch = request.nextUrl.pathname.match(/^\/product\/([^/]+)\/([^/]+)\/?$/)
  if (!productMatch) {
    return NextResponse.next()
  }

  const slug = productMatch[2]
  const publicBaseUrl =
    process.env.NEXT_PUBLIC_SERVER_URL || request.headers.get('origin') || request.nextUrl.origin

  try {
    const checkUrl = new URL('/api/internal/check-product', publicBaseUrl)
    checkUrl.searchParams.set('slug', slug)

    const response = await fetch(checkUrl.toString(), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      return NextResponse.next()
    }

    const data = (await response.json()) as { exists?: boolean }

    if (!data.exists) {
      return new NextResponse(
        `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="robots" content="noindex, nofollow">
  <title>Product No Longer Available | Machrio</title>
</head>
<body>
  <main style="font-family:system-ui,-apple-system,sans-serif;max-width:720px;margin:0 auto;padding:80px 24px;text-align:center">
    <h1 style="font-size:32px;margin:0 0 16px">This Product Is No Longer Available</h1>
    <p style="font-size:18px;line-height:1.6;color:#4b5563;margin:0 0 32px">
      The product you requested has been permanently removed from our catalog.
    </p>
    <p style="margin:0">
      <a href="/category" style="display:inline-block;padding:12px 20px;border-radius:8px;background:#2563eb;color:#fff;text-decoration:none;font-weight:600">
        Browse All Products
      </a>
    </p>
  </main>
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
  } catch (error) {
    console.error('[middleware] product existence check failed:', error)
  }

  return NextResponse.next()
}

export const config = {
  matcher: '/product/:category/:slug',
}
