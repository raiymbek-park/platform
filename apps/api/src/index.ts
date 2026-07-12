import { existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { createHTTPServer } from '@trpc/server/adapters/standalone'

import { createContext } from './context'
import { appRouter } from './router'

const envPath = join(dirname(fileURLToPath(import.meta.url)), '..', '.env')
if (existsSync(envPath)) process.loadEnvFile(envPath)

const port = Number(process.env.PORT ?? 3001)

const server = createHTTPServer({
  createContext,
  router: appRouter,
  middleware: (req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
    res.setHeader(
      'Access-Control-Allow-Headers',
      'authorization, content-type, x-locale',
    )

    if (req.method === 'OPTIONS') {
      res.writeHead(204)
      res.end()
      return
    }

    next()
  },
})

server.listen(port)

console.info(`tRPC stub server listening on http://localhost:${port}`)
console.info(
  process.env.ANTHROPIC_API_KEY
    ? 'ANTHROPIC_API_KEY loaded — comment translation enabled'
    : 'ANTHROPIC_API_KEY missing — set it in apps/api/.env to enable comment translation',
)
