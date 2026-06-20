import type { QueryClient } from '@tanstack/react-query'
import { createRootRouteWithContext, Outlet } from '@tanstack/react-router'

import type { trpc } from '@/shared/api'

type RouterContext = {
  queryClient: QueryClient
  trpc: typeof trpc
}

export const Route = createRootRouteWithContext<RouterContext>()({
  component: Outlet,
})
