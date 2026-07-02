import { activateLocale } from './activate-locale'
import { persistLocale, readStoredLocale } from './locale-storage'
import { resolveLocale } from './resolve-locale'

export const bootstrapLocale = async () => {
  const locale = readStoredLocale() ?? resolveLocale(navigator.language)
  persistLocale(locale)
  await activateLocale(locale)
  return locale
}
