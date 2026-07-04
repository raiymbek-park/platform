const LOCALES = ['ru', 'kk', 'en'] as const

export type Locale = (typeof LOCALES)[number]

export const DEFAULT_LOCALE: Locale = 'ru'

export const isLocale = (value: string): value is Locale =>
  LOCALES.some(locale => locale === value)
