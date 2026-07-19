import type { Locale } from '../i18n'

import { afterEach, beforeEach, expect, test } from 'vitest'

import { otpRouter } from '../otp/router'
import { authFake, fake, injectFake, resetFirestore } from './index'

const PHONE = '+77781234455'
const ctx = { locale: 'ru' as Locale, phone: null, uid: null }

beforeEach(() => {
  fake.reset()
  authFake.reset()
  injectFake()
  process.env.OTP_TEST_MODE = 'true'
})

afterEach(() => {
  resetFirestore()
  process.env.OTP_TEST_MODE = undefined
})

test('a new phone: the real otp router creates an auth user and mints a custom token', async () => {
  const caller = otpRouter.createCaller(ctx)
  await caller.send({ phone: PHONE })
  const { token } = await caller.verify({ phone: PHONE, code: '123456' })
  expect(token).toBe('custom-token-auth-uid-1')
})

test('a returning phone reuses its existing uid', async () => {
  authFake.seedUser(PHONE, 'existing-uid')
  const caller = otpRouter.createCaller(ctx)
  await caller.send({ phone: PHONE })
  const { token } = await caller.verify({ phone: PHONE, code: '123456' })
  expect(token).toBe('custom-token-existing-uid')
})

test('a wrong code is rejected and no token is minted', async () => {
  const caller = otpRouter.createCaller(ctx)
  await caller.send({ phone: PHONE })
  await expect(
    caller.verify({ phone: PHONE, code: '000000' }),
  ).rejects.toThrow()
})
