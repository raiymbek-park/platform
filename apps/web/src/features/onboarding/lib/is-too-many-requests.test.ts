import { expect, test } from 'vitest'

import { isTooManyRequests } from './is-too-many-requests'

test('error-states 6 — a TOO_MANY_REQUESTS tRPC error is a too-many-requests rejection', () => {
  expect(isTooManyRequests({ data: { code: 'TOO_MANY_REQUESTS' } })).toBe(true)
})

test('error-states 6 — a BAD_REQUEST tRPC error is not a too-many-requests rejection', () => {
  expect(isTooManyRequests({ data: { code: 'BAD_REQUEST' } })).toBe(false)
})

test('error-states 6 — a BAD_GATEWAY tRPC error is not a too-many-requests rejection', () => {
  expect(isTooManyRequests({ data: { code: 'BAD_GATEWAY' } })).toBe(false)
})

test('error-states 6 — a tRPC error without data is not a too-many-requests rejection', () => {
  expect(isTooManyRequests({ data: undefined })).toBe(false)
})

test('error-states 6 — plain Error (no .data) is not a too-many-requests rejection', () => {
  expect(isTooManyRequests(new Error('Network error'))).toBe(false)
})

test('error-states 6 — null is not a too-many-requests rejection', () => {
  expect(isTooManyRequests(null)).toBe(false)
})

test('error-states 6 — a string is not a too-many-requests rejection', () => {
  expect(isTooManyRequests('something went wrong')).toBe(false)
})

test('error-states 6 — an object with a non-string data.code is not a too-many-requests rejection', () => {
  expect(isTooManyRequests({ data: { code: 429 } })).toBe(false)
})

test('error-states 6 — undefined is not a too-many-requests rejection', () => {
  expect(isTooManyRequests(undefined)).toBe(false)
})

test('error-states 6 — a number is not a too-many-requests rejection', () => {
  expect(isTooManyRequests(42)).toBe(false)
})
