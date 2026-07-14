import type { Event } from '../events/events-store'

import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'

import { getEvents } from '../events/events-store'
import { Timestamp } from '../firestore'
import { getNotificationTarget, markNotified } from '../resident/resident-store'
import {
  getResidentTokens,
  residentIdsWithTokens,
  unregisterPushToken,
} from './push-token-store'
import { sendDigests } from './send-digests'

const sendSpy = vi.hoisted(() => vi.fn())

vi.mock('../events/events-store', () => ({ getEvents: vi.fn() }))

vi.mock('../resident/resident-store', () => ({
  getNotificationTarget: vi.fn(),
  markNotified: vi.fn(),
}))

vi.mock('./push-token-store', () => ({
  getResidentTokens: vi.fn(),
  residentIdsWithTokens: vi.fn(),
  unregisterPushToken: vi.fn(),
}))

vi.mock('./messaging', () => ({
  getMessagingClient: () => ({ sendEachForMulticast: sendSpy }),
}))

const mockGetEvents = vi.mocked(getEvents)
const mockGetNotificationTarget = vi.mocked(getNotificationTarget)
const mockMarkNotified = vi.mocked(markNotified)
const mockGetResidentTokens = vi.mocked(getResidentTokens)
const mockResidentIdsWithTokens = vi.mocked(residentIdsWithTokens)
const mockUnregisterPushToken = vi.mocked(unregisterPushToken)

const noon = new Date('2026-07-14T07:00:00Z')
const quietEvening = new Date('2026-07-14T18:00:00Z')

const announcement: Event = {
  category: 'complex',
  createdAt: 1_000,
  id: 'post-1',
  title: 'Отключение воды 15 июля',
  type: 'announcement',
}

const target = {
  lastNotifiedAt: null,
  lastVisit: null,
  role: 'resident' as const,
}

const accepted = (successes: number, failures = 0) => ({
  failureCount: failures,
  responses: [
    ...Array.from({ length: successes }, () => ({ success: true })),
    ...Array.from({ length: failures }, () => ({
      error: { code: 'messaging/internal-error' },
      success: false,
    })),
  ],
  successCount: successes,
})

beforeEach(() => {
  vi.clearAllMocks()
  vi.spyOn(console, 'error').mockImplementation(() => {})
  mockResidentIdsWithTokens.mockResolvedValue(['uid-a'])
  mockGetNotificationTarget.mockResolvedValue(target)
  mockGetEvents.mockResolvedValue([announcement])
  mockGetResidentTokens.mockResolvedValue([{ locale: 'ru', token: 'token-1' }])
  sendSpy.mockImplementation(message =>
    Promise.resolve(accepted(message.tokens.length)),
  )
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('sendDigests — quiet hours short-circuit the run', () => {
  test('a quiet-hour run reads nothing and sends nothing', async () => {
    await sendDigests(quietEvening)

    expect(mockResidentIdsWithTokens).not.toHaveBeenCalled()
    expect(sendSpy).not.toHaveBeenCalled()
    expect(mockMarkNotified).not.toHaveBeenCalled()
  })
})

describe('sendDigests — one digest per resident per window', () => {
  test('sends one multicast naming the newest event and advances lastNotifiedAt to the window end', async () => {
    await sendDigests(noon)

    expect(sendSpy).toHaveBeenCalledTimes(1)
    expect(sendSpy).toHaveBeenCalledWith({
      notification: {
        body: 'Отключение воды 15 июля',
        title: 'Новое в Raiymbek Park',
      },
      tokens: ['token-1'],
      webpush: {
        fcmOptions: { link: 'https://raiymbek-park.github.io/platform/home' },
        headers: { Topic: 'uid-a' },
        notification: { tag: 'uid-a' },
      },
    })
    expect(mockMarkNotified).toHaveBeenCalledTimes(1)
    expect(mockMarkNotified).toHaveBeenCalledWith(
      'uid-a',
      Timestamp.fromDate(noon),
    )
  })

  test('two devices of one locale receive the same digest in one multicast', async () => {
    mockGetResidentTokens.mockResolvedValue([
      { locale: 'ru', token: 'token-1' },
      { locale: 'ru', token: 'token-2' },
    ])

    await sendDigests(noon)

    expect(sendSpy).toHaveBeenCalledTimes(1)
    expect(sendSpy).toHaveBeenCalledWith(
      expect.objectContaining({ tokens: ['token-1', 'token-2'] }),
    )
    expect(mockMarkNotified).toHaveBeenCalledTimes(1)
  })

  test('devices of different locales each receive copy in their own language', async () => {
    mockGetResidentTokens.mockResolvedValue([
      { locale: 'ru', token: 'token-ru' },
      { locale: 'en', token: 'token-en' },
    ])

    await sendDigests(noon)

    expect(sendSpy).toHaveBeenCalledTimes(2)
    expect(sendSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        notification: expect.objectContaining({
          title: 'Новое в Raiymbek Park',
        }),
        tokens: ['token-ru'],
      }),
    )
    expect(sendSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        notification: expect.objectContaining({
          title: 'New in Raiymbek Park',
        }),
        tokens: ['token-en'],
      }),
    )
  })

  test('a resident with no events in the window receives nothing and does not advance', async () => {
    mockGetEvents.mockResolvedValue([])

    await sendDigests(noon)

    expect(sendSpy).not.toHaveBeenCalled()
    expect(mockMarkNotified).not.toHaveBeenCalled()
  })

  test('a resident whose tokens are gone mid-run is skipped without a send', async () => {
    mockGetResidentTokens.mockResolvedValue([])

    await sendDigests(noon)

    expect(sendSpy).not.toHaveBeenCalled()
    expect(mockMarkNotified).not.toHaveBeenCalled()
  })
})

describe('sendDigests — window anchor', () => {
  test('the anchor is the later of lastVisit and lastNotifiedAt', async () => {
    const lastVisit = Timestamp.fromMillis(10_000)
    const lastNotifiedAt = Timestamp.fromMillis(12_000)
    mockGetNotificationTarget.mockResolvedValue({
      lastNotifiedAt,
      lastVisit,
      role: 'resident',
    })

    await sendDigests(noon)

    expect(mockGetEvents).toHaveBeenCalledWith(
      'uid-a',
      'resident',
      lastNotifiedAt,
    )
  })

  test('a missing lastNotifiedAt anchors on lastVisit alone', async () => {
    const lastVisit = Timestamp.fromMillis(10_000)
    mockGetNotificationTarget.mockResolvedValue({
      lastNotifiedAt: null,
      lastVisit,
      role: 'resident',
    })

    await sendDigests(noon)

    expect(mockGetEvents).toHaveBeenCalledWith('uid-a', 'resident', lastVisit)
  })

  test('a resident with neither marker is read from the beginning and still advances', async () => {
    await sendDigests(noon)

    expect(mockGetEvents).toHaveBeenCalledWith('uid-a', 'resident', null)
    expect(mockMarkNotified).toHaveBeenCalledWith(
      'uid-a',
      Timestamp.fromDate(noon),
    )
  })

  test('the role decides the event audience passed through to getEvents', async () => {
    mockGetNotificationTarget.mockResolvedValue({ ...target, role: 'manager' })

    await sendDigests(noon)

    expect(mockGetEvents).toHaveBeenCalledWith('uid-a', 'manager', null)
  })
})

describe('sendDigests — delivery outcomes', () => {
  test('lastNotifiedAt does not advance when no token accepted the digest', async () => {
    sendSpy.mockResolvedValue(accepted(0, 1))

    await sendDigests(noon)

    expect(sendSpy).toHaveBeenCalledTimes(1)
    expect(mockMarkNotified).not.toHaveBeenCalled()
  })

  test('a token rejected as unregistered is pruned and the window still advances', async () => {
    mockGetResidentTokens.mockResolvedValue([
      { locale: 'ru', token: 'token-dead' },
      { locale: 'ru', token: 'token-live' },
    ])
    sendSpy.mockResolvedValue({
      failureCount: 1,
      responses: [
        {
          error: { code: 'messaging/registration-token-not-registered' },
          success: false,
        },
        { success: true },
      ],
      successCount: 1,
    })

    await sendDigests(noon)

    expect(mockUnregisterPushToken).toHaveBeenCalledTimes(1)
    expect(mockUnregisterPushToken).toHaveBeenCalledWith('uid-a', 'token-dead')
    expect(mockMarkNotified).toHaveBeenCalledWith(
      'uid-a',
      Timestamp.fromDate(noon),
    )
  })

  test('a token failing for any other reason keeps its registration', async () => {
    mockGetResidentTokens.mockResolvedValue([
      { locale: 'ru', token: 'token-flaky' },
      { locale: 'ru', token: 'token-live' },
    ])
    sendSpy.mockResolvedValue({
      failureCount: 1,
      responses: [
        { error: { code: 'messaging/internal-error' }, success: false },
        { success: true },
      ],
      successCount: 1,
    })

    await sendDigests(noon)

    expect(mockUnregisterPushToken).not.toHaveBeenCalled()
    expect(mockMarkNotified).toHaveBeenCalledTimes(1)
  })
})

describe('sendDigests — failure containment', () => {
  test('one resident failing during send does not stop the others', async () => {
    mockResidentIdsWithTokens.mockResolvedValue(['uid-a', 'uid-b', 'uid-c'])
    mockGetEvents.mockImplementation(uid =>
      uid === 'uid-b'
        ? Promise.reject(new Error('firestore unavailable'))
        : Promise.resolve([announcement]),
    )

    await sendDigests(noon)

    expect(sendSpy).toHaveBeenCalledTimes(2)
    expect(mockMarkNotified).toHaveBeenCalledWith(
      'uid-a',
      Timestamp.fromDate(noon),
    )
    expect(mockMarkNotified).toHaveBeenCalledWith(
      'uid-c',
      Timestamp.fromDate(noon),
    )
    expect(mockMarkNotified).not.toHaveBeenCalledWith(
      'uid-b',
      expect.anything(),
    )
  })

  test('a registration whose resident record is gone is skipped while others deliver', async () => {
    mockResidentIdsWithTokens.mockResolvedValue(['uid-gone', 'uid-a'])
    mockGetNotificationTarget.mockImplementation(uid =>
      Promise.resolve(uid === 'uid-gone' ? null : target),
    )

    await sendDigests(noon)

    expect(sendSpy).toHaveBeenCalledTimes(1)
    expect(mockMarkNotified).toHaveBeenCalledTimes(1)
    expect(mockMarkNotified).toHaveBeenCalledWith(
      'uid-a',
      Timestamp.fromDate(noon),
    )
  })
})
