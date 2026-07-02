import type { AppRouter } from '@raiymbek-park/api'

import { i18n } from '@lingui/core'
import { createTRPCClient, httpBatchLink } from '@trpc/client'
import {
  createTRPCContext,
  createTRPCOptionsProxy,
} from '@trpc/tanstack-react-query'

import { queryClient } from '@/shared/api/query-client'
import { env } from '@/shared/config'
import { auth } from '@/shared/firebase'

export const { TRPCProvider, useTRPC } = createTRPCContext<AppRouter>()

const requestHeaders = async () => {
  const token = await auth.currentUser?.getIdToken()
  return {
    ...(token ? { authorization: `Bearer ${token}` } : {}),
    'x-locale': i18n.locale,
  }
}

export const trpcClient = createTRPCClient<AppRouter>({
  links: [
    httpBatchLink({
      headers: requestHeaders,
      url: env.apiUrl,
    }),
  ],
})

export const trpc = createTRPCOptionsProxy<AppRouter>({
  client: trpcClient,
  queryClient,
})
