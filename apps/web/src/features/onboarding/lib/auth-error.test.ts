import { afterEach, expect, test, vi } from 'vitest'

import { authErrorCode, sendCodeErrorText } from './auth-error'

afterEach(() => vi.restoreAllMocks())

const silenceLog = () => vi.spyOn(console, 'error').mockImplementation(() => {})

test('authErrorCode — extracts a string .code from a FirebaseError-shaped object', () => {
  expect(authErrorCode({ code: 'auth/too-many-requests' })).toBe(
    'auth/too-many-requests',
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

test('sendCodeErrorText — known codes map to distinct, specific messages', () => {
  silenceLog()
  const fallback = sendCodeErrorText({ code: 'auth/unknown-xyz' })
  const quota = sendCodeErrorText({ code: 'auth/quota-exceeded' })
  const invalidPhone = sendCodeErrorText({ code: 'auth/invalid-phone-number' })
  const network = sendCodeErrorText({ code: 'auth/network-request-failed' })

  expect(quota).toBeTruthy()
  expect(new Set([fallback, quota, invalidPhone, network]).size).toBe(4)
})

test('sendCodeErrorText — captcha and app-credential share the security message', () => {
  silenceLog()
  expect(sendCodeErrorText({ code: 'auth/captcha-check-failed' })).toBe(
    sendCodeErrorText({ code: 'auth/invalid-app-credential' }),
  )
})

test('sendCodeErrorText — unknown or code-less errors fall back to the generic message', () => {
  silenceLog()
  const fallback = sendCodeErrorText({ code: 'auth/unknown-xyz' })
  expect(sendCodeErrorText(new Error('boom'))).toBe(fallback)
  expect(sendCodeErrorText(null)).toBe(fallback)
})

test('sendCodeErrorText — logs the real Firebase error code for field diagnosis', () => {
  const spy = silenceLog()
  sendCodeErrorText({ code: 'auth/quota-exceeded' })
  expect(spy).toHaveBeenCalledWith(
    expect.stringContaining('phone-auth:send-code'),
    'auth/quota-exceeded',
    expect.anything(),
  )
})
