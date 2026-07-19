import {
  authFake,
  fake,
  injectFake,
  resetFirestore,
} from '@raiymbek-park/api/testing'
import { screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, expect, test } from 'vitest'

import { firebaseAuth, trpcMutationError, trpcServer } from '@/shared/test'
import { renderAppWithServer } from '@/shared/test/render-app-server'

import { useAuthMethodStore } from '../model/use-auth-method-store'
import { useOnboardingStore } from '../model/use-onboarding-store'
import { useOtpRequestStore } from '../model/use-otp-request-store'

const phone = '+77781234455'

const arriveFromASendAttempt = () => {
  useOnboardingStore.getState().setDraft({
    name: 'Alice',
    phone,
    block: 1,
    apartment: 42,
    role: 'owner',
  })
  useOtpRequestStore.getState().markAttempted(phone)
}

beforeEach(() => {
  firebaseAuth.reset()
  fake.reset()
  authFake.reset()
  injectFake()
  process.env.OTP_TEST_MODE = 'true'
  useOnboardingStore.getState().reset()
  useOtpRequestStore.getState().clear()
  useAuthMethodStore.setState({ method: 'phone' })
})

afterEach(() => {
  resetFirestore()
  process.env.OTP_TEST_MODE = undefined
})

test('edge-cases 12: the locked screen without a send attempt redirects to the registration form', async () => {
  const { currentPath } = renderAppWithServer('/onboarding/locked')

  await screen.findByLabelText('Name')
  expect(currentPath()).toBe('/onboarding/registration')
})

test('error-states 12: the locked screen explains the lockout and offers a retry', async () => {
  arriveFromASendAttempt()
  renderAppWithServer('/onboarding/locked')

  expect(await screen.findByText('Access blocked')).toBeInTheDocument()
  expect(screen.getByText(/Too many attempts/)).toBeInTheDocument()
  expect(screen.getByRole('button', { name: /Retry/ })).toBeEnabled()
})

test('error-states 12: retrying from the locked screen with success reaches verification', async () => {
  arriveFromASendAttempt()
  const { user, currentPath } = renderAppWithServer('/onboarding/locked')

  await screen.findByText('Access blocked')
  await user.click(screen.getByRole('button', { name: /Retry/ }))

  await waitFor(() => expect(currentPath()).toBe('/onboarding/verification'))
})

test('error-states 12: retrying from the locked screen with failure keeps it locked', async () => {
  arriveFromASendAttempt()
  const { user, currentPath } = renderAppWithServer('/onboarding/locked')

  await screen.findByText('Access blocked')
  trpcServer.use(trpcMutationError('otp.send', 'BAD_GATEWAY', 502))
  await user.click(screen.getByRole('button', { name: /Retry/ }))

  expect(
    await screen.findByText(/Can.t send the code right now/),
  ).toBeInTheDocument()
  expect(currentPath()).toBe('/onboarding/locked')
})
