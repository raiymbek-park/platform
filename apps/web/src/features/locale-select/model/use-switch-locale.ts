import type { Locale } from '@/shared/i18n'

import { useQueryClient } from '@tanstack/react-query'

import { activateLocale, persistLocale } from '@/shared/i18n'

export const useSwitchLocale = () => {
  const queryClient = useQueryClient()
  return async (locale: Locale) => {
    await activateLocale(locale)
    persistLocale(locale)
    await queryClient.invalidateQueries()
  }
}
