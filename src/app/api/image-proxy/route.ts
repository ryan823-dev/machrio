import { NextRequest, NextResponse } from 'next/server'
import { shouldProxyExternalImageHost } from '@/lib/image-proxy'

const CACHE_CONTROL = 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800'
const FETCH_TIMEOUT_MS = 15000

function reject(status: number, message: string) {
  return NextResponse.json({ error: message }, { status })
}

export async function GET(request: NextRequest) {
  const urlParam = request.nextUrl.searchParams.get('url')

  if (!urlParam) {
    return reject(400, 'Missing image url')
  }

  let targetUrl: URL
  try {
    targetUrl = new URL(urlParam)
  } catch {
    return reject(400, 'Invalid image url')
  }

  if (!['http:', 'https:'].includes(targetUrl.protocol)) {
    return reject(400, 'Unsupported image protocol')
  }

  if (!shouldProxyExternalImageHost(targetUrl.hostname)) {
    return reject(403, 'Image host is not allowed')
  }

  const referer = process.env.NEXT_PUBLIC_SERVER_URL || request.nextUrl.origin
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)

  try {
    const upstream = await fetch(targetUrl.toString(), {
      headers: {
        Accept: 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
        Referer: `${referer}/`,
        'User-Agent': 'Mozilla/5.0 (compatible; MachrioImageProxy/1.0; +https://machrio.com)',
      },
      signal: controller.signal,
      next: { revalidate: 86400 },
    })

    if (!upstream.ok) {
      return reject(upstream.status, `Upstream image request failed with ${upstream.status}`)
    }

    const contentType = upstream.headers.get('content-type') || 'application/octet-stream'
    if (!contentType.toLowerCase().startsWith('image/')) {
      return reject(502, 'Upstream response was not an image')
    }

    const body = await upstream.arrayBuffer()
    const response = new NextResponse(body, { status: 200 })

    response.headers.set('Content-Type', contentType)
    response.headers.set('Cache-Control', CACHE_CONTROL)

    const etag = upstream.headers.get('etag')
    if (etag) response.headers.set('ETag', etag)

    const lastModified = upstream.headers.get('last-modified')
    if (lastModified) response.headers.set('Last-Modified', lastModified)

    const contentLength = upstream.headers.get('content-length')
    if (contentLength) response.headers.set('Content-Length', contentLength)

    return response
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown proxy error'
    return reject(502, message)
  } finally {
    clearTimeout(timeout)
  }
}
