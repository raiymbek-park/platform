import { appRouter } from '@raiymbek-park/api'
import { createHTTPHandler } from '@trpc/server/adapters/standalone'
import { onRequest } from 'firebase-functions/v2/https'

const pagesOrigin = 'https://raiymbek-park.github.io'

const handler = createHTTPHandler({ router: appRouter })

export const api = onRequest(
  { region: 'europe-west1', minInstances: 0, cors: [pagesOrigin] },
  (req, res) => handler(req, res),
)
