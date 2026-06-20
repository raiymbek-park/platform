import '@/app/fonts/fonts.scss'
import '@/app/tokens.scss'
import '@/app/app.scss'

import { QueryClientProvider } from '@tanstack/react-query'
import { createRouter, RouterProvider } from '@tanstack/react-router'

import { routeTree } from '@/app/routeTree.gen'
import { queryClient, TRPCProvider, trpc, trpcClient } from '@/shared/api'

const router = createRouter({
  routeTree,
  context: { queryClient, trpc },
  defaultPreload: 'intent',
})

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

export const App = () => (
  <QueryClientProvider client={queryClient}>
    <TRPCProvider queryClient={queryClient} trpcClient={trpcClient}>
      <RouterProvider router={router} />
    </TRPCProvider>
  </QueryClientProvider>
)
