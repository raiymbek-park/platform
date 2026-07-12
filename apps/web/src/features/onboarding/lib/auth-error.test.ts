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

test('sendCodeErrorText — captcha and app-credential share the security message, each tagged with its own code', () => {
  silenceLog()
  const captcha = sendCodeErrorText({ code: 'auth/captcha-check-failed' })
  const appCredential = sendCodeErrorText({
    code: 'auth/invalid-app-credential',
  })
  const body = (text: string) => text.replace(/ \([^)]+\)$/, '')
  expect(body(captcha)).toBe(body(appCredential))
  expect(captcha).toContain('(auth/captcha-check-failed)')
  expect(appCredential).toContain('(auth/invalid-app-credential)')
})

test('sendCodeErrorText — the visible message carries the error code for on-device diagnosis', () => {
  silenceLog()
  const generic = sendCodeErrorText(new Error('boom'))
  expect(sendCodeErrorText(null)).toBe(generic)
  expect(sendCodeErrorText({ code: 'auth/unknown-xyz' })).toBe(
    `${generic} (auth/unknown-xyz)`,
  )
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
