import { expect, test } from 'vitest'

import { formatPhoneMask, normalizePhone, phoneDigits } from './phone'

// phoneDigits — strips non-digits, handles 8/+7 prefixes
// The function strips the leading 8 (trunk prefix), then strips a leading 7
// (country code), leaving at most 10 local digits.
// Valid 10-digit result requires full international input, e.g. +77071234567.

test('phoneDigits strips non-digit characters from a formatted number', () => {
  expect(phoneDigits('+7 (707) 123-45-67')).toBe('7071234567')
})

test('phoneDigits drops the leading 8 trunk prefix and the 7 country code', () => {
  // 87071234567 = trunk 8 + country 7 + 071234567 (9 local digits → truncated)
  expect(phoneDigits('87071234567')).toBe('071234567')
})

test('phoneDigits drops the +7 country prefix, leaving 10 local digits', () => {
  expect(phoneDigits('+77071234567')).toBe('7071234567')
})

test('phoneDigits caps result at 10 digits', () => {
  expect(phoneDigits('+770712345678')).toBe('7071234567')
})

test('phoneDigits returns empty string for empty input', () => {
  expect(phoneDigits('')).toBe('')
})

test('phoneDigits from 11-digit full number without plus', () => {
  // 77071234567 = country 7 + 7071234567 (10 local digits)
  expect(phoneDigits('77071234567')).toBe('7071234567')
})

// formatPhoneMask — progressive masking

test('formatPhoneMask returns base prefix for empty input', () => {
  expect(formatPhoneMask('')).toBe('+7 ')
})

test('formatPhoneMask formats 3 local digits as area code only', () => {
  // Use 9XX area code — does not start with 7 or 8 so phoneDigits keeps all digits
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

// normalizePhone — produces +7XXXXXXXXXX

test('normalizePhone produces +7XXXXXXXXXX from a +7-prefixed full number', () => {
  expect(normalizePhone('+77071234567')).toBe('+77071234567')
})

test('normalizePhone produces +7XXXXXXXXXX from an 11-digit number without plus', () => {
  expect(normalizePhone('77071234567')).toBe('+77071234567')
})

test('normalizePhone result starts with +7 followed by 10 digits', () => {
  const result = normalizePhone('+77071234567')
  expect(result).toMatch(/^\+7\d{10}$/)
})
