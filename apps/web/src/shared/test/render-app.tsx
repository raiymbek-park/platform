import { i18n } from '@lingui/core'
import { I18nProvider } from '@lingui/react'
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
    notFoundMode: 'root',
  })

  render(
    <I18nProvider i18n={i18n}>
      <QueryClientProvider client={queryClient}>
        <TRPCProvider queryClient={queryClient} trpcClient={trpcClient}>
          <RouterProvider router={router} />
        </TRPCProvider>
      </QueryClientProvider>
    </I18nProvider>,
  )

  return {
    user,
    currentPath: () => router.state.location.pathname,
  }
}
