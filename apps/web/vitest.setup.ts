import '@testing-library/jest-dom/vitest'

import { i18n } from '@lingui/core'
import { cleanup } from '@testing-library/react'
import { afterAll, afterEach, beforeAll, beforeEach, vi } from 'vitest'

import { queryClient } from '@/shared/api'
import { firebaseStorage } from '@/shared/test/firebase-storage'
import {
  intersectionObserver,
  TestIntersectionObserver,
} from '@/shared/test/intersection-observer'
import { trpcServer } from '@/shared/test/trpc-server'
import { useToastStore } from '@/shared/toast/use-toast-store'

i18n.loadAndActivate({ locale: 'ru', messages: {} })

vi.mock(
  'firebase/app',
  async () => (await import('@/shared/test/firebase-auth')).firebaseAppModule,
)

vi.mock(
  'firebase/auth',
  async () => (await import('@/shared/test/firebase-auth')).firebaseAuthModule,
)

vi.mock(
  'firebase/storage',
  async () =>
    (await import('@/shared/test/firebase-storage')).firebaseStorageModule,
)

vi.stubGlobal('IntersectionObserver', TestIntersectionObserver)

beforeAll(() => trpcServer.listen({ onUnhandledRequest: 'bypass' }))

beforeEach(() => localStorage.setItem('locale', 'ru'))

afterEach(() => {
  cleanup()
  trpcServer.resetHandlers()
  queryClient.clear()
  intersectionObserver.reset()
  firebaseStorage.reset()
  useToastStore.setState({ toasts: [] })
  localStorage.clear()
})

afterAll(() => trpcServer.close())
