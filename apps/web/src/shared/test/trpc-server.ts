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

const trpcQuery = (procedure: string, data: unknown): HttpHandler =>
  http.get(trpcUrl(procedure), () => batchData(data))

const unwrap = (entry: unknown): unknown =>
  entry && typeof entry === 'object' && 'json' in entry ? entry.json : entry

export const trpcQueries = (
  resolvers: Record<string, (input: unknown) => unknown>,
): HttpHandler =>
  http.get(trpcUrl(':procedures'), async ({ params, request }) => {
    const procedures = String(params.procedures).split(',')
    const raw = JSON.parse(
      new URL(request.url).searchParams.get('input') ?? '{}',
    )
    const results = await Promise.all(
      procedures.map(async (procedure, index) => ({
        result: {
          data: await resolvers[procedure]?.(unwrap(raw[String(index)])),
        },
      })),
    )
    return HttpResponse.json(results)
  })

export const trpcQueriesError = (
  code = 'INTERNAL_SERVER_ERROR',
  httpStatus = 500,
): HttpHandler =>
  http.get(trpcUrl(':procedures'), ({ params }) => {
    const procedures = String(params.procedures).split(',')
    return HttpResponse.json(
      procedures.map(() => ({
        error: { message: code, code: -32603, data: { code, httpStatus } },
      })),
      { status: httpStatus },
    )
  })

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
