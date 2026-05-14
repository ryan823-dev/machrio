import { headers } from 'next/headers'
import { DEFAULT_LOCALE, isLocale, type Locale } from './config'

export async function getRequestLocale(): Promise<Locale> {
  const headerStore = await headers()
  const headerLocale = headerStore.get('x-machrio-locale')
  return isLocale(headerLocale) ? headerLocale : DEFAULT_LOCALE
}
