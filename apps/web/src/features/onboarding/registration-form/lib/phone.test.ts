import { expect, test } from 'vitest'

import { formatPhoneMask } from './phone'

test('formatPhoneMask returns base prefix for empty input', () => {
  expect(formatPhoneMask('')).toBe('+7 ')
})

test('formatPhoneMask formats 3 local digits as area code only', () => {
  // 9XX area code — does not start with 7 or 8, so phoneDigits keeps all digits
  expect(formatPhoneMask('912')).toBe('+7 (912')
})

test('formatPhoneMask formats 6 local digits with area and prefix', () => {
  expect(formatPhoneMask('912345')).toBe('+7 (912) 345')
})

test('formatPhoneMask formats 8 local digits with first line segment', () => {
  expect(formatPhoneMask('91234567')).toBe('+7 (912) 345-67')
})

test('formatPhoneMask formats a full +7-prefixed number to the complete mask', () => {
  expect(formatPhoneMask('+77071234567')).toBe('+7 (707) 123-45-67')
})

test('formatPhoneMask formats a full 11-digit number (no plus) to the complete mask', () => {
  expect(formatPhoneMask('77071234567')).toBe('+7 (707) 123-45-67')
})
