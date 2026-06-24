import { describe, expect, test } from 'vitest'

import {
  isApartmentInBlock,
  nameSchema,
  normalizePhone,
  phoneSchema,
  registerInputSchema,
} from './contract'

const validResident = {
  apartment: 42,
  block: 1,
  name: 'Иван Петров',
  phone: '+77071234567',
  role: 'owner',
}

describe('normalizePhone — canonical E.164 form', () => {
  test('Kazakhstan 8-prefix number is stored in +7 E.164 form', () => {
    expect(normalizePhone('87052266666')).toBe('+77052266666')
  })

  test('formatted 8-prefix number becomes +7 E.164 form', () => {
    expect(normalizePhone('8 (705) 226-66-66')).toBe('+77052266666')
  })

  test('formatted +7 number is stored in canonical E.164 form', () => {
    expect(normalizePhone('+7 (707) 123-45-67')).toBe('+77071234567')
  })

  test('explicit international +1 number is stored in its E.164 form', () => {
    expect(normalizePhone('+1 (415) 555-2671')).toBe('+14155552671')
  })

  test('explicit international +44 number is stored in its E.164 form', () => {
    expect(normalizePhone('+44 20 7946 0958')).toBe('+442079460958')
  })

  test('already-normalized +7 number is unchanged', () => {
    expect(normalizePhone('+77071234567')).toBe('+77071234567')
  })

  test('an explicit +8X international number is not rewritten to +7', () => {
    expect(normalizePhone('+81234567890')).toBe('+81234567890')
  })
})

describe('phoneSchema — validates the dialled number', () => {
  test('accepts a +7 Kazakhstan mobile number', () => {
    expect(phoneSchema.safeParse('+77052266666').success).toBe(true)
  })

  test('accepts a Kazakhstan 8-prefix number', () => {
    expect(phoneSchema.safeParse('87052266666').success).toBe(true)
  })

  test('accepts a valid international number with explicit country code', () => {
    expect(phoneSchema.safeParse('+14155552671').success).toBe(true)
  })

  test('rejects a too-short number', () => {
    expect(phoneSchema.safeParse('+7705').success).toBe(false)
  })

  test('rejects a too-long number', () => {
    expect(phoneSchema.safeParse('8705226666666').success).toBe(false)
  })

  test('rejects a bare digits string with no country prefix', () => {
    expect(phoneSchema.safeParse('12345').success).toBe(false)
  })
})

describe('isApartmentInBlock — apartment ranges per block', () => {
  test('block 1 covers 1..70 inclusive; 0 and 71 fall outside', () => {
    expect(isApartmentInBlock(1, 1)).toBe(true)
    expect(isApartmentInBlock(1, 70)).toBe(true)
    expect(isApartmentInBlock(1, 0)).toBe(false)
    expect(isApartmentInBlock(1, 71)).toBe(false)
  })

  test('block 2 covers 71..139 inclusive; 70 and 140 fall outside', () => {
    expect(isApartmentInBlock(2, 71)).toBe(true)
    expect(isApartmentInBlock(2, 139)).toBe(true)
    expect(isApartmentInBlock(2, 70)).toBe(false)
    expect(isApartmentInBlock(2, 140)).toBe(false)
  })

  test('block 3 covers 1..63 inclusive; 0 and 64 fall outside', () => {
    expect(isApartmentInBlock(3, 1)).toBe(true)
    expect(isApartmentInBlock(3, 63)).toBe(true)
    expect(isApartmentInBlock(3, 0)).toBe(false)
    expect(isApartmentInBlock(3, 64)).toBe(false)
  })

  test('block 4 covers 64..126 inclusive; 63 and 127 fall outside', () => {
    expect(isApartmentInBlock(4, 64)).toBe(true)
    expect(isApartmentInBlock(4, 126)).toBe(true)
    expect(isApartmentInBlock(4, 63)).toBe(false)
    expect(isApartmentInBlock(4, 127)).toBe(false)
  })
})

describe('nameSchema — length 2..60 after trimming', () => {
  test('a 2-character name (lower boundary) is valid', () => {
    expect(nameSchema.safeParse('Ан').success).toBe(true)
  })

  test('a 1-character name (below lower boundary) is invalid', () => {
    expect(nameSchema.safeParse('А').success).toBe(false)
  })

  test('a 60-character name (upper boundary) is valid', () => {
    expect(nameSchema.safeParse('я'.repeat(60)).success).toBe(true)
  })

  test('a 61-character name (above upper boundary) is invalid', () => {
    expect(nameSchema.safeParse('я'.repeat(61)).success).toBe(false)
  })

  test('a whitespace-only name is invalid after trimming', () => {
    expect(nameSchema.safeParse('   ').success).toBe(false)
  })
})

describe('registerInputSchema — input validation', () => {
  test('a fully valid resident is accepted and the phone is normalized to E.164', () => {
    expect(registerInputSchema.parse(validResident)).toEqual(validResident)
  })

  test('apartment supplied as a numeric string is coerced to a number', () => {
    expect(
      registerInputSchema.parse({ ...validResident, apartment: '42' })
        .apartment,
    ).toBe(42)
  })

  test('a missing name is invalid', () => {
    const { name: _name, ...rest } = validResident
    expect(registerInputSchema.safeParse(rest).success).toBe(false)
  })

  test('a name shorter than 2 characters is invalid', () => {
    expect(
      registerInputSchema.safeParse({ ...validResident, name: 'A' }).success,
    ).toBe(false)
  })

  test('a block value outside 1..4 is invalid', () => {
    expect(
      registerInputSchema.safeParse({ ...validResident, block: 5 }).success,
    ).toBe(false)
  })

  test('a non-numeric block value is invalid', () => {
    expect(
      registerInputSchema.safeParse({ ...validResident, block: 'A' }).success,
    ).toBe(false)
  })

  test('a role outside owner/tenant is invalid', () => {
    expect(
      registerInputSchema.safeParse({ ...validResident, role: 'resident' })
        .success,
    ).toBe(false)
  })

  test('apartment at the upper boundary of block 1 (70) is valid', () => {
    expect(
      registerInputSchema.safeParse({
        ...validResident,
        block: 1,
        apartment: 70,
      }).success,
    ).toBe(true)
  })

  test('apartment one above the upper boundary of block 1 (71) is invalid', () => {
    expect(
      registerInputSchema.safeParse({
        ...validResident,
        block: 1,
        apartment: 71,
      }).success,
    ).toBe(false)
  })

  test('apartment at the upper boundary of block 2 (139) is valid', () => {
    expect(
      registerInputSchema.safeParse({
        ...validResident,
        block: 2,
        apartment: 139,
      }).success,
    ).toBe(true)
  })

  test('apartment at the lower boundary of block 2 (71) is valid', () => {
    expect(
      registerInputSchema.safeParse({
        ...validResident,
        block: 2,
        apartment: 71,
      }).success,
    ).toBe(true)
  })

  test('apartment one above the upper boundary of block 2 (140) is invalid', () => {
    expect(
      registerInputSchema.safeParse({
        ...validResident,
        block: 2,
        apartment: 140,
      }).success,
    ).toBe(false)
  })

  test('apartment 0 or negative is invalid regardless of block', () => {
    expect(
      registerInputSchema.safeParse({ ...validResident, apartment: 0 }).success,
    ).toBe(false)
    expect(
      registerInputSchema.safeParse({ ...validResident, apartment: -1 })
        .success,
    ).toBe(false)
  })
})
