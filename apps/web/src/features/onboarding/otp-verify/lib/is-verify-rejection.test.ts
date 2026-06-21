import { expect, test } from 'vitest'

import { isVerifyRejection } from './is-verify-rejection'

// error S1/S2 — BAD_REQUEST is a verification rejection (wrong / used code)
test('error S1 — TRPCClientError with code BAD_REQUEST is a verify rejection', () => {
  expect(isVerifyRejection({ data: { code: 'BAD_REQUEST' } })).toBe(true)
})

// error S4 — a locked number throws FORBIDDEN, NOT a wrong-code rejection
test('error S4 — FORBIDDEN (locked number) is not a verify rejection', () => {
  expect(isVerifyRejection({ data: { code: 'FORBIDDEN' } })).toBe(false)
})

test('error S4 — UNAUTHORIZED is not a verify rejection', () => {
  expect(isVerifyRejection({ data: { code: 'UNAUTHORIZED' } })).toBe(false)
})

test('error S5 — plain Error (no .data) is not a verify rejection', () => {
  expect(isVerifyRejection(new Error('Network error'))).toBe(false)
})

test('error S5 — null is not a verify rejection', () => {
  expect(isVerifyRejection(null)).toBe(false)
})

test('error S5 — a string is not a verify rejection', () => {
  expect(isVerifyRejection('something went wrong')).toBe(false)
})

test('error S5 — an object with .data but no .code is not a verify rejection', () => {
  expect(isVerifyRejection({ data: {} })).toBe(false)
})

test('error S5 — an object with .data.code = null is not a verify rejection', () => {
  expect(isVerifyRejection({ data: { code: null } })).toBe(false)
})

test('error S5 — undefined is not a verify rejection', () => {
  expect(isVerifyRejection(undefined)).toBe(false)
})

test('error S5 — a number is not a verify rejection', () => {
  expect(isVerifyRejection(42)).toBe(false)
})
