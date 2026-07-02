export const LOCALES = ['ru', 'kk', 'en'] as const

export type Locale = (typeof LOCALES)[number]

export const DEFAULT_LOCALE: Locale = 'ru'

const isLocale = (value: string): value is Locale =>
  LOCALES.some(locale => locale === value)

export const resolveLocale = (value: string | string[] | undefined): Locale => {
  const raw = Array.isArray(value) ? value[0] : value
  return raw && isLocale(raw) ? raw : DEFAULT_LOCALE
}

const messages = {
  phoneNotVerified: {
    ru: 'Телефон не подтверждён',
    kk: 'Телефон расталмаған',
    en: 'Phone is not verified',
  },
  reactionForbidden: {
    ru: 'Недостаточно прав для реакции',
    kk: 'Реакция қою құқығы жеткіліксіз',
    en: 'Not allowed to react',
  },
} satisfies Record<string, Record<Locale, string>>

const isMessageKey = (key: string): key is keyof typeof messages =>
  Object.hasOwn(messages, key)

export const translate = (locale: Locale, message: string): string =>
  isMessageKey(message) ? messages[message][locale] : message
