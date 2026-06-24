import type { AppRouter } from '@raiymbek-park/api'

import { createTRPCClient, httpBatchLink } from '@trpc/client'
import {
  createTRPCContext,
  createTRPCOptionsProxy,
} from '@trpc/tanstack-react-query'

import { queryClient } from '@/shared/api/query-client'
import { env } from '@/shared/config'
import { auth } from '@/shared/firebase'

export const { TRPCProvider, useTRPC } = createTRPCContext<AppRouter>()

const authHeaders = async () => {
  const token = await auth.currentUser?.getIdToken()
  return token ? { authorization: `Bearer ${token}` } : {}
}

export const trpcClient = createTRPCClient<AppRouter>({
  links: [
    httpBatchLink({
      headers: authHeaders,
      url: env.apiUrl,
    }),
  ],
})

export const trpc = createTRPCOptionsProxy<AppRouter>({
  client: trpcClient,
  queryClient,
})
