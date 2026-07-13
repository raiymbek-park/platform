import { appRouter, createContext } from '@raiymbek-park/api'
import { createHTTPHandler } from '@trpc/server/adapters/standalone'
import { onRequest } from 'firebase-functions/v2/https'

import { anthropicApiKey } from './anthropic-key'
import { smscLogin, smscPassword, smscSender } from './smsc-secrets'

export {
  translateIssueComments,
  translatePostComments,
} from './translate-comments'
export { translateIssues } from './translate-issues'
export { translatePosts } from './translate-posts'

const pagesOrigin = 'https://raiymbek-park.github.io'

const handler = createHTTPHandler({ createContext, router: appRouter })

export const api = onRequest(
  {
    region: 'europe-west1',
    minInstances: 0,
    cors: [pagesOrigin],
    secrets: [anthropicApiKey, smscLogin, smscPassword, smscSender],
  },
  (req, res) => handler(req, res),
)
