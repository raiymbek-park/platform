import { expect, test } from 'vitest'

import { isServerError } from './is-server-error'

// error S1/S2 — server error shape
test('error S1 — TRPCClientError with data.code is a server error', () => {
  expect(isServerError({ data: { code: 'BAD_REQUEST' } })).toBe(true)
})

test('error S5 — plain Error (no .data) is not a server error', () => {
  expect(isServerError(new Error('Network error'))).toBe(false)
})

test('error S5 — null is not a server error', () => {
  expect(isServerError(null)).toBe(false)
})

test('error S5 — a string is not a server error', () => {
  expect(isServerError('something went wrong')).toBe(false)
})

test('error S5 — an object with .data but no .code is not a server error', () => {
  expect(isServerError({ data: {} })).toBe(false)
})

test('error S5 — an object with .data.code = null is not a server error', () => {
  expect(isServerError({ data: { code: null } })).toBe(false)
})

test('error S5 — undefined is not a server error', () => {
  expect(isServerError(undefined)).toBe(false)
})

test('error S5 — a number is not a server error', () => {
  expect(isServerError(42)).toBe(false)
})
