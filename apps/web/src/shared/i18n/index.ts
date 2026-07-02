export type { Locale } from './config'

import { i18n } from '@lingui/core'

export { activateLocale } from './activate-locale'
export { bootstrapLocale } from './bootstrap-locale'
export { DEFAULT_LOCALE, isLocale, LOCALES } from './config'
export { persistLocale, readStoredLocale } from './locale-storage'
export { resolveLocale } from './resolve-locale'
export { i18n }
