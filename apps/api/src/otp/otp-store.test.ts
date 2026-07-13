import type { OtpRecord } from './otp-store'

import { beforeEach, describe, expect, test, vi } from 'vitest'

const state = vi.hoisted(() => ({
  data: undefined as Record<string, unknown> | undefined,
}))

const collectionSpy = vi.hoisted(() => vi.fn())
const docSpy = vi.hoisted(() => vi.fn())
const setSpy = vi.hoisted(() => vi.fn())
const deleteSpy = vi.hoisted(() => vi.fn())

vi.mock('../firestore', () => ({
  getDb: () => ({
    collection: (name: string) => {
      collectionSpy(name)
      return {
        doc: (id: string) => {
          docSpy(id)
          return {
            delete: deleteSpy,
            get: () => Promise.resolve({ data: () => state.data }),
            set: setSpy,
          }
        },
      }
    },
  }),
}))

const { deleteOtp, getOtp, saveAttemptCount, upsertOtp } = await import(
  './otp-store'
)

const record: OtpRecord = {
  attemptCount: 0,
  codeHash: 'a'.repeat(64),
  createdAt: 1_000,
  expiresAt: 301_000,
  lastSentAt: 1_000,
  salt: 'b'.repeat(32),
  sendCount: 1,
  windowStart: 1_000,
}

beforeEach(() => {
  state.data = { ...record }
  collectionSpy.mockClear()
  docSpy.mockClear()
  setSpy.mockClear()
  deleteSpy.mockClear()
})

describe('otp-store — addressing the otps collection', () => {
  test('reads and writes under otps/{phone}', async () => {
    await getOtp('+77052266666')
    expect(collectionSpy).toHaveBeenCalledWith('otps')
    expect(docSpy).toHaveBeenCalledWith('+77052266666')
  })
})

describe('getOtp — reading a stored record', () => {
  test('returns the parsed record when the document exists', async () => {
    await expect(getOtp('+77052266666')).resolves.toEqual(record)
  })

  test('returns null when no document exists', async () => {
    state.data = undefined
    await expect(getOtp('+77052266666')).resolves.toBeNull()
  })

  test('defaults every missing or wrongly-typed field defensively', async () => {
    state.data = { codeHash: 42, sendCount: 'nope' }
    await expect(getOtp('+77052266666')).resolves.toEqual({
      attemptCount: 0,
      codeHash: '',
      createdAt: 0,
      expiresAt: 0,
      lastSentAt: 0,
      salt: '',
      sendCount: 0,
      windowStart: 0,
    })
  })
})

describe('upsertOtp — storing a fresh code', () => {
  test('writes the whole record as a full document set', async () => {
    await upsertOtp('+77052266666', record)
    expect(setSpy).toHaveBeenCalledWith(record)
  })
})

describe('saveAttemptCount — persisting a failed attempt', () => {
  test('merges only the attemptCount, leaving the rest of the record intact', async () => {
    await saveAttemptCount('+77052266666', 3)
    expect(setSpy).toHaveBeenCalledWith({ attemptCount: 3 }, { merge: true })
  })
})

describe('deleteOtp — invalidating a record', () => {
  test('deletes the document', async () => {
    await deleteOtp('+77052266666')
    expect(deleteSpy).toHaveBeenCalledTimes(1)
  })
})
