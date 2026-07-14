import { useMutation } from '@tanstack/react-query'
import { useEffect } from 'react'

import { useTRPC } from '@/shared/api'
import { requestPushToken } from '@/shared/push'

// Module-scoped for the same reason as use-mark-visit: one attempt per page
// load, surviving SPA navigation and resetting on a full reload — which is
// exactly when a rotated FCM token should be re-registered. Exported so
// tests can rearm the once-per-load latch between renders.
export const pushRegistration = { isRequested: false }

export const useRegisterPushToken = (ready: boolean) => {
  const trpc = useTRPC()
  const { mutate } = useMutation(
    trpc.notifications.registerToken.mutationOptions(),
  )

  useEffect(() => {
    if (!ready || pushRegistration.isRequested) return
    pushRegistration.isRequested = true
    requestPushToken().then(token => {
      if (token) mutate({ token })
    })
  }, [ready, mutate])
}
