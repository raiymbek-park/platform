import { expect, test } from 'vitest'

import { isPopupBlocked, isPopupDismissed } from './google-auth-error'

test.each([
  'auth/cancelled-popup-request',
  'auth/popup-closed-by-user',
  'auth/user-cancelled',
])('error-states 8: %s counts as a dismissal', code => {
  expect(isPopupDismissed({ code })).toBe(true)
})

test('error-states 9: auth/popup-blocked is not a dismissal but is blocked', () => {
  expect(isPopupDismissed({ code: 'auth/popup-blocked' })).toBe(false)
  expect(isPopupBlocked({ code: 'auth/popup-blocked' })).toBe(true)
})

test('error-states 10: a network failure is neither dismissed nor blocked', () => {
  const error = { code: 'auth/network-request-failed' }
  expect(isPopupDismissed(error)).toBe(false)
  expect(isPopupBlocked(error)).toBe(false)
})

test('non-Firebase errors are neither dismissed nor blocked', () => {
  expect(isPopupDismissed(new Error('boom'))).toBe(false)
  expect(isPopupBlocked(undefined)).toBe(false)
})
