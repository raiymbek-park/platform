import type {
  OtpRecord,
  ReserveSendInput,
  VerifyAttemptInput,
} from './otp-store'

import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'

import { hashCode } from './generate-code'

const store = vi.hoisted(() => ({
  records: {} as Record<string, OtpRecord>,
}))

const reserveSendMock = vi.hoisted(() => vi.fn())
const verifyAttemptMock = vi.hoisted(() => vi.fn())
const upsertOtpMock = vi.hoisted(() => vi.fn())
const deleteOtpMock = vi.hoisted(() => vi.fn())
const sendSmsMock = vi.hoisted(() => vi.fn())
const auth = vi.hoisted(() => ({
  createCustomToken: vi.fn(),
  createUser: vi.fn(),
  getUserByPhoneNumber: vi.fn(),
}))

vi.mock('./otp-store', () => ({
  deleteOtp: deleteOtpMock.mockImplementation(async (phone: string) => {
    delete store.records[phone]
  }),
  reserveSend: reserveSendMock.mockImplementation(
    async ({ codeHash, now, phone, rules, salt, ttlMs }: ReserveSendInput) => {
      const previous = store.records[phone] ?? null
      if (previous && now - previous.lastSentAt < rules.intervalMs) {
        return { isBlocked: true }
      }
      const isWindowActive =
        previous !== null && now - previous.windowStart < rules.windowMs
      const sendCount = isWindowActive ? previous.sendCount : 0
      if (sendCount >= rules.sendsPerWindow) return { isBlocked: true }
      store.records[phone] = {
        attemptCount: 0,
        codeHash,
        createdAt: now,
        expiresAt: now + ttlMs,
        lastSentAt: now,
        salt,
        sendCount: sendCount + 1,
        windowStart: isWindowActive ? previous.windowStart : now,
      }
      return { isBlocked: false, previous }
    },
  ),
  upsertOtp: upsertOtpMock.mockImplementation(
    async (phone: string, record: OtpRecord) => {
      store.records[phone] = record
    },
  ),
  verifyAttempt: verifyAttemptMock.mockImplementation(
    async ({ isMatch, maxAttempts, now, phone }: VerifyAttemptInput) => {
      const record = store.records[phone]
      if (!record || now > record.expiresAt) return 'invalid'
      if (record.attemptCount >= maxAttempts) {
        delete store.records[phone]
        return 'invalid'
      }
      if (isMatch(record)) return 'ok'
      const attemptCount = record.attemptCount + 1
      if (attemptCount >= maxAttempts) delete store.records[phone]
      else store.records[phone] = { ...record, attemptCount }
      return 'invalid'
    },
  ),
}))

vi.mock('./smsc-client', () => ({ sendSms: sendSmsMock }))

vi.mock('../firestore', () => ({ getAuthAdmin: () => auth }))

const { otpRouter } = await import('./router')

const caller = otpRouter.createCaller({ locale: 'ru', phone: null, uid: null })

const PHONE = '+77071234567'
const TEST_PHONE = '+77052266666'
const MINUTE = 60 * 1000
const HOUR = 60 * MINUTE

const seedOtp = (record: Partial<OtpRecord>, phone = PHONE) => {
  const now = Date.now()
  store.records[phone] = {
    attemptCount: 0,
    codeHash: hashCode('seed-salt', '654321'),
    createdAt: now,
    expiresAt: now + 5 * MINUTE,
    lastSentAt: now,
    salt: 'seed-salt',
    sendCount: 1,
    windowStart: now,
    ...record,
  }
}

const storedOtp = (phone = PHONE) => store.records[phone]

const deliveredCode = () => {
  const [{ message }] = sendSmsMock.mock.calls.at(-1) ?? [{ message: '' }]
  return message.match(/\d{6}/)?.[0] ?? ''
}

beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(new Date('2026-07-13T12:00:00Z'))
  store.records = {}
  reserveSendMock.mockClear()
  verifyAttemptMock.mockClear()
  upsertOtpMock.mockClear()
  deleteOtpMock.mockClear()
  sendSmsMock.mockReset()
  sendSmsMock.mockResolvedValue({ id: 1, ok: true })
  auth.getUserByPhoneNumber.mockReset()
  auth.createUser.mockReset()
  auth.createCustomToken.mockReset()
  auth.getUserByPhoneNumber.mockResolvedValue({ uid: 'existing-uid' })
  auth.createUser.mockResolvedValue({ uid: 'new-uid' })
  auth.createCustomToken.mockResolvedValue('custom-token')
  vi.stubEnv('SMSC_LOGIN', 'park-login')
  vi.stubEnv('SMSC_PASSWORD', 'secret-psw')
  vi.stubEnv('SMSC_SENDER', 'Raiymbek')
  vi.stubEnv('OTP_TEST_MODE', '')
})

afterEach(() => {
  vi.unstubAllEnvs()
  vi.useRealTimers()
})

describe('otp.send — issue and deliver a code (happy-path 7)', () => {
  test('stores a salted hash with a five-minute expiry and delivers over smsc.kz', async () => {
    const now = Date.now()
    await expect(caller.send({ phone: PHONE })).resolves.toEqual({ ok: true })

    expect(reserveSendMock).toHaveBeenCalledTimes(1)
    expect(storedOtp()).toMatchObject({
      attemptCount: 0,
      expiresAt: now + 5 * MINUTE,
      lastSentAt: now,
      sendCount: 1,
      windowStart: now,
    })
    expect(storedOtp()?.salt).toMatch(/^[0-9a-f]{32}$/)
    expect(storedOtp()?.codeHash).toMatch(/^[0-9a-f]{64}$/)
    expect(sendSmsMock).toHaveBeenCalledTimes(1)
  })

  test('never returns the plaintext code and stores only its hash', async () => {
    const result = await caller.send({ phone: PHONE })
    expect(result).not.toHaveProperty('code')

    const code = deliveredCode()
    expect(storedOtp()?.codeHash).toBe(hashCode(storedOtp()?.salt ?? '', code))
    expect(storedOtp()?.codeHash).not.toContain(code)
  })

  test('passes the configured smsc credentials and sender to the gateway', async () => {
    await caller.send({ phone: PHONE })
    expect(sendSmsMock).toHaveBeenCalledWith(
      expect.objectContaining({
        login: 'park-login',
        phone: PHONE,
        psw: 'secret-psw',
        sender: 'Raiymbek',
      }),
    )
  })
})

describe('otp.send — SMS copy follows the caller locale', () => {
  const deliveredMessage = () =>
    sendSmsMock.mock.calls.at(-1)?.[0].message ?? ''

  test('sends the confirmation copy in Russian for a ru caller', async () => {
    await caller.send({ phone: PHONE })
    expect(deliveredMessage()).toContain('код подтверждения')
  })

  test('sends the confirmation copy in Kazakh for a kk caller', async () => {
    const kkCaller = otpRouter.createCaller({
      locale: 'kk',
      phone: null,
      uid: null,
    })
    await kkCaller.send({ phone: PHONE })
    expect(deliveredMessage()).toContain('растау коды')
  })

  test('sends the confirmation copy in English for an en caller', async () => {
    const enCaller = otpRouter.createCaller({
      locale: 'en',
      phone: null,
      uid: null,
    })
    await enCaller.send({ phone: PHONE })
    expect(deliveredMessage()).toContain('verification code')
  })
})

describe('otp.send — gateway delivery failure (error-states 4)', () => {
  test('surfaces BAD_GATEWAY when the gateway returns an error', async () => {
    sendSmsMock.mockResolvedValue({ error: 'insufficient balance', ok: false })
    await expect(caller.send({ phone: PHONE })).rejects.toMatchObject({
      code: 'BAD_GATEWAY',
      message: 'smsSendFailed',
    })
  })

  test('surfaces BAD_GATEWAY when the gateway call throws', async () => {
    sendSmsMock.mockRejectedValue(new Error('network down'))
    await expect(caller.send({ phone: PHONE })).rejects.toMatchObject({
      code: 'BAD_GATEWAY',
    })
  })

  test('fails with BAD_GATEWAY without calling the gateway when credentials are missing', async () => {
    vi.stubEnv('SMSC_LOGIN', '')
    await expect(caller.send({ phone: PHONE })).rejects.toMatchObject({
      code: 'BAD_GATEWAY',
    })
    expect(sendSmsMock).not.toHaveBeenCalled()
  })

  test('a failed delivery with no prior record leaves a throttle marker but no live code', async () => {
    sendSmsMock.mockRejectedValue(new Error('network down'))
    await expect(caller.send({ phone: PHONE })).rejects.toMatchObject({
      code: 'BAD_GATEWAY',
    })

    expect(storedOtp()).toMatchObject({
      codeHash: '',
      expiresAt: 0,
      lastSentAt: Date.now(),
      sendCount: 0,
    })
  })

  test('a repeated failing send is throttled within the interval, so it cannot drain the SMS budget', async () => {
    sendSmsMock.mockRejectedValue(new Error('network down'))
    await expect(caller.send({ phone: PHONE })).rejects.toMatchObject({
      code: 'BAD_GATEWAY',
    })
    await expect(caller.send({ phone: PHONE })).rejects.toMatchObject({
      code: 'TOO_MANY_REQUESTS',
    })
    expect(sendSmsMock).toHaveBeenCalledTimes(1)
  })

  test('a failed delivery keeps the previous record and its rate-limit slot, only refreshing the throttle', async () => {
    const now = Date.now()
    seedOtp({
      lastSentAt: now - 2 * MINUTE,
      sendCount: 2,
      windowStart: now - 10 * MINUTE,
    })
    const previous = { ...storedOtp() }
    sendSmsMock.mockResolvedValue({ error: 'insufficient balance', ok: false })

    await expect(caller.send({ phone: PHONE })).rejects.toMatchObject({
      code: 'BAD_GATEWAY',
    })

    expect(storedOtp()).toEqual({ ...previous, lastSentAt: now })
  })
})

describe('otp.send — per-phone rate limiting (error-states 6)', () => {
  test('rejects a second send within the 60-second interval and sends no new code', async () => {
    seedOtp({ lastSentAt: Date.now(), sendCount: 1 })
    const previous = storedOtp()
    await expect(caller.send({ phone: PHONE })).rejects.toMatchObject({
      code: 'TOO_MANY_REQUESTS',
      message: 'tooManyRequests',
    })
    expect(sendSmsMock).not.toHaveBeenCalled()
    expect(storedOtp()).toEqual(previous)
  })

  test('rejects once five sends have been made within the rolling hour', async () => {
    const now = Date.now()
    seedOtp({
      lastSentAt: now - 2 * MINUTE,
      sendCount: 5,
      windowStart: now - 30 * MINUTE,
    })
    await expect(caller.send({ phone: PHONE })).rejects.toMatchObject({
      code: 'TOO_MANY_REQUESTS',
    })
    expect(sendSmsMock).not.toHaveBeenCalled()
  })
})

describe('otp.send — recovery after the rate limit (edge-cases 9)', () => {
  test('accepts a new send once the 60-second interval has elapsed and replaces the stored hash', async () => {
    const now = Date.now()
    const previousHash = hashCode('seed-salt', '654321')
    seedOtp({
      lastSentAt: now - MINUTE - 1000,
      sendCount: 1,
      windowStart: now - MINUTE - 1000,
    })
    await expect(caller.send({ phone: PHONE })).resolves.toEqual({ ok: true })

    expect(storedOtp()?.sendCount).toBe(2)
    expect(storedOtp()?.codeHash).not.toBe(previousHash)
    expect(sendSmsMock).toHaveBeenCalledTimes(1)
  })

  test('resets the hourly count once the window has elapsed, so a phone is never locked out permanently', async () => {
    const now = Date.now()
    seedOtp({
      lastSentAt: now - HOUR - MINUTE,
      sendCount: 5,
      windowStart: now - HOUR - MINUTE,
    })
    await expect(caller.send({ phone: PHONE })).resolves.toEqual({ ok: true })

    expect(storedOtp()?.sendCount).toBe(1)
    expect(storedOtp()?.windowStart).toBe(now)
  })
})

describe('otp.send — e2e test-code bypass', () => {
  test('stores the fixed test code and skips the live gateway when test mode is on', async () => {
    vi.stubEnv('OTP_TEST_MODE', 'true')
    await expect(caller.send({ phone: TEST_PHONE })).resolves.toEqual({
      ok: true,
    })

    const stored = storedOtp(TEST_PHONE)
    expect(stored?.codeHash).toBe(hashCode(stored?.salt ?? '', '123456'))
    expect(sendSmsMock).not.toHaveBeenCalled()
  })

  test('still sends live SMS for a non-test phone while test mode is on', async () => {
    vi.stubEnv('OTP_TEST_MODE', 'true')
    await caller.send({ phone: PHONE })
    expect(sendSmsMock).toHaveBeenCalledTimes(1)
  })
})

describe('otp.verify — correct code mints a custom token (happy-path 8)', () => {
  test('returns the custom token, reuses the existing user, and deletes the record', async () => {
    seedOtp({ codeHash: hashCode('s', '654321'), salt: 's' })
    await expect(
      caller.verify({ code: '654321', phone: PHONE }),
    ).resolves.toEqual({ token: 'custom-token' })

    expect(auth.getUserByPhoneNumber).toHaveBeenCalledWith(PHONE)
    expect(auth.createUser).not.toHaveBeenCalled()
    expect(auth.createCustomToken).toHaveBeenCalledWith('existing-uid')
    expect(deleteOtpMock).toHaveBeenCalledWith(PHONE)
  })

  test('creates a user record for a returning phone that has none yet (edge-cases 8)', async () => {
    auth.getUserByPhoneNumber.mockRejectedValue(new Error('user not found'))
    seedOtp({ codeHash: hashCode('s', '654321'), salt: 's' })

    await expect(
      caller.verify({ code: '654321', phone: PHONE }),
    ).resolves.toEqual({ token: 'custom-token' })

    expect(auth.createUser).toHaveBeenCalledWith({ phoneNumber: PHONE })
    expect(auth.createCustomToken).toHaveBeenCalledWith('new-uid')
  })

  test('keeps the record when token minting fails, so a retry is still possible', async () => {
    auth.createCustomToken.mockRejectedValue(new Error('auth unavailable'))
    seedOtp({ codeHash: hashCode('s', '654321'), salt: 's' })

    await expect(
      caller.verify({ code: '654321', phone: PHONE }),
    ).rejects.toThrow()

    expect(deleteOtpMock).not.toHaveBeenCalled()
    expect(storedOtp()).toBeDefined()
  })
})

describe('otp.verify — wrong or missing code (error-states 5)', () => {
  test('rejects an absent record as an invalid code', async () => {
    await expect(
      caller.verify({ code: '654321', phone: PHONE }),
    ).rejects.toMatchObject({ code: 'BAD_REQUEST', message: 'invalidCode' })
    expect(auth.createCustomToken).not.toHaveBeenCalled()
  })

  test('rejects a wrong code, increments the attempt count, and mints no token', async () => {
    seedOtp({ attemptCount: 1, codeHash: hashCode('s', '654321'), salt: 's' })
    await expect(
      caller.verify({ code: '000000', phone: PHONE }),
    ).rejects.toMatchObject({ code: 'BAD_REQUEST' })

    expect(verifyAttemptMock).toHaveBeenCalledTimes(1)
    expect(storedOtp()?.attemptCount).toBe(2)
    expect(auth.createCustomToken).not.toHaveBeenCalled()
  })
})

describe('otp.verify — expired or exhausted code (error-states 5)', () => {
  test('rejects an expired code and mints no token', async () => {
    seedOtp({
      codeHash: hashCode('s', '654321'),
      expiresAt: Date.now() - 1,
      salt: 's',
    })
    await expect(
      caller.verify({ code: '654321', phone: PHONE }),
    ).rejects.toMatchObject({ code: 'BAD_REQUEST' })
    expect(auth.createCustomToken).not.toHaveBeenCalled()
  })

  test('invalidates the record once the fifth attempt is reached', async () => {
    seedOtp({ attemptCount: 5, codeHash: hashCode('s', '654321'), salt: 's' })
    await expect(
      caller.verify({ code: '654321', phone: PHONE }),
    ).rejects.toMatchObject({ code: 'BAD_REQUEST' })

    expect(storedOtp()).toBeUndefined()
    expect(auth.createCustomToken).not.toHaveBeenCalled()
  })

  test('a wrong code on the final allowed attempt invalidates the record instead of persisting the count', async () => {
    seedOtp({ attemptCount: 4, codeHash: hashCode('s', '654321'), salt: 's' })
    await expect(
      caller.verify({ code: '000000', phone: PHONE }),
    ).rejects.toMatchObject({ code: 'BAD_REQUEST' })

    expect(storedOtp()).toBeUndefined()
  })
})
