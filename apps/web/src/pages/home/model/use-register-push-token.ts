import { useMutation } from '@tanstack/react-query'
import { useEffect } from 'react'

import { useTRPC } from '@/shared/api'
import { requestPushToken } from '@/shared/push'

// An ESM import binding is read-only for the importer, so a plain `let` could
// never be rearmed from outside this module — hence a mutable object.
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
      if (!token) return
      mutate(
        { token },
        {
          onError: () => {
            pushRegistration.isRequested = false
          },
        },
      )
    })
  }, [ready, mutate])
}
