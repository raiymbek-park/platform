import type { HttpHandler } from 'msw'

import { HttpResponse, http } from 'msw'
import { setupServer } from 'msw/node'

import { env } from '@/shared/config'

const batchError = (code: string, httpStatus: number) =>
  HttpResponse.json(
    [{ error: { message: code, code: -32603, data: { code, httpStatus } } }],
    { status: httpStatus },
  )

export const trpcMutationError = (
  procedure: string,
  code = 'INTERNAL_SERVER_ERROR',
  httpStatus = 500,
): HttpHandler =>
  http.post(`${env.apiUrl}/${procedure}`, () => batchError(code, httpStatus))

export const trpcServer = setupServer()
