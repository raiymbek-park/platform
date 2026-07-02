import type { Locale } from './config'

import { isLocale } from './config'

const STORAGE_KEY = 'locale'

export const readStoredLocale = (): Locale | null => {
  const stored = localStorage.getItem(STORAGE_KEY)
  return stored && isLocale(stored) ? stored : null
}

export const persistLocale = (locale: Locale): void => {
  localStorage.setItem(STORAGE_KEY, locale)
}
