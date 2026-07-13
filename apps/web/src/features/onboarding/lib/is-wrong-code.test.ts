import { expect, test } from 'vitest'

import { isWrongCode } from './is-wrong-code'

test('error S2 — a BAD_REQUEST tRPC error (invalid or expired code) is a wrong-code rejection', () => {
  expect(isWrongCode({ data: { code: 'BAD_REQUEST' } })).toBe(true)
})

test('error S3 — a TOO_MANY_REQUESTS tRPC error is not a wrong-code rejection', () => {
  expect(isWrongCode({ data: { code: 'TOO_MANY_REQUESTS' } })).toBe(false)
})

test('error S3 — an INTERNAL_SERVER_ERROR tRPC error is not a wrong-code rejection', () => {
  expect(isWrongCode({ data: { code: 'INTERNAL_SERVER_ERROR' } })).toBe(false)
})

test('error S3 — a Firebase auth error is not a wrong-code rejection', () => {
  expect(isWrongCode({ code: 'auth/network-request-failed' })).toBe(false)
})

test('error S3 — plain Error (no .data) is not a wrong-code rejection', () => {
  expect(isWrongCode(new Error('Network error'))).toBe(false)
})

test('error S3 — null is not a wrong-code rejection', () => {
  expect(isWrongCode(null)).toBe(false)
})

test('error S3 — a string is not a wrong-code rejection', () => {
  expect(isWrongCode('something went wrong')).toBe(false)
})

test('error S3 — an object with a non-string data.code is not a wrong-code rejection', () => {
  expect(isWrongCode({ data: { code: 400 } })).toBe(false)
})

test('error S3 — undefined is not a wrong-code rejection', () => {
  expect(isWrongCode(undefined)).toBe(false)
})

test('error S3 — a number is not a wrong-code rejection', () => {
  expect(isWrongCode(42)).toBe(false)
})
