import type { Resident } from './resident-store'

import { beforeEach, describe, expect, test, vi } from 'vitest'

const state = vi.hoisted(() => ({
  data: {} as Record<string, unknown> | undefined,
}))

const txSetSpy = vi.hoisted(() => vi.fn())

vi.mock('../firestore', () => {
  const ref = { get: () => Promise.resolve({ data: () => state.data }) }
  const transaction = {
    get: () => Promise.resolve({ data: () => state.data }),
    set: (_ref: unknown, record: Record<string, unknown>) => txSetSpy(record),
  }
  return {
    getDb: () => ({
      collection: () => ({ doc: () => ref }),
      runTransaction: (run: (tx: typeof transaction) => Promise<unknown>) =>
        run(transaction),
    }),
  }
})

const { createResidentIfAbsent, getResident } = await import('./resident-store')

beforeEach(() => {
  txSetSpy.mockClear()
  state.data = {
    apartment: 42,
    block: 1,
    name: 'Иван Петров',
    phone: '+77071234567',
    role: 'owner',
  }
})

describe('getResident — edge-cases 1: legacy documents default missing profile fields', () => {
  test('a legacy doc without avatarUrl, cars, or isPhoneVisible defaults them to null, [], and false', async () => {
    await expect(getResident('uid-1')).resolves.toEqual({
      apartment: 42,
      avatarUrl: null,
      block: 1,
      cars: [],
      isPhoneVisible: false,
      name: 'Иван Петров',
      phone: '+77071234567',
      role: 'owner',
    })
  })

  test('a non-array cars field is discarded in favor of an empty array', async () => {
    state.data = { ...state.data, cars: 'not-an-array' }
    await expect(getResident('uid-1')).resolves.toMatchObject({ cars: [] })
  })

  test('non-string entries inside a legacy cars array are filtered out', async () => {
    state.data = { ...state.data, cars: ['A123BC01', 42, null] }
    await expect(getResident('uid-1')).resolves.toMatchObject({
      cars: ['A123BC01'],
    })
  })

  test('a stored profile with the new fields present is read back unchanged', async () => {
    state.data = {
      ...state.data,
      avatarUrl: 'https://cdn.test/avatar.jpg',
      cars: ['A123BC01'],
      isPhoneVisible: true,
    }
    await expect(getResident('uid-1')).resolves.toMatchObject({
      avatarUrl: 'https://cdn.test/avatar.jpg',
      cars: ['A123BC01'],
      isPhoneVisible: true,
    })
  })
})

describe('createResidentIfAbsent — atomic one-record-per-identity write', () => {
  const input: Resident = {
    apartment: 42,
    avatarUrl: null,
    block: 1,
    cars: [],
    isPhoneVisible: false,
    name: 'Иван Петров',
    phone: '+77071234567',
    role: 'owner',
  }

  test('writes and returns the input when no document exists for the uid', async () => {
    state.data = undefined
    await expect(createResidentIfAbsent('uid-1', input)).resolves.toEqual(input)
    expect(txSetSpy).toHaveBeenCalledWith(input)
  })

  test('returns the stored resident and writes nothing when a document already exists', async () => {
    state.data = {
      apartment: 60,
      avatarUrl: 'https://example/avatar.webp',
      block: 3,
      cars: ['A123BC'],
      isPhoneVisible: true,
      name: 'Султан',
      phone: '+77052266666',
      role: 'administration',
    }

    await expect(createResidentIfAbsent('uid-1', input)).resolves.toEqual(
      state.data,
    )
    expect(txSetSpy).not.toHaveBeenCalled()
  })
})
