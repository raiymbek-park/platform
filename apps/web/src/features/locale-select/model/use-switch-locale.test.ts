import { screen, waitFor } from '@testing-library/react'
import { HttpResponse, http } from 'msw'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'

import { env } from '@/shared/config'
import { i18n } from '@/shared/i18n'
import {
  firebaseAuth,
  firebaseMessaging,
  renderApp,
  trpcQueries,
  trpcServer,
} from '@/shared/test'

const stubNotification = (permission: NotificationPermission) => {
  const requestPermission = vi.fn(() => Promise.resolve(permission))
  vi.stubGlobal('Notification', { permission, requestPermission })
  return requestPermission
}

const stubServiceWorker = () => {
  const register = vi.fn(() => Promise.resolve({ scope: '/' }))
  Object.defineProperty(navigator, 'serviceWorker', {
    configurable: true,
    value: { register },
  })
  return register
}

const unwrapEntry = (entry: unknown): unknown =>
  entry && typeof entry === 'object' && 'json' in entry ? entry.json : entry

const captureRegistrations = () => {
  const registrations: { input: unknown; locale: string | null }[] = []
  trpcServer.use(
    http.post(
      `${env.apiUrl}/notifications.registerToken`,
      async ({ request }) => {
        const body = (await request.json()) as Record<string, unknown>
        registrations.push({
          input: unwrapEntry(body['0']),
          locale: request.headers.get('x-locale'),
        })
        return HttpResponse.json([{ result: { data: { ok: true } } }])
      },
    ),
  )
  return registrations
}

beforeEach(() => {
  firebaseAuth.reset()
  firebaseAuth.signIn()
  env.vapidKey = 'vapid-test-key'
  trpcServer.use(
    trpcQueries({
      'resident.me': () => ({
        apartment: 42,
        avatarUrl: null,
        block: 1,
        cars: [],
        id: 'resident-uid',
        isPhoneVisible: false,
        name: 'Алиса',
        phone: '+77071234567',
        role: 'owner',
      }),
    }),
  )
})

afterEach(() => {
  env.vapidKey = ''
  vi.unstubAllGlobals()
  Reflect.deleteProperty(navigator, 'serviceWorker')
  i18n.loadAndActivate({ locale: 'ru', messages: {} })
})

test('happy-path 14: switching the language re-registers the same token under the new locale without prompting', async () => {
  firebaseMessaging.supportPush()
  const requestPermission = stubNotification('granted')
  stubServiceWorker()
  const registrations = captureRegistrations()

  const { user } = renderApp('/settings')
  await user.click(await screen.findByRole('button', { name: /English/ }))

  await waitFor(() =>
    expect(registrations).toEqual([
      { input: { token: 'push-token-1' }, locale: 'en' },
    ]),
  )
  expect(requestPermission).not.toHaveBeenCalled()
})

test('edge-cases 15: a language change on a device that declined the prompt asks nothing, registers nothing, and shows no error', async () => {
  firebaseMessaging.supportPush()
  const requestPermission = stubNotification('denied')
  const register = stubServiceWorker()
  const registrations = captureRegistrations()

  const { user } = renderApp('/settings')
  await user.click(await screen.findByRole('button', { name: /English/ }))

  await screen.findByRole('heading', { name: 'Name' })
  await waitFor(() => expect(firebaseMessaging.isSupportedCallCount()).toBe(1))
  expect(requestPermission).not.toHaveBeenCalled()
  expect(register).not.toHaveBeenCalled()
  expect(firebaseMessaging.tokenRequestCount()).toBe(0)
  expect(registrations).toEqual([])
  expect(
    screen.queryByRole('button', { name: /Close|Закрыть/ }),
  ).not.toBeInTheDocument()
})
