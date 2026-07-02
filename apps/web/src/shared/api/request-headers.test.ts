import { HttpResponse, http } from 'msw'
import { expect, test } from 'vitest'

import { trpcClient } from '@/shared/api'
import { env } from '@/shared/config'
import { trpcServer } from '@/shared/test/trpc-server'

test('happy-path S4 — requests carry the active locale in the x-locale header', async () => {
  let captured: string | null = null

  trpcServer.use(
    http.get(`${env.apiUrl}/resident.me`, ({ request }) => {
      captured = request.headers.get('x-locale')
      return HttpResponse.json([
        { result: { data: { apartment: 0, block: 0, name: '' } } },
      ])
    }),
  )

  await trpcClient.resident.me.query()

  expect(captured).toBe('ru')
})
