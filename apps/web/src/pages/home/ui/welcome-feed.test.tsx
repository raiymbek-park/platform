import { createHash } from 'node:crypto'

import {
  fake,
  injectFake,
  resetFirestore,
  Timestamp,
} from '@raiymbek-park/api/testing'
import { cleanup, screen, waitFor } from '@testing-library/react'
import { HttpResponse, http } from 'msw'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'

import { env } from '@/shared/config'
import { firebaseAuth, firebaseMessaging, trpcServer } from '@/shared/test'
import { renderAppWithServer } from '@/shared/test/render-app-server'

import { pushRegistration } from '../model/use-register-push-token'

const uid = 'resident-uid'

const hashSource = (...parts: string[]) =>
  createHash('sha256').update(parts.join('\n')).digest('hex').slice(0, 32)

const seedResident = (overrides: Record<string, unknown> = {}) =>
  fake.seed(`residents/${uid}`, {
    apartment: 42,
    avatarUrl: null,
    block: 1,
    cars: [],
    isPhoneVisible: false,
    name: 'Alice',
    phone: '+77071234455',
    role: 'resident',
    ...overrides,
  })

const seedStaffResident = () =>
  seedResident({
    lastVisit: Timestamp.fromMillis(1000),
    role: 'administration',
  })

const seedIssue = (overrides: Record<string, unknown> = {}) =>
  fake.seed('issues/issue-18', {
    author: { apartment: 12, block: 1, name: 'George Lucas' },
    authorId: 'author-uid',
    category: 'other',
    commentCount: 0,
    createdAt: Timestamp.fromMillis(2000),
    description: '',
    keywords: [],
    lang: 'en',
    media: [],
    number: 18,
    reactions: {},
    status: 'new',
    tags: [],
    title: 'Water leak in the basement',
    urgent: false,
    ...overrides,
  })

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

const failFirstRegistration = () => {
  const state = { failed: false }
  trpcServer.use(
    http.post(`${env.apiUrl}/*`, ({ request }) => {
      const url = new URL(request.url)
      if (!url.pathname.includes('notifications.registerToken'))
        return undefined
      if (state.failed) return undefined
      state.failed = true
      const procedures = (url.pathname.split('/').at(-1) ?? '').split(',')
      return HttpResponse.json(
        procedures.map(() => ({
          error: {
            code: -32603,
            data: { code: 'INTERNAL_SERVER_ERROR', httpStatus: 500 },
            message: 'INTERNAL_SERVER_ERROR',
          },
        })),
        { status: 500 },
      )
    }),
  )
  return state
}

const pushToken = () => fake.getDoc(`residents/${uid}/pushTokens/push-token-1`)

beforeEach(() => {
  firebaseAuth.reset()
  firebaseAuth.signIn()
  firebaseMessaging.reset()
  fake.reset()
  injectFake()
  pushRegistration.isRequested = false
  env.vapidKey = 'vapid-test-key'
})

afterEach(() => {
  env.vapidKey = ''
  vi.unstubAllGlobals()
  Reflect.deleteProperty(navigator, 'serviceWorker')
  resetFirestore()
})

test('a newly opened issue renders as a change row named by its number and title', async () => {
  seedStaffResident()
  seedIssue()
  renderAppWithServer('/home', { uid })

  expect(
    await screen.findByText('Issue #18: Water leak in the basement'),
  ).toBeInTheDocument()
})

test('the change row shows the title projected for the reader’s language', async () => {
  seedStaffResident()
  const title = 'Жертөледегі су ағуы'
  const description = 'Жертөледегі құбыр ағып жатыр'
  seedIssue({
    description,
    lang: 'kk',
    title,
    translatedRev: hashSource(title, description),
    translations: {
      en: {
        description: 'A pipe is leaking in the basement',
        title: 'Water leak in the basement',
      },
    },
  })
  renderAppWithServer('/home', { uid })

  expect(
    await screen.findByText('Issue #18: Water leak in the basement'),
  ).toBeInTheDocument()
  expect(
    screen.queryByText('Issue #18: Жертөледегі су ағуы'),
  ).not.toBeInTheDocument()
})

test('granting permission registers the device token once the feed has loaded', async () => {
  seedResident()
  firebaseMessaging.supportPush()
  stubNotification('default', 'granted')
  const register = stubServiceWorker()

  renderAppWithServer('/home', { uid })

  await waitFor(() =>
    expect(pushToken()).toMatchObject({ locale: 'en', token: 'push-token-1' }),
  )
  expect(register).toHaveBeenCalledWith('/firebase-messaging-sw.js', {
    scope: '/',
  })
})

test('declining the prompt registers nothing and keeps Home on screen', async () => {
  seedResident()
  firebaseMessaging.supportPush()
  const requestPermission = stubNotification('default', 'denied')
  stubServiceWorker()

  const { currentPath } = renderAppWithServer('/home', { uid })

  await waitFor(() => expect(requestPermission).toHaveBeenCalled())
  expect(firebaseMessaging.tokenRequestCount()).toBe(0)
  expect(pushToken()).toBeUndefined()
  expect(currentPath()).toBe('/home')
})

test('a device that already dismissed the prompt is never asked again', async () => {
  seedResident()
  firebaseMessaging.supportPush()
  localStorage.setItem('push-prompted', 'true')
  const requestPermission = stubNotification('default', 'granted')
  stubServiceWorker()

  renderAppWithServer('/home', { uid })

  await waitFor(() => expect(firebaseMessaging.isSupportedCallCount()).toBe(1))
  expect(requestPermission).not.toHaveBeenCalled()
  expect(pushToken()).toBeUndefined()
})

test('a browser without push support degrades silently', async () => {
  seedResident()

  const { currentPath } = renderAppWithServer('/home', { uid })

  await waitFor(() => expect(firebaseMessaging.isSupportedCallCount()).toBe(1))
  expect(firebaseMessaging.tokenRequestCount()).toBe(0)
  expect(pushToken()).toBeUndefined()
  expect(currentPath()).toBe('/home')
})

test('failing to obtain a token writes no registration and shows no error', async () => {
  seedResident()
  firebaseMessaging.supportPush()
  firebaseMessaging.failToken()
  stubNotification('granted', 'granted')
  stubServiceWorker()

  const { currentPath } = renderAppWithServer('/home', { uid })

  await waitFor(() => expect(firebaseMessaging.tokenRequestCount()).toBe(1))
  expect(pushToken()).toBeUndefined()
  expect(currentPath()).toBe('/home')
})

test('the prompt is requested once per load, leaving Home unchanged', async () => {
  seedResident()
  firebaseMessaging.supportPush()
  const requestPermission = stubNotification('default', 'granted')
  stubServiceWorker()

  renderAppWithServer('/home', { uid })

  await waitFor(() => expect(pushToken()).toBeDefined())
  expect(requestPermission).toHaveBeenCalledTimes(1)
  expect(screen.getByText('Services')).toBeInTheDocument()
  expect(screen.getByText('Emergency contacts')).toBeInTheDocument()
  expect(screen.getByRole('navigation')).toBeInTheDocument()
})

test('a failed registration surfaces nothing and a later Home load registers the device', async () => {
  seedResident()
  firebaseMessaging.supportPush()
  stubNotification('granted', 'granted')
  stubServiceWorker()

  const { currentPath } = renderAppWithServer('/home', { uid })
  const registration = failFirstRegistration()

  await screen.findByText('Services')
  await waitFor(() => expect(registration.failed).toBe(true))
  await waitFor(() => expect(pushRegistration.isRequested).toBe(false))
  expect(pushToken()).toBeUndefined()
  expect(currentPath()).toBe('/home')
  expect(
    screen.queryByRole('button', { name: 'Close' }),
  ).not.toBeInTheDocument()

  cleanup()
  renderAppWithServer('/home', { uid })

  await waitFor(() =>
    expect(pushToken()).toMatchObject({ token: 'push-token-1' }),
  )
})

test('a registration slower than the feed keeps Home interactive and registers once it completes', async () => {
  seedResident()
  firebaseMessaging.supportPush()
  stubNotification('granted', 'granted')
  const serviceWorker = deferredServiceWorker()

  renderAppWithServer('/home', { uid })

  await waitFor(() => expect(serviceWorker.register).toHaveBeenCalled())
  expect(screen.getByText('Services')).toBeInTheDocument()
  expect(screen.getByText('Emergency contacts')).toBeInTheDocument()
  expect(screen.getByRole('navigation')).toBeInTheDocument()
  expect(pushToken()).toBeUndefined()

  serviceWorker.complete()

  await waitFor(() =>
    expect(pushToken()).toMatchObject({ token: 'push-token-1' }),
  )
})

test('a missing VAPID key never prompts and never registers', async () => {
  seedResident()
  env.vapidKey = ''
  firebaseMessaging.supportPush()
  const requestPermission = stubNotification('default', 'granted')
  stubServiceWorker()

  renderAppWithServer('/home', { uid })

  await waitFor(() => expect(pushRegistration.isRequested).toBe(true))
  expect(requestPermission).not.toHaveBeenCalled()
  expect(pushToken()).toBeUndefined()
})
