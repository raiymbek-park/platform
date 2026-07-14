import { cleanup, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'

import { env } from '@/shared/config'
import {
  firebaseAuth,
  firebaseMessaging,
  renderApp,
  trpcMutations,
  trpcQueries,
  trpcServer,
} from '@/shared/test'

import { pushRegistration } from './use-register-push-token'

const stubNotification = (
  permission: NotificationPermission,
  outcome: NotificationPermission,
) => {
  const requestPermission = vi.fn(() => Promise.resolve(outcome))
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

const deferredServiceWorker = () => {
  const controls = { complete: () => {} }
  const registration = new Promise<{ scope: string }>(resolve => {
    controls.complete = () => resolve({ scope: '/' })
  })
  const register = vi.fn(() => registration)
  Object.defineProperty(navigator, 'serviceWorker', {
    configurable: true,
    value: { register },
  })
  return { complete: () => controls.complete(), register }
}

const serveRegisterToken = () => {
  const registered: unknown[] = []
  trpcServer.use(
    trpcMutations({
      'notifications.registerToken': raw => {
        registered.push(raw)
        return { ok: true }
      },
      'resident.markVisit': () => ({ ok: true }),
    }),
  )
  return registered
}

beforeEach(() => {
  firebaseAuth.reset()
  firebaseAuth.signIn()
  pushRegistration.isRequested = false
  env.vapidKey = 'vapid-test-key'
  trpcServer.use(
    trpcQueries({
      'events.list': () => [],
      'resident.me': () => ({ apartment: 42, block: 1, name: 'Алиса' }),
      'serviceContacts.list': () => [],
    }),
  )
})

afterEach(() => {
  env.vapidKey = ''
  vi.unstubAllGlobals()
  Reflect.deleteProperty(navigator, 'serviceWorker')
})

test('happy-path 2+3: granting permission registers the device token once the feed has loaded', async () => {
  firebaseMessaging.supportPush()
  stubNotification('default', 'granted')
  const register = stubServiceWorker()
  const registered = serveRegisterToken()

  renderApp('/home')

  await waitFor(() => expect(registered).toEqual([{ token: 'push-token-1' }]))
  expect(register).toHaveBeenCalledWith('/firebase-messaging-sw.js', {
    scope: '/',
  })
})

test('error-states 1: declining the prompt registers nothing and keeps Home on screen', async () => {
  firebaseMessaging.supportPush()
  const requestPermission = stubNotification('default', 'denied')
  stubServiceWorker()
  const registered = serveRegisterToken()

  const { currentPath } = renderApp('/home')

  await waitFor(() => expect(requestPermission).toHaveBeenCalled())
  expect(firebaseMessaging.tokenRequestCount()).toBe(0)
  expect(registered).toEqual([])
  expect(currentPath()).toBe('/home')
})

test('error-states 2: a device that already dismissed the prompt is never asked again', async () => {
  firebaseMessaging.supportPush()
  localStorage.setItem('push-prompted', 'true')
  const requestPermission = stubNotification('default', 'granted')
  stubServiceWorker()
  const registered = serveRegisterToken()

  renderApp('/home')

  await waitFor(() => expect(firebaseMessaging.isSupportedCallCount()).toBe(1))
  expect(requestPermission).not.toHaveBeenCalled()
  expect(registered).toEqual([])
})

test('error-states 3: a browser without push support degrades silently', async () => {
  const registered = serveRegisterToken()

  const { currentPath } = renderApp('/home')

  await waitFor(() => expect(firebaseMessaging.isSupportedCallCount()).toBe(1))
  expect(firebaseMessaging.tokenRequestCount()).toBe(0)
  expect(registered).toEqual([])
  expect(currentPath()).toBe('/home')
})

test('error-states 4: failing to obtain a token writes no registration and shows no error', async () => {
  firebaseMessaging.supportPush()
  firebaseMessaging.failToken()
  stubNotification('granted', 'granted')
  stubServiceWorker()
  const registered = serveRegisterToken()

  const { currentPath } = renderApp('/home')

  await waitFor(() => expect(firebaseMessaging.tokenRequestCount()).toBe(1))
  expect(registered).toEqual([])
  expect(currentPath()).toBe('/home')
})

test('happy-path 1: the prompt is requested once per load, once the feed has loaded, leaving Home unchanged', async () => {
  firebaseMessaging.supportPush()
  const requestPermission = stubNotification('default', 'granted')
  stubServiceWorker()
  const registered = serveRegisterToken()

  renderApp('/home')

  await waitFor(() => expect(registered).toHaveLength(1))
  expect(requestPermission).toHaveBeenCalledTimes(1)
  expect(screen.getByText('Сервисы')).toBeInTheDocument()
  expect(screen.getByText('Аварийные контакты')).toBeInTheDocument()
  expect(screen.getByRole('navigation')).toBeInTheDocument()
})

test('error-states 9: a failed registration surfaces nothing and a later Home load registers the device', async () => {
  firebaseMessaging.supportPush()
  stubNotification('granted', 'granted')
  stubServiceWorker()
  const attempts: unknown[] = []
  trpcServer.use(
    trpcMutations({
      'notifications.registerToken': raw => {
        attempts.push(raw)
        if (attempts.length === 1) throw new Error('registration unavailable')
        return { ok: true }
      },
      'resident.markVisit': () => ({ ok: true }),
    }),
  )

  const { currentPath } = renderApp('/home')

  await waitFor(() => expect(attempts).toHaveLength(1))
  expect(currentPath()).toBe('/home')
  expect(screen.getByText('Сервисы')).toBeInTheDocument()
  expect(
    screen.queryByRole('button', { name: 'Закрыть' }),
  ).not.toBeInTheDocument()

  cleanup()
  pushRegistration.isRequested = false
  renderApp('/home')

  await waitFor(() =>
    expect(attempts).toEqual([
      { token: 'push-token-1' },
      { token: 'push-token-1' },
    ]),
  )
})

test('error-states 12: a registration slower than the feed keeps Home interactive and registers once it completes', async () => {
  firebaseMessaging.supportPush()
  stubNotification('granted', 'granted')
  const serviceWorker = deferredServiceWorker()
  const registered = serveRegisterToken()

  renderApp('/home')

  await waitFor(() => expect(serviceWorker.register).toHaveBeenCalled())
  expect(screen.getByText('Сервисы')).toBeInTheDocument()
  expect(screen.getByText('Аварийные контакты')).toBeInTheDocument()
  expect(screen.getByRole('navigation')).toBeInTheDocument()
  expect(
    screen.queryByText('Загрузка последних событий…'),
  ).not.toBeInTheDocument()
  expect(registered).toEqual([])

  serviceWorker.complete()

  await waitFor(() => expect(registered).toEqual([{ token: 'push-token-1' }]))
})

test('error-states 8: a missing VAPID key never prompts and never registers', async () => {
  env.vapidKey = ''
  firebaseMessaging.supportPush()
  const requestPermission = stubNotification('default', 'granted')
  stubServiceWorker()
  const registered = serveRegisterToken()

  renderApp('/home')

  await waitFor(() => expect(pushRegistration.isRequested).toBe(true))
  expect(requestPermission).not.toHaveBeenCalled()
  expect(registered).toEqual([])
})
