const LOCALES = ['ru', 'kk', 'en'] as const

export type Locale = (typeof LOCALES)[number]

export const DEFAULT_LOCALE: Locale = 'ru'

export const isLocale = (value: string): value is Locale =>
  LOCALES.some(locale => locale === value)

export const localeNames: Record<Locale, { name: string; caption: string }> = {
  ru: { name: 'Русский', caption: 'Язык интерфейса приложения' },
  kk: { name: 'Қазақша', caption: 'Қолданба интерфейсінің тілі' },
  en: { name: 'English', caption: 'App Language' },
}
