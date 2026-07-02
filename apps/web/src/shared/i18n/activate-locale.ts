import type { Locale } from './config'

import { i18n } from '@lingui/core'

export const activateLocale = async (locale: Locale) => {
  const { messages } = await import(`./locales/${locale}/messages.po`)
  i18n.loadAndActivate({ locale, messages })
}
