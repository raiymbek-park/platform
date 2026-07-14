import type { Locale } from '@/shared/i18n'

import { useMutation, useQueryClient } from '@tanstack/react-query'

import { useTRPC } from '@/shared/api'
import { activateLocale, persistLocale } from '@/shared/i18n'
import { getGrantedPushToken } from '@/shared/push'

export const useSwitchLocale = () => {
  const queryClient = useQueryClient()
  const trpc = useTRPC()
  const { mutate } = useMutation(
    trpc.notifications.registerToken.mutationOptions(),
  )
  return async (locale: Locale) => {
    await activateLocale(locale)
    persistLocale(locale)
    queryClient.invalidateQueries()
    getGrantedPushToken().then(token => {
      if (token) mutate({ token })
    })
  }
}
