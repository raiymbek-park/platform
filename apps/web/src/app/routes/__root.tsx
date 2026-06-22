import type { QueryClient } from '@tanstack/react-query'
import type { trpc } from '@/shared/api'

import { createRootRouteWithContext, Outlet } from '@tanstack/react-router'

type RouterContext = {
  queryClient: QueryClient
  trpc: typeof trpc
}

export const Route = createRootRouteWithContext<RouterContext>()({
  component: Outlet,
})
