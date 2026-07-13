import { afterEach, expect, test, vi } from 'vitest'

import { authErrorCode, sendCodeErrorText } from './auth-error'

afterEach(() => vi.restoreAllMocks())

const silenceLog = () => vi.spyOn(console, 'error').mockImplementation(() => {})

test('authErrorCode — extracts a string .code from a FirebaseError-shaped object', () => {
  expect(authErrorCode({ code: 'auth/network-request-failed' })).toBe(
    'auth/network-request-failed',
  )
})

test('authErrorCode — returns undefined when .code is missing', () => {
  expect(authErrorCode(new Error('boom'))).toBeUndefined()
})

test('authErrorCode — returns undefined when .code is not a string', () => {
  expect(authErrorCode({ code: null })).toBeUndefined()
  expect(authErrorCode({ code: 400 })).toBeUndefined()
})

test('authErrorCode — returns undefined for null, undefined and primitives', () => {
  expect(authErrorCode(null)).toBeUndefined()
  expect(authErrorCode(undefined)).toBeUndefined()
  expect(authErrorCode('auth/too-many-requests')).toBeUndefined()
  expect(authErrorCode(42)).toBeUndefined()
})

test('sendCodeErrorText — known tRPC codes map to distinct, specific messages', () => {
  silenceLog()
  const fallback = sendCodeErrorText({
    data: { code: 'INTERNAL_SERVER_ERROR' },
  })
  const gateway = sendCodeErrorText({ data: { code: 'BAD_GATEWAY' } })
  const invalidPhone = sendCodeErrorText({ data: { code: 'BAD_REQUEST' } })

  expect(gateway).toBeTruthy()
  expect(new Set([fallback, gateway, invalidPhone]).size).toBe(3)
})

test('sendCodeErrorText — each mapped code renders a non-empty message ahead of the code suffix', () => {
  silenceLog()
  const gateway = sendCodeErrorText({ data: { code: 'BAD_GATEWAY' } })
  const invalidPhone = sendCodeErrorText({ data: { code: 'BAD_REQUEST' } })

  expect(gateway.replace(/ \(BAD_GATEWAY\)$/, '')).not.toBe('')
  expect(invalidPhone.replace(/ \(BAD_REQUEST\)$/, '')).not.toBe('')
})

test('sendCodeErrorText — the visible message carries the error code for on-device diagnosis', () => {
  silenceLog()
  const generic = sendCodeErrorText(new Error('boom'))
  expect(sendCodeErrorText(null)).toBe(generic)
  expect(sendCodeErrorText({ data: { code: 'BAD_GATEWAY' } })).toMatch(
    / \(BAD_GATEWAY\)$/,
  )
  expect(sendCodeErrorText({ data: { code: 'UNKNOWN_XYZ' } })).toBe(
    `${generic} (UNKNOWN_XYZ)`,
  )
})

test('sendCodeErrorText — logs the tRPC error code for field diagnosis', () => {
  const spy = silenceLog()
  sendCodeErrorText({ data: { code: 'BAD_GATEWAY' } })
  expect(spy).toHaveBeenCalledWith(
    expect.stringContaining('phone-auth:send-code'),
    'BAD_GATEWAY',
    expect.anything(),
  )
})
