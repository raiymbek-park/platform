import { expect, test } from 'vitest'

import { formatOtp, toDigits } from './format-otp'

test('toDigits keeps digits only and caps at the code length', () => {
  expect(toDigits('12ab34')).toBe('1234')
  expect(toDigits('1 2-3 4 5 6 7 8')).toBe('123456')
})

test('formatOtp groups the digits as "xxx - xxx"', () => {
  expect(formatOtp('')).toBe('')
  expect(formatOtp('12')).toBe('12')
  expect(formatOtp('123')).toBe('123')
  expect(formatOtp('1234')).toBe('123 - 4')
  expect(formatOtp('123456')).toBe('123 - 456')
})
