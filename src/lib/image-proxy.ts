const PROXIED_IMAGE_HOSTS = new Set([
  'cdn.mroport.com',
])

export function shouldProxyExternalImageHost(hostname: string | null | undefined): boolean {
  if (!hostname) return false

  return PROXIED_IMAGE_HOSTS.has(hostname.toLowerCase())
}

export function buildImageProxyPath(absoluteUrl: string): string {
  return `/api/image-proxy?url=${encodeURIComponent(absoluteUrl)}`
}

export function buildImageProxyUrl(absoluteUrl: string, baseUrl?: string): string {
  const proxyPath = buildImageProxyPath(absoluteUrl)

  if (!baseUrl) {
    return proxyPath
  }

  return new URL(proxyPath, baseUrl).toString()
}
