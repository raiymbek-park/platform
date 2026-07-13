import type { OtpRecord, ReserveSendInput } from './otp-store'

import { beforeEach, describe, expect, test, vi } from 'vitest'

const state = vi.hoisted(() => ({
  data: undefined as Record<string, unknown> | undefined,
}))

const collectionSpy = vi.hoisted(() => vi.fn())
const docSpy = vi.hoisted(() => vi.fn())
const setSpy = vi.hoisted(() => vi.fn())
const deleteSpy = vi.hoisted(() => vi.fn())
const runTransactionSpy = vi.hoisted(() => vi.fn())
const txSetSpy = vi.hoisted(() => vi.fn())
const txUpdateSpy = vi.hoisted(() => vi.fn())
const txDeleteSpy = vi.hoisted(() => vi.fn())

vi.mock('../firestore', () => {
  const transaction = {
    delete: (_ref: unknown) => txDeleteSpy(),
    get: () => Promise.resolve({ data: () => state.data }),
    set: (_ref: unknown, record: Record<string, unknown>) => txSetSpy(record),
    update: (_ref: unknown, data: Record<string, unknown>) => txUpdateSpy(data),
  }
  const ref = {
    delete: deleteSpy,
    get: () => Promise.resolve({ data: () => state.data }),
    set: setSpy,
  }
  return {
    getDb: () => ({
      collection: (name: string) => {
        collectionSpy(name)
        return {
          doc: (id: string) => {
            docSpy(id)
            return ref
          },
        }
      },
      runTransaction: (run: (tx: typeof transaction) => Promise<unknown>) => {
        runTransactionSpy()
        return run(transaction)
      },
    }),
  }
})

const { deleteOtp, reserveSend, upsertOtp, verifyAttempt } = await import(
  './otp-store'
)

const PHONE = '+77052266666'
const MINUTE = 60 * 1000
const HOUR = 60 * MINUTE
const NOW = 100 * HOUR

const record: OtpRecord = {
  attemptCount: 0,
  codeHash: 'a'.repeat(64),
  createdAt: NOW - 2 * MINUTE,
  expiresAt: NOW + 3 * MINUTE,
  lastSentAt: NOW - 2 * MINUTE,
  salt: 'b'.repeat(32),
  sendCount: 2,
  windowStart: NOW - 10 * MINUTE,
}

const sendInput: ReserveSendInput = {
  codeHash: 'c'.repeat(64),
  now: NOW,
  phone: PHONE,
  rules: { intervalMs: MINUTE, sendsPerWindow: 5, windowMs: HOUR },
  salt: 'd'.repeat(32),
  ttlMs: 5 * MINUTE,
}

const verifyInput = (isMatch: (otp: OtpRecord) => boolean) => ({
  isMatch,
  maxAttempts: 5,
  now: NOW,
  phone: PHONE,
})

beforeEach(() => {
  state.data = { ...record }
  collectionSpy.mockClear()
  docSpy.mockClear()
  setSpy.mockClear()
  deleteSpy.mockClear()
  runTransactionSpy.mockClear()
  txSetSpy.mockClear()
  txUpdateSpy.mockClear()
  txDeleteSpy.mockClear()
})

describe('otp-store — addressing the otps collection', () => {
  test('reads and writes under otps/{phone} inside one transaction', async () => {
    await reserveSend(sendInput)
    expect(runTransactionSpy).toHaveBeenCalledTimes(1)
    expect(collectionSpy).toHaveBeenCalledWith('otps')
    expect(docSpy).toHaveBeenCalledWith(PHONE)
  })
})

describe('reserveSend — atomic rate-limited code reservation', () => {
  test('writes the first record and returns a null previous when none exists', async () => {
    state.data = undefined
    await expect(reserveSend(sendInput)).resolves.toEqual({
      isBlocked: false,
      previous: null,
    })
    expect(txSetSpy).toHaveBeenCalledWith({
      attemptCount: 0,
      codeHash: 'c'.repeat(64),
      createdAt: NOW,
      expiresAt: NOW + 5 * MINUTE,
      lastSentAt: NOW,
      salt: 'd'.repeat(32),
      sendCount: 1,
      windowStart: NOW,
    })
  })

  test('blocks a send inside the 60-second interval without writing', async () => {
    state.data = { ...record, lastSentAt: NOW - 59 * 1000 }
    await expect(reserveSend(sendInput)).resolves.toEqual({ isBlocked: true })
    expect(txSetSpy).not.toHaveBeenCalled()
  })

  test('blocks the sixth send within the rolling hour without writing', async () => {
    state.data = { ...record, sendCount: 5 }
    await expect(reserveSend(sendInput)).resolves.toEqual({ isBlocked: true })
    expect(txSetSpy).not.toHaveBeenCalled()
  })

  test('carries the active window forward, increments the count, and returns the previous record', async () => {
    await expect(reserveSend(sendInput)).resolves.toEqual({
      isBlocked: false,
      previous: record,
    })
    expect(txSetSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        sendCount: 3,
        windowStart: record.windowStart,
      }),
    )
  })

  test('resets the window and count once the rolling hour has elapsed', async () => {
    state.data = {
      ...record,
      lastSentAt: NOW - HOUR - MINUTE,
      sendCount: 5,
      windowStart: NOW - HOUR - MINUTE,
    }
    await expect(reserveSend(sendInput)).resolves.toMatchObject({
      isBlocked: false,
    })
    expect(txSetSpy).toHaveBeenCalledWith(
      expect.objectContaining({ sendCount: 1, windowStart: NOW }),
    )
  })

  test('defaults missing or wrongly-typed fields defensively when parsing the previous record', async () => {
    state.data = { codeHash: 42, sendCount: 'nope' }
    await expect(reserveSend(sendInput)).resolves.toEqual({
      isBlocked: false,
      previous: {
        attemptCount: 0,
        codeHash: '',
        createdAt: 0,
        expiresAt: 0,
        lastSentAt: 0,
        salt: '',
        sendCount: 0,
        windowStart: 0,
      },
    })
  })
})

describe('verifyAttempt — atomic attempt accounting', () => {
  test('returns invalid when no record exists', async () => {
    state.data = undefined
    await expect(verifyAttempt(verifyInput(() => true))).resolves.toBe(
      'invalid',
    )
    expect(txDeleteSpy).not.toHaveBeenCalled()
    expect(txUpdateSpy).not.toHaveBeenCalled()
  })

  test('returns invalid for an expired record without touching it', async () => {
    state.data = { ...record, expiresAt: NOW - 1 }
    await expect(verifyAttempt(verifyInput(() => true))).resolves.toBe(
      'invalid',
    )
    expect(txDeleteSpy).not.toHaveBeenCalled()
    expect(txUpdateSpy).not.toHaveBeenCalled()
  })

  test('deletes a record that has already reached the attempt cap', async () => {
    state.data = { ...record, attemptCount: 5 }
    await expect(verifyAttempt(verifyInput(() => true))).resolves.toBe(
      'invalid',
    )
    expect(txDeleteSpy).toHaveBeenCalledTimes(1)
  })

  test('increments the attempt count in the same transaction on a wrong code', async () => {
    state.data = { ...record, attemptCount: 1 }
    await expect(verifyAttempt(verifyInput(() => false))).resolves.toBe(
      'invalid',
    )
    expect(runTransactionSpy).toHaveBeenCalledTimes(1)
    expect(txUpdateSpy).toHaveBeenCalledWith({ attemptCount: 2 })
    expect(txDeleteSpy).not.toHaveBeenCalled()
  })

  test('deletes the record when a wrong code lands on the final allowed attempt', async () => {
    state.data = { ...record, attemptCount: 4 }
    await expect(verifyAttempt(verifyInput(() => false))).resolves.toBe(
      'invalid',
    )
    expect(txDeleteSpy).toHaveBeenCalledTimes(1)
    expect(txUpdateSpy).not.toHaveBeenCalled()
  })

  test('passes the parsed record to the match predicate and returns ok without deleting', async () => {
    const isMatch = vi.fn(() => true)
    await expect(verifyAttempt(verifyInput(isMatch))).resolves.toBe('ok')
    expect(isMatch).toHaveBeenCalledWith(record)
    expect(txDeleteSpy).not.toHaveBeenCalled()
    expect(txUpdateSpy).not.toHaveBeenCalled()
  })
})

describe('upsertOtp — restoring or storing a record outside a transaction', () => {
  test('writes the whole record as a full document set', async () => {
    await upsertOtp(PHONE, record)
    expect(setSpy).toHaveBeenCalledWith(record)
  })
})

describe('deleteOtp — invalidating a record', () => {
  test('deletes the document', async () => {
    await deleteOtp(PHONE)
    expect(deleteSpy).toHaveBeenCalledTimes(1)
  })
})
