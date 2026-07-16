import { screen, waitFor } from '@testing-library/react'
import { beforeEach, expect, test } from 'vitest'

import {
  firebaseAuth,
  renderApp,
  trpcMutationError,
  trpcServer,
} from '@/shared/test'

import { useAuthMethodStore } from '../model/use-auth-method-store'
import { useOnboardingStore } from '../model/use-onboarding-store'
import { useOtpRequestStore } from '../model/use-otp-request-store'

const phone = '+77071234567'

const arriveFromASendAttempt = () => {
  useOnboardingStore.getState().setDraft({
    name: 'Алиса',
    phone,
    block: 1,
    apartment: 42,
    role: 'owner',
  })
  useOtpRequestStore.getState().markAttempted(phone)
}

beforeEach(() => {
  firebaseAuth.reset()
  useOnboardingStore.getState().reset()
  useOtpRequestStore.getState().clear()
  useAuthMethodStore.setState({ method: 'phone' })
})

test('edge-cases 12: the locked screen without a send attempt redirects to the registration form', async () => {
  const { currentPath } = renderApp('/onboarding/locked')

  await screen.findByLabelText('Имя')
  expect(currentPath()).toBe('/onboarding/registration')
})

test('error-states 12: the locked screen explains the lockout and offers a retry', async () => {
  arriveFromASendAttempt()
  renderApp('/onboarding/locked')

  expect(await screen.findByText('Доступ заблокирован')).toBeInTheDocument()
  expect(screen.getByText(/Слишком много попыток/)).toBeInTheDocument()
  expect(screen.getByRole('button', { name: /Повторить/ })).toBeEnabled()
})

test('error-states 12: retrying from the locked screen with success reaches verification', async () => {
  arriveFromASendAttempt()
  const { user, currentPath } = renderApp('/onboarding/locked')

  await screen.findByText('Доступ заблокирован')
  await user.click(screen.getByRole('button', { name: /Повторить/ }))

  await waitFor(() => expect(currentPath()).toBe('/onboarding/verification'))
})

test('error-states 12: retrying from the locked screen with failure keeps it locked', async () => {
  arriveFromASendAttempt()
  trpcServer.use(trpcMutationError('otp.send', 'BAD_GATEWAY', 502))
  const { user, currentPath } = renderApp('/onboarding/locked')

  await screen.findByText('Доступ заблокирован')
  await user.click(screen.getByRole('button', { name: /Повторить/ }))

  expect(
    await screen.findByText(/Пока не получается отправить код/),
  ).toBeInTheDocument()
  expect(currentPath()).toBe('/onboarding/locked')
})
