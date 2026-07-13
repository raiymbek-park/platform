import { expect, test } from 'vitest'

import { trpcErrorCode } from './trpc-error'

test('extracts a string data.code from a tRPC client error', () => {
  expect(trpcErrorCode({ data: { code: 'BAD_REQUEST' } })).toBe('BAD_REQUEST')
})

test('returns undefined when data.code is not a string', () => {
  expect(trpcErrorCode({ data: { code: 123 } })).toBeUndefined()
})

test('returns undefined when data carries no code', () => {
  expect(trpcErrorCode({ data: {} })).toBeUndefined()
})

test('returns undefined without throwing when data is null', () => {
  expect(trpcErrorCode({ data: null })).toBeUndefined()
})

test('returns undefined when the error has no data field', () => {
  expect(trpcErrorCode({ code: 'auth/network-request-failed' })).toBeUndefined()
})

test('returns undefined for null, undefined and primitive errors', () => {
  expect(trpcErrorCode(null)).toBeUndefined()
  expect(trpcErrorCode(undefined)).toBeUndefined()
  expect(trpcErrorCode('BAD_REQUEST')).toBeUndefined()
})
