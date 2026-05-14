export const DEFAULT_LOCALE = 'en' as const

export const LOCALES = ['en', 'vi', 'th', 'id'] as const

export type Locale = (typeof LOCALES)[number]

export const LOCALE_LABELS: Record<Locale, string> = {
  en: 'English',
  vi: 'Tieng Viet',
  th: 'Thai',
  id: 'Bahasa Indonesia',
}

export const LOCALE_HTML_LANG: Record<Locale, string> = {
  en: 'en',
  vi: 'vi',
  th: 'th',
  id: 'id',
}

export function isLocale(value: string | undefined | null): value is Locale {
  return LOCALES.includes(value as Locale)
}
