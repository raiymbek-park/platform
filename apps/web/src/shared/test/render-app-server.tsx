import type { Context } from '@raiymbek-park/api'

import { i18n } from '@lingui/core'
import { appRouter } from '@raiymbek-park/api'
import { fetchRequestHandler } from '@trpc/server/adapters/fetch'
import { http } from 'msw'

import { env } from '@/shared/config'
import { messages as enMessages } from '@/shared/i18n/locales/en/messages.po'

import { renderApp } from './render-app'
import { trpcServer } from './trpc-server'

const endpoint = new URL(env.apiUrl, 'http://localhost').pathname.replace(
  /^\//,
  '',
)

type ServerOptions = {
  uid?: string | null
}

export const renderAppWithServer = (
  initialPath: string,
  { uid = null }: ServerOptions = {},
) => {
  localStorage.setItem('locale', 'en')
  i18n.loadAndActivate({ locale: 'en', messages: enMessages })
  trpcServer.use(
    http.all(`${env.apiUrl}/*`, ({ request }) =>
      fetchRequestHandler({
        router: appRouter,
        endpoint,
        req: request,
        createContext: (): Context => ({ locale: 'en', phone: null, uid }),
      }),
    ),
  )
  return renderApp(initialPath)
}
