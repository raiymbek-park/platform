import { TRPCError } from '@trpc/server'
import { describe, expect, it } from 'vitest'

import {
  parseRefreshInput,
  parseRegisterInput,
  parseSendInput,
  parseStatusInput,
  parseVerifyInput,
} from './validators'

const expectBadRequest = (fn: () => unknown) => {
  expect(fn).toThrow(TRPCError)
  try {
    fn()
  } catch (e) {
    if (e instanceof TRPCError) {
      expect(e.code).toBe('BAD_REQUEST')
    }
  }
}

describe('parseSendInput — phone normalization', () => {
  it('+7XXXXXXXXXX passes through normalized (happy S2 form entry)', () => {
    expect(parseSendInput({ phone: '+77071234567' })).toEqual({
      phone: '+77071234567',
    })
  })

  it('8XXXXXXXXXX form is normalized to +7XXXXXXXXXX', () => {
    expect(parseSendInput({ phone: '87071234567' })).toEqual({
      phone: '+77071234567',
    })
  })

  it('+7 with spaces/dashes is stripped and normalized', () => {
    expect(parseSendInput({ phone: '+7 707 123-45-67' })).toEqual({
      phone: '+77071234567',
    })
  })

  it('malformed phone (too short) throws BAD_REQUEST', () => {
    expectBadRequest(() => parseSendInput({ phone: '+7123' }))
  })

  it('missing phone field throws BAD_REQUEST', () => {
    expectBadRequest(() => parseSendInput({}))
  })

  it('non-object input throws BAD_REQUEST', () => {
    expectBadRequest(() => parseSendInput('not-an-object'))
  })

  it('phone starting with 9 (no country code) throws BAD_REQUEST', () => {
    expectBadRequest(() => parseSendInput({ phone: '9161234567' }))
  })
})

describe('parseStatusInput — phone normalization', () => {
  it('+7 form passes through (edge S9 status call)', () => {
    expect(parseStatusInput({ phone: '+77071234567' })).toEqual({
      phone: '+77071234567',
    })
  })

  it('8 prefix normalized to +7', () => {
    expect(parseStatusInput({ phone: '87071234567' })).toEqual({
      phone: '+77071234567',
    })
  })

  it('malformed phone throws BAD_REQUEST', () => {
    expectBadRequest(() => parseStatusInput({ phone: 'abc' }))
  })
})

describe('parseVerifyInput — code validation', () => {
  it('4-digit code and normalized phone are returned (happy S5)', () => {
    expect(parseVerifyInput({ code: '1234', phone: '+77071234567' })).toEqual({
      code: '1234',
      phone: '+77071234567',
    })
  })

  it('code with letters throws BAD_REQUEST', () => {
    expectBadRequest(() =>
      parseVerifyInput({ code: 'abcd', phone: '+77071234567' }),
    )
  })

  it('code shorter than 4 digits throws BAD_REQUEST', () => {
    expectBadRequest(() =>
      parseVerifyInput({ code: '123', phone: '+77071234567' }),
    )
  })

  it('code longer than 4 digits throws BAD_REQUEST', () => {
    expectBadRequest(() =>
      parseVerifyInput({ code: '12345', phone: '+77071234567' }),
    )
  })

  it('missing code field throws BAD_REQUEST', () => {
    expectBadRequest(() => parseVerifyInput({ phone: '+77071234567' }))
  })
})

describe('parseRegisterInput', () => {
  const validResident = {
    apartment: 42,
    block: 'A',
    name: 'Ivan Petrov',
    phone: '+77071234567',
    role: 'resident',
  }

  it('valid resident data is returned with normalized phone (happy S5)', () => {
    expect(parseRegisterInput(validResident)).toEqual(validResident)
  })

  it('apartment as numeric string is coerced to number', () => {
    const result = parseRegisterInput({ ...validResident, apartment: '42' })
    expect(result.apartment).toBe(42)
  })

  it('apartment 0 throws BAD_REQUEST (not a positive integer)', () => {
    expectBadRequest(() =>
      parseRegisterInput({ ...validResident, apartment: 0 }),
    )
  })

  it('negative apartment throws BAD_REQUEST', () => {
    expectBadRequest(() =>
      parseRegisterInput({ ...validResident, apartment: -1 }),
    )
  })

  it('missing name throws BAD_REQUEST', () => {
    const { name: _name, ...rest } = validResident
    expectBadRequest(() => parseRegisterInput(rest))
  })

  it('missing block throws BAD_REQUEST', () => {
    const { block: _block, ...rest } = validResident
    expectBadRequest(() => parseRegisterInput(rest))
  })
})

describe('parseRefreshInput', () => {
  it('valid refreshToken is returned (happy S6)', () => {
    const token = 'some-uuid-token'
    expect(parseRefreshInput({ refreshToken: token })).toEqual({
      refreshToken: token,
    })
  })

  it('missing refreshToken throws BAD_REQUEST', () => {
    expectBadRequest(() => parseRefreshInput({}))
  })

  it('empty string refreshToken throws BAD_REQUEST', () => {
    expectBadRequest(() => parseRefreshInput({ refreshToken: '' }))
  })
})
