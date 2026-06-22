import { expect, test } from 'vitest'

import { formatHms } from './format-hms'

test('lockout S13 — zero seconds formats as 00:00:00', () => {
  expect(formatHms(0)).toBe('00:00:00')
})

test('lockout S13 — negative seconds clamps to 00:00:00', () => {
  expect(formatHms(-1)).toBe('00:00:00')
})

test('lockout S13 — 59 seconds (under one minute) formats correctly', () => {
  expect(formatHms(59)).toBe('00:00:59')
})

test('lockout S13 — 3599 seconds (under one hour) formats as 00:59:59', () => {
  expect(formatHms(3599)).toBe('00:59:59')
})

test('lockout S13 — 86399 seconds (23:59:59) formats with all units two-digit padded', () => {
  expect(formatHms(86399)).toBe('23:59:59')
})

test('lockout S13 — 86400 seconds (exactly 24 hours) formats as 24:00:00', () => {
  expect(formatHms(86400)).toBe('24:00:00')
})

test('lockout S13 — hours pad to two digits when under 10', () => {
  expect(formatHms(3661)).toBe('01:01:01')
})

test('lockout S13 — decimal seconds are floored, not rounded', () => {
  expect(formatHms(59.9)).toBe('00:00:59')
})
