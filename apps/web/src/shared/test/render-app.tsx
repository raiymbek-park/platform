import { QueryClientProvider } from '@tanstack/react-query'
import {
  createMemoryHistory,
  createRouter,
  RouterProvider,
} from '@tanstack/react-router'
import { render } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { routeTree } from '@/app/routeTree.gen'
import { queryClient, TRPCProvider, trpc, trpcClient } from '@/shared/api'

export const renderApp = (initialPath: string) => {
  const user = userEvent.setup()
  const history = createMemoryHistory({ initialEntries: [initialPath] })
  const router = createRouter({
    routeTree,
    context: { queryClient, trpc },
    history,
  })

  render(
    <QueryClientProvider client={queryClient}>
      <TRPCProvider queryClient={queryClient} trpcClient={trpcClient}>
        <RouterProvider router={router} />
      </TRPCProvider>
    </QueryClientProvider>,
  )

  return {
    user,
    currentPath: () => router.state.location.pathname,
  }
}
