import { expect, test } from 'vitest'

import { isTooManyRequests } from './is-too-many-requests'

test('error-states 6 — auth/too-many-requests is a too-many-requests rejection', () => {
  expect(isTooManyRequests({ code: 'auth/too-many-requests' })).toBe(true)
})

test('error-states 6 — auth/error-code:-39 (503 abuse throttle) is a too-many-requests rejection', () => {
  expect(isTooManyRequests({ code: 'auth/error-code:-39' })).toBe(true)
})

test('error-states 6 — a network/internal FirebaseError is not a too-many-requests rejection', () => {
  expect(isTooManyRequests({ code: 'auth/network-request-failed' })).toBe(false)
})

test('error-states 6 — plain Error (no .code) is not a too-many-requests rejection', () => {
  expect(isTooManyRequests(new Error('Network error'))).toBe(false)
})

test('error-states 6 — null is not a too-many-requests rejection', () => {
  expect(isTooManyRequests(null)).toBe(false)
})

test('error-states 6 — a string is not a too-many-requests rejection', () => {
  expect(isTooManyRequests('something went wrong')).toBe(false)
})

test('error-states 6 — an object with .code = null is not a too-many-requests rejection', () => {
  expect(isTooManyRequests({ code: null })).toBe(false)
})

test('error-states 6 — undefined is not a too-many-requests rejection', () => {
  expect(isTooManyRequests(undefined)).toBe(false)
})

test('error-states 6 — a number is not a too-many-requests rejection', () => {
  expect(isTooManyRequests(42)).toBe(false)
})
