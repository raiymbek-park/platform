import type { AppRouter } from '@raiymbek-park/api'

import { createTRPCClient, httpBatchLink } from '@trpc/client'
import {
  createTRPCContext,
  createTRPCOptionsProxy,
} from '@trpc/tanstack-react-query'

import { queryClient } from '@/shared/api/query-client'
import { env } from '@/shared/config'

export const { TRPCProvider, useTRPC } = createTRPCContext<AppRouter>()

export const trpcClient = createTRPCClient<AppRouter>({
  links: [
    httpBatchLink({
      url: env.apiUrl,
    }),
  ],
})

export const trpc = createTRPCOptionsProxy<AppRouter>({
  client: trpcClient,
  queryClient,
})
