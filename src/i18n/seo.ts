import type { Metadata } from 'next'
import { DEFAULT_LOCALE, LOCALES, type Locale } from './config'
import { withLocalePath } from './routing'

export function getLocalizedAlternates(pathname: string, locale: Locale): Metadata['alternates'] {
  const languages = Object.fromEntries(
    LOCALES.map((item) => [item, withLocalePath(pathname, item)]),
  ) as Record<string, string>

  return {
    canonical: withLocalePath(pathname, locale),
    languages: {
      ...languages,
      'x-default': withLocalePath(pathname, DEFAULT_LOCALE),
    },
  }
}
