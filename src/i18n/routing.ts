import { DEFAULT_LOCALE, isLocale, type Locale } from './config'

export function getLocaleFromPathname(pathname: string): Locale {
  const firstSegment = pathname.split('/').filter(Boolean)[0]
  return isLocale(firstSegment) ? firstSegment : DEFAULT_LOCALE
}

export function stripLocaleFromPathname(pathname: string): string {
  const segments = pathname.split('/').filter(Boolean)
  if (isLocale(segments[0])) {
    const stripped = `/${segments.slice(1).join('/')}`
    return stripped === '/' ? '/' : stripped.replace(/\/$/, '') || '/'
  }
  return pathname || '/'
}

export function withLocalePath(pathname: string, locale: Locale): string {
  const cleanPathname = stripLocaleFromPathname(pathname || '/')
  if (locale === DEFAULT_LOCALE) return cleanPathname
  return cleanPathname === '/' ? `/${locale}` : `/${locale}${cleanPathname}`
}

export function switchLocalePath(pathname: string, locale: Locale): string {
  return withLocalePath(stripLocaleFromPathname(pathname), locale)
}
