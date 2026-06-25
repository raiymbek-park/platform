import '@testing-library/jest-dom/vitest'

import { cleanup } from '@testing-library/react'
import { afterAll, afterEach, beforeAll, vi } from 'vitest'

import { queryClient } from '@/shared/api'
import { trpcServer } from '@/shared/test/trpc-server'

vi.mock(
  'firebase/app',
  async () => (await import('@/shared/test/firebase-auth')).firebaseAppModule,
)

vi.mock(
  'firebase/auth',
  async () => (await import('@/shared/test/firebase-auth')).firebaseAuthModule,
)

beforeAll(() => trpcServer.listen({ onUnhandledRequest: 'bypass' }))

afterEach(() => {
  cleanup()
  trpcServer.resetHandlers()
  queryClient.clear()
})

afterAll(() => trpcServer.close())
