import '@/app/fonts/fonts.scss'
import '@/app/tokens.scss'
import '@/app/app.scss'

import { I18nProvider } from '@lingui/react'
import { QueryClientProvider } from '@tanstack/react-query'
import {
  createHashHistory,
  createRouter,
  RouterProvider,
} from '@tanstack/react-router'

import { routeTree } from '@/app/routeTree.gen'
import { queryClient, TRPCProvider, trpc, trpcClient } from '@/shared/api'
import { i18n } from '@/shared/i18n'
import { ToastHost } from '@/shared/toast'

const router = createRouter({
  routeTree,
  context: { queryClient, trpc },
  defaultPreload: 'intent',
  history: createHashHistory(),
  notFoundMode: 'root',
})

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

export const App = () => (
  <I18nProvider i18n={i18n}>
    <QueryClientProvider client={queryClient}>
      <TRPCProvider queryClient={queryClient} trpcClient={trpcClient}>
        <RouterProvider router={router} />
      </TRPCProvider>
    </QueryClientProvider>
    <ToastHost />
  </I18nProvider>
)
