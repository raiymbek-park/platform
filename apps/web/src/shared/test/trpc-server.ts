import type { HttpHandler } from 'msw'

import { HttpResponse, http } from 'msw'
import { setupServer } from 'msw/node'

import { env } from '@/shared/config'

const trpcUrl = (procedure: string) => `${env.apiUrl}/${procedure}`

const batchData = (data: unknown) => HttpResponse.json([{ result: { data } }])

const batchError = (code: string, httpStatus: number) =>
  HttpResponse.json(
    [{ error: { message: code, code: -32603, data: { code, httpStatus } } }],
    { status: httpStatus },
  )

export const trpcMutation = (
  procedure: string,
  resolve: (input: unknown) => unknown,
): HttpHandler =>
  http.post(trpcUrl(procedure), async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>
    return batchData(resolve(body['0']))
  })

export const trpcMutationError = (
  procedure: string,
  code = 'INTERNAL_SERVER_ERROR',
  httpStatus = 500,
): HttpHandler =>
  http.post(trpcUrl(procedure), () => batchError(code, httpStatus))

export const trpcQuery = (procedure: string, data: unknown): HttpHandler =>
  http.get(trpcUrl(procedure), () => batchData(data))

const homeHandlers = [
  trpcQuery('resident.me', {
    apartment: 42,
    block: 1,
    name: 'Алиса',
  }),
  trpcQuery('events.list', []),
  trpcQuery('serviceContacts.list', []),
  trpcMutation('resident.markVisit', () => ({ ok: true })),
]

const onboardingHandlers = [
  trpcMutation('resident.register', input => ({ resident: input })),
]

export const trpcServer = setupServer(...onboardingHandlers, ...homeHandlers)
