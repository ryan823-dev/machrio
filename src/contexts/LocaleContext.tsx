'use client'

import { createContext, useContext } from 'react'
import type { Dictionary } from '@/i18n/dictionaries'
import { dictionaries } from '@/i18n/dictionaries'
import { DEFAULT_LOCALE, type Locale } from '@/i18n/config'

interface LocaleContextValue {
  locale: Locale
  dictionary: Dictionary
}

const LocaleContext = createContext<LocaleContextValue>({
  locale: DEFAULT_LOCALE,
  dictionary: dictionaries.en,
})

export function LocaleProvider({
  children,
  dictionary,
  locale,
}: {
  children: React.ReactNode
  dictionary: Dictionary
  locale: Locale
}) {
  return (
    <LocaleContext.Provider value={{ locale, dictionary }}>
      {children}
    </LocaleContext.Provider>
  )
}

export function useLocale() {
  return useContext(LocaleContext)
}
