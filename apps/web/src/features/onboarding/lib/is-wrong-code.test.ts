import { expect, test } from 'vitest'

import { isWrongCode } from './is-wrong-code'

test('error S1 — invalid-verification-code is a wrong-code rejection', () => {
  expect(isWrongCode({ code: 'auth/invalid-verification-code' })).toBe(true)
})

test('error S1 — code-expired is a wrong-code rejection', () => {
  expect(isWrongCode({ code: 'auth/code-expired' })).toBe(true)
})

test('error S5 — a network/internal FirebaseError is not a wrong-code rejection', () => {
  expect(isWrongCode({ code: 'auth/network-request-failed' })).toBe(false)
})

test('error S5 — plain Error (no .code) is not a wrong-code rejection', () => {
  expect(isWrongCode(new Error('Network error'))).toBe(false)
})

test('error S5 — null is not a wrong-code rejection', () => {
  expect(isWrongCode(null)).toBe(false)
})

test('error S5 — a string is not a wrong-code rejection', () => {
  expect(isWrongCode('something went wrong')).toBe(false)
})

test('error S5 — an object with .code = null is not a wrong-code rejection', () => {
  expect(isWrongCode({ code: null })).toBe(false)
})

test('error S5 — undefined is not a wrong-code rejection', () => {
  expect(isWrongCode(undefined)).toBe(false)
})

test('error S5 — a number is not a wrong-code rejection', () => {
  expect(isWrongCode(42)).toBe(false)
})
