import { createHTTPServer } from '@trpc/server/adapters/standalone'

import { appRouter } from './router'

const port = Number(process.env.PORT ?? 3001)

const server = createHTTPServer({
  router: appRouter,
  middleware: (req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'content-type')

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
