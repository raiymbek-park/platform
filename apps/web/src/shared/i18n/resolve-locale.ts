import type { Locale } from './config'

import { DEFAULT_LOCALE, isLocale } from './config'

export const resolveLocale = (raw: string | null | undefined): Locale => {
  const base = (raw ?? '').toLowerCase().split('-')[0] ?? ''
  return isLocale(base) ? base : DEFAULT_LOCALE
}
