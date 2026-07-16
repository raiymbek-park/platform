import { expect, test } from 'vitest'

import { formatPhoneDisplay } from './format-phone-display'

test('happy S3 — formats normalized phone as +7 707 123 45 67', () => {
  expect(formatPhoneDisplay('+77071234567')).toBe('+7 707 123 45 67')
})

test('happy S3 — formats another normalized phone correctly', () => {
  expect(formatPhoneDisplay('+79991234567')).toBe('+7 999 123 45 67')
})

test('happy S3 — empty string stays empty instead of a fabricated +7', () => {
  expect(formatPhoneDisplay('')).toBe('')
})

test('happy S3 — strips non-digit characters from input', () => {
  expect(formatPhoneDisplay('+7 (707) 123-45-67')).toBe('+7 707 123 45 67')
})
