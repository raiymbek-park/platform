import { expect, test } from 'vitest'

import { isSignInFailure } from './is-sign-in-failure'

test('error S7 — a Firebase auth/* error from signInWithCustomToken is a sign-in failure', () => {
  expect(isSignInFailure({ code: 'auth/invalid-custom-token' })).toBe(true)
})

test('error S7 — a tRPC BAD_REQUEST (wrong code) is not a sign-in failure', () => {
  expect(isSignInFailure({ data: { code: 'BAD_REQUEST' } })).toBe(false)
})

test('error S7 — a non-auth code prefix is not a sign-in failure', () => {
  expect(isSignInFailure({ code: 'BAD_REQUEST' })).toBe(false)
})

test('error S7 — null, undefined and codeless errors are not sign-in failures', () => {
  expect(isSignInFailure(null)).toBe(false)
  expect(isSignInFailure(undefined)).toBe(false)
  expect(isSignInFailure(new Error('boom'))).toBe(false)
})
