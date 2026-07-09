import { beforeEach, describe, expect, test, vi } from 'vitest'

const state = vi.hoisted(() => ({ data: {} as Record<string, unknown> }))

vi.mock('../firestore', () => ({
  getDb: () => ({
    collection: () => ({
      doc: () => ({ get: () => Promise.resolve({ data: () => state.data }) }),
    }),
  }),
}))

const { getResident } = await import('./resident-store')

beforeEach(() => {
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
    state.data.cars = 'not-an-array'
    await expect(getResident('uid-1')).resolves.toMatchObject({ cars: [] })
  })

  test('non-string entries inside a legacy cars array are filtered out', async () => {
    state.data.cars = ['A123BC01', 42, null]
    await expect(getResident('uid-1')).resolves.toMatchObject({
      cars: ['A123BC01'],
    })
  })

  test('a stored profile with the new fields present is read back unchanged', async () => {
    state.data.avatarUrl = 'https://cdn.test/avatar.jpg'
    state.data.cars = ['A123BC01']
    state.data.isPhoneVisible = true
    await expect(getResident('uid-1')).resolves.toMatchObject({
      avatarUrl: 'https://cdn.test/avatar.jpg',
      cars: ['A123BC01'],
      isPhoneVisible: true,
    })
  })
})
