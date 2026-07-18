import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'

import { sendSms } from './smsc-client'

const fetchMock = vi.fn()

const jsonResponse = (body: unknown) => ({ json: () => Promise.resolve(body) })

const validInput = {
  login: 'park-login',
  message: 'Raiymbek Park: код подтверждения 123456',
  phone: '+77781234455',
  psw: 'secret-psw',
  sender: 'Raiymbek',
}

beforeEach(() => {
  vi.stubGlobal('fetch', fetchMock)
  fetchMock.mockResolvedValue(jsonResponse({ id: 42 }))
})

afterEach(() => {
  vi.unstubAllGlobals()
  fetchMock.mockReset()
})

describe('sendSms — smsc.kz gateway request (happy-path 7)', () => {
  test('POSTs to the smsc.kz send endpoint', async () => {
    await sendSms(validInput)
    const [url, init] = fetchMock.mock.calls[0] ?? []
    expect(url).toBe('https://smsc.kz/sys/send.php')
    expect(init.method).toBe('POST')
  })

  test('carries login, psw, phones, mes, sender and fmt=3 in the body', async () => {
    await sendSms(validInput)
    const [, init] = fetchMock.mock.calls[0] ?? []
    const params = new URLSearchParams(init.body)
    expect(Object.fromEntries(params)).toMatchObject({
      charset: 'utf-8',
      fmt: '3',
      login: 'park-login',
      mes: 'Raiymbek Park: код подтверждения 123456',
      phones: '+77781234455',
      psw: 'secret-psw',
      sender: 'Raiymbek',
    })
  })

  test('omits the sender parameter when no sender name is configured', async () => {
    await sendSms({ ...validInput, sender: '' })
    const [, init] = fetchMock.mock.calls[0] ?? []
    expect(new URLSearchParams(init.body).has('sender')).toBe(false)
  })
})

describe('sendSms — response parsing', () => {
  test('reports success with the message id when the body carries an id', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ id: 9876 }))
    await expect(sendSms(validInput)).resolves.toEqual({ id: 9876, ok: true })
  })

  test('reports failure with the gateway error text (error-states 4)', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({ error: 'insufficient balance', error_code: 7 }),
    )
    await expect(sendSms(validInput)).resolves.toEqual({
      error: 'insufficient balance',
      ok: false,
    })
  })

  test('treats a non-numeric id as a malformed response', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ id: 'not-a-number' }))
    await expect(sendSms(validInput)).resolves.toEqual({
      error: 'malformed smsc response',
      ok: false,
    })
  })

  test('treats a body with neither id nor error as malformed', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ unexpected: true }))
    await expect(sendSms(validInput)).resolves.toEqual({
      error: 'malformed smsc response',
      ok: false,
    })
  })

  test('treats a non-object body as malformed', async () => {
    fetchMock.mockResolvedValue(jsonResponse(null))
    await expect(sendSms(validInput)).resolves.toEqual({
      error: 'malformed smsc response',
      ok: false,
    })
  })
})
