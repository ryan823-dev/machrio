import { buildImageProxyUrl, shouldProxyExternalImageHost } from '@/lib/image-proxy'

const WINDOWS_DRIVE_PATH_RE = /^[a-zA-Z]:[\\/]/
const WINDOWS_UNC_PATH_RE = /^\\\\/
const URI_SCHEME_RE = /^[a-zA-Z][a-zA-Z\d+\-.]*:/

export function isUnsafeLocalAssetUrl(value: string | null | undefined): boolean {
  if (!value) return false

  const trimmed = value.trim()
  if (!trimmed) return false

  return WINDOWS_DRIVE_PATH_RE.test(trimmed) || WINDOWS_UNC_PATH_RE.test(trimmed)
}

export function normalizePublicAssetUrl(
  value: string | null | undefined,
  options: { baseUrl?: string; requireHttps?: boolean } = {},
): string | null {
  if (!value) return null

  const trimmed = value.trim()
  if (!trimmed || isUnsafeLocalAssetUrl(trimmed)) return null
  if (/^(data|blob|file|javascript):/i.test(trimmed)) return null

  const requireHttps = options.requireHttps ?? false

  const normalizeAbsoluteUrl = (absoluteUrl: string): string | null => {
    try {
      const parsed = new URL(absoluteUrl)

      if (requireHttps && parsed.protocol === 'http:') {
        parsed.protocol = 'https:'
      }

      if (requireHttps) {
        if (parsed.protocol !== 'https:') {
          return null
        }
      } else if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
        return null
      }

      const normalizedUrl = parsed.toString()

      if (shouldProxyExternalImageHost(parsed.hostname)) {
        return buildImageProxyUrl(normalizedUrl, options.baseUrl)
      }

      return normalizedUrl
    } catch {
      return null
    }
  }

  if (trimmed.startsWith('//')) {
    return normalizeAbsoluteUrl(`https:${trimmed}`)
  }

  if (/^https?:\/\//i.test(trimmed)) {
    return normalizeAbsoluteUrl(trimmed)
  }

  if (URI_SCHEME_RE.test(trimmed)) {
    return null
  }

  if (!options.baseUrl) {
    return trimmed.startsWith('/') ? trimmed : `/${trimmed}`
  }

  try {
    const normalizedPath = trimmed.startsWith('/') ? trimmed : `/${trimmed}`
    return normalizeAbsoluteUrl(new URL(normalizedPath, options.baseUrl).toString())
  } catch {
    return null
  }
}

export function normalizePublicAssetUrls(
  values: Array<string | null | undefined>,
  options: { baseUrl?: string; requireHttps?: boolean } = {},
): string[] {
  const seen = new Set<string>()
  const urls: string[] = []

  for (const value of values) {
    const normalized = normalizePublicAssetUrl(value, options)
    if (!normalized || seen.has(normalized)) continue

    seen.add(normalized)
    urls.push(normalized)
  }

  return urls
}
