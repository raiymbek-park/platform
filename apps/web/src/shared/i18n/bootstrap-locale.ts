import { activateLocale } from './activate-locale'
import { readStoredLocale } from './locale-storage'
import { resolveLocale } from './resolve-locale'

export const bootstrapLocale = async () => {
  const locale = readStoredLocale() ?? resolveLocale(navigator.language)
  await activateLocale(locale)
  return locale
}
