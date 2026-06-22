import { describe, expect, test } from 'vitest'

import {
  isApartmentInBlock,
  nameSchema,
  normalizePhone,
  phoneDigits,
  refreshInputSchema,
  registerInputSchema,
  sendInputSchema,
  verifyInputSchema,
} from './contract'

const validResident = {
  apartment: 42,
  block: 1,
  name: 'Иван Петров',
  phone: '+77071234567',
  role: 'owner',
}

test('send — +7XXXXXXXXXX passes through normalized', () => {
  expect(sendInputSchema.parse({ phone: '+77071234567' })).toEqual({
    phone: '+77071234567',
  })
})

test('send — 8XXXXXXXXXX is normalized to +7XXXXXXXXXX', () => {
  expect(sendInputSchema.parse({ phone: '87071234567' })).toEqual({
    phone: '+77071234567',
  })
})

test('send — spaces and dashes are stripped', () => {
  expect(sendInputSchema.parse({ phone: '+7 707 123-45-67' })).toEqual({
    phone: '+77071234567',
  })
})

test('send — 10 local digits without country code are valid (unified client rule)', () => {
  expect(sendInputSchema.parse({ phone: '9161234567' })).toEqual({
    phone: '+79161234567',
  })
})

test('send — too short / missing / non-string phone is invalid', () => {
  expect(sendInputSchema.safeParse({ phone: '+7123' }).success).toBe(false)
  expect(sendInputSchema.safeParse({}).success).toBe(false)
  expect(sendInputSchema.safeParse({ phone: 42 }).success).toBe(false)
})

test('verify — 4-digit code and normalized phone are accepted', () => {
  expect(
    verifyInputSchema.parse({ code: '1234', phone: '+77071234567' }),
  ).toEqual({ code: '1234', phone: '+77071234567' })
})

test('verify — non-4-digit or missing code is invalid', () => {
  expect(
    verifyInputSchema.safeParse({ code: 'abcd', phone: '+77071234567' })
      .success,
  ).toBe(false)
  expect(
    verifyInputSchema.safeParse({ code: '123', phone: '+77071234567' }).success,
  ).toBe(false)
  expect(
    verifyInputSchema.safeParse({ code: '12345', phone: '+77071234567' })
      .success,
  ).toBe(false)
  expect(verifyInputSchema.safeParse({ phone: '+77071234567' }).success).toBe(
    false,
  )
})

test('register — valid strict resident is accepted', () => {
  expect(registerInputSchema.parse(validResident)).toEqual(validResident)
})

test('register — apartment as numeric string is coerced to number', () => {
  expect(
    registerInputSchema.parse({ ...validResident, apartment: '42' }).apartment,
  ).toBe(42)
})

test('register — apartment 0 or negative is invalid', () => {
  expect(
    registerInputSchema.safeParse({ ...validResident, apartment: 0 }).success,
  ).toBe(false)
  expect(
    registerInputSchema.safeParse({ ...validResident, apartment: -1 }).success,
  ).toBe(false)
})

test('register — missing or too-short name is invalid', () => {
  const { name: _name, ...rest } = validResident
  expect(registerInputSchema.safeParse(rest).success).toBe(false)
  expect(
    registerInputSchema.safeParse({ ...validResident, name: 'A' }).success,
  ).toBe(false)
})

test('register — block outside 1..4 is invalid (now strict)', () => {
  expect(
    registerInputSchema.safeParse({ ...validResident, block: 'A' }).success,
  ).toBe(false)
})

test('register — role outside owner/tenant is invalid (now strict)', () => {
  expect(
    registerInputSchema.safeParse({ ...validResident, role: 'resident' })
      .success,
  ).toBe(false)
})

test('register — apartment outside the block range is invalid (now strict)', () => {
  expect(
    registerInputSchema.safeParse({
      ...validResident,
      block: 1,
      apartment: 71,
    }).success,
  ).toBe(false)
  expect(
    registerInputSchema.safeParse({
      ...validResident,
      block: 2,
      apartment: 139,
    }).success,
  ).toBe(true)
})

test('refresh — valid token is accepted', () => {
  expect(refreshInputSchema.parse({ refreshToken: 'some-uuid-token' })).toEqual(
    {
      refreshToken: 'some-uuid-token',
    },
  )
})

test('refresh — missing or empty token is invalid', () => {
  expect(refreshInputSchema.safeParse({}).success).toBe(false)
  expect(refreshInputSchema.safeParse({ refreshToken: '' }).success).toBe(false)
})

describe('phoneDigits — extracts the 10 local digits', () => {
  test('strips formatting and keeps the 10 local digits', () => {
    expect(phoneDigits('+7 707 123-45-67')).toBe('7071234567')
  })

  test('drops a single leading 7 country digit', () => {
    expect(phoneDigits('77071234567')).toBe('7071234567')
  })

  test('drops a single leading 8 trunk digit', () => {
    expect(phoneDigits('87071234567')).toBe('7071234567')
  })

  test('10 local digits with no country/trunk prefix pass through', () => {
    expect(phoneDigits('9161234567')).toBe('9161234567')
  })

  test('caps at 10 digits, ignoring extra trailing digits', () => {
    expect(phoneDigits('770712345678901')).toBe('7071234567')
  })
})

describe('normalizePhone — canonical +7XXXXXXXXXX form', () => {
  test('8-prefixed number becomes +7 form', () => {
    expect(normalizePhone('87071234567')).toBe('+77071234567')
  })

  test('already +7 number stays the same', () => {
    expect(normalizePhone('+77071234567')).toBe('+77071234567')
  })

  test('bare 10 local digits gain the +7 prefix', () => {
    expect(normalizePhone('9161234567')).toBe('+79161234567')
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

describe('nameSchema — length 2..60 with trimming (validation S2/S10/S11)', () => {
  test('a 2-character name (lower boundary) is accepted', () => {
    expect(nameSchema.safeParse('Ан').success).toBe(true)
  })

  test('a 1-character name (below the lower boundary) is rejected', () => {
    expect(nameSchema.safeParse('А').success).toBe(false)
  })

  test('a 60-character name (upper boundary) is accepted', () => {
    expect(nameSchema.safeParse('я'.repeat(60)).success).toBe(true)
  })

  test('a 61-character name (above the upper boundary) is rejected', () => {
    expect(nameSchema.safeParse('я'.repeat(61)).success).toBe(false)
  })

  test('a whitespace-only name is rejected once trimmed (validation S12)', () => {
    expect(nameSchema.safeParse('   ').success).toBe(false)
  })
})
