import '@testing-library/jest-dom/vitest'

import { i18n } from '@lingui/core'
import { cleanup } from '@testing-library/react'
import { afterAll, afterEach, beforeAll, beforeEach, vi } from 'vitest'

import { queryClient } from '@/shared/api'
import { firebaseMessaging } from '@/shared/test/firebase-messaging'
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

vi.mock(
  'firebase/messaging',
  async () =>
    (await import('@/shared/test/firebase-messaging')).firebaseMessagingModule,
)

vi.stubGlobal('IntersectionObserver', TestIntersectionObserver)

if (!Element.prototype.scrollIntoView)
  Element.prototype.scrollIntoView = () => {}

beforeAll(() => trpcServer.listen({ onUnhandledRequest: 'bypass' }))

beforeEach(() => localStorage.setItem('locale', 'ru'))

afterEach(() => {
  cleanup()
  trpcServer.resetHandlers()
  queryClient.clear()
  intersectionObserver.reset()
  firebaseMessaging.reset()
  firebaseStorage.reset()
  useToastStore.setState({ toasts: [] })
  localStorage.clear()
})

afterAll(() => trpcServer.close())
