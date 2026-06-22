import { expect, test } from 'vitest'

import { isWrongCode } from './is-wrong-code'

test('error S1 — TRPCClientError with code BAD_REQUEST is a wrong-code rejection', () => {
  expect(isWrongCode({ data: { code: 'BAD_REQUEST' } })).toBe(true)
})

test('error S1 — FORBIDDEN (locked number) is not a wrong-code rejection', () => {
  expect(isWrongCode({ data: { code: 'FORBIDDEN' } })).toBe(false)
})

test('error S1 — UNAUTHORIZED is not a wrong-code rejection', () => {
  expect(isWrongCode({ data: { code: 'UNAUTHORIZED' } })).toBe(false)
})

test('error S5 — plain Error (no .data) is not a wrong-code rejection', () => {
  expect(isWrongCode(new Error('Network error'))).toBe(false)
})

test('error S5 — null is not a wrong-code rejection', () => {
  expect(isWrongCode(null)).toBe(false)
})

test('error S5 — a string is not a wrong-code rejection', () => {
  expect(isWrongCode('something went wrong')).toBe(false)
})

test('error S5 — an object with .data but no .code is not a wrong-code rejection', () => {
  expect(isWrongCode({ data: {} })).toBe(false)
})

test('error S5 — an object with .data.code = null is not a wrong-code rejection', () => {
  expect(isWrongCode({ data: { code: null } })).toBe(false)
})

test('error S5 — undefined is not a wrong-code rejection', () => {
  expect(isWrongCode(undefined)).toBe(false)
})

test('error S5 — a number is not a wrong-code rejection', () => {
  expect(isWrongCode(42)).toBe(false)
})
