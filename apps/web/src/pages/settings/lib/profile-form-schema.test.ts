import type { ResidentProfile } from '@raiymbek-park/api'

import { describe, expect, test } from 'vitest'

import { profileFormSchema, toFormValues } from './profile-form-schema'

const baseProfile: ResidentProfile = {
  apartment: 42,
  avatarUrl: null,
  block: 1,
  cars: [],
  id: 'resident-uid',
  isPhoneVisible: false,
  isRegistered: true,
  name: 'Алиса',
  phone: '+77071234567',
  role: 'owner',
}

const validValues = {
  apartment: 42,
  block: 1 as const,
  cars: [] as string[],
  isPhoneVisible: false,
  isRegistered: true,
  name: 'Алиса',
  role: 'owner' as const,
}

describe('toFormValues — an apartment of 0 (no stored value) is presented as an empty field', () => {
  test('apartment 0 maps to NaN so the field renders empty instead of "0"', () => {
    expect(toFormValues({ ...baseProfile, apartment: 0 }).apartment).toBe(
      Number.NaN,
    )
  })

  test('a stored positive apartment is passed through unchanged', () => {
    expect(toFormValues({ ...baseProfile, apartment: 42 }).apartment).toBe(42)
  })
})

describe('profileFormSchema — block is required', () => {
  test('a null block produces a "Выберите блок" issue on the block field', () => {
    const result = profileFormSchema.safeParse({ ...validValues, block: null })
    expect(result.success).toBe(false)
    expect(result.success ? [] : result.error.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ message: 'Выберите блок', path: ['block'] }),
      ]),
    )
  })
})

describe('profileFormSchema — plate count vs. empty rows', () => {
  test('an empty row alongside exactly 3 filled plates is valid (empty rows do not count toward the limit)', () => {
    expect(
      profileFormSchema.safeParse({
        ...validValues,
        cars: ['A123BC01', 'B123CD02', 'C123DE03', ''],
      }).success,
    ).toBe(true)
  })

  test('4 non-empty plates exceed the limit and produce a "Можно добавить не более 3 номеров" issue', () => {
    const result = profileFormSchema.safeParse({
      ...validValues,
      cars: ['A123BC01', 'B123CD02', 'C123DE03', 'D123EF04'],
    })
    expect(result.success).toBe(false)
    expect(result.success ? [] : result.error.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          message: 'Можно добавить не более 3 номеров',
          path: ['cars'],
        }),
      ]),
    )
  })
})
