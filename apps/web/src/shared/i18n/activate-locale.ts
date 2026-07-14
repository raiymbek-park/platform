import type { Locale } from './config'

import { i18n } from '@lingui/core'

const latestRequest = { locale: '' }

const loadMessages = (locale: Locale) =>
  import(`./locales/${locale}/messages.po`)
    .then(({ messages }) => messages)
    .catch(() => ({}))

export const activateLocale = async (locale: Locale) => {
  document.documentElement.lang = locale
  latestRequest.locale = locale
  const messages = await loadMessages(locale)
  if (latestRequest.locale !== locale) return
  i18n.loadAndActivate({ locale, messages })
}
