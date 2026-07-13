import { screen, waitFor } from '@testing-library/react'
import { beforeEach, expect, test } from 'vitest'

import {
  firebaseAuth,
  renderApp,
  trpcMutationError,
  trpcServer,
} from '@/shared/test'

import { useOnboardingStore } from '../model/use-onboarding-store'

const fillLockedDraft = () =>
  useOnboardingStore.getState().setDraft({
    name: 'Алиса',
    phone: '+77071234567',
    block: 1,
    apartment: 42,
    role: 'owner',
  })

beforeEach(() => {
  firebaseAuth.reset()
  useOnboardingStore.getState().reset()
})

test('edge-cases 6: the locked screen without a phone in the draft redirects to welcome', async () => {
  const { currentPath } = renderApp('/onboarding/locked')

  await screen.findByLabelText('Имя')
  expect(currentPath()).toBe('/onboarding/welcome')
})

test('error-states 6: retrying from the locked screen with success reaches verification', async () => {
  fillLockedDraft()
  const { user, currentPath } = renderApp('/onboarding/locked')

  await screen.findByText('Доступ заблокирован')
  await user.click(screen.getByRole('button', { name: /Повторить/ }))

  await waitFor(() => expect(currentPath()).toBe('/onboarding/verification'))
})

test('error-states 6: retrying from the locked screen with failure keeps it locked', async () => {
  fillLockedDraft()
  trpcServer.use(trpcMutationError('otp.send', 'BAD_GATEWAY', 502))
  const { user, currentPath } = renderApp('/onboarding/locked')

  await screen.findByText('Доступ заблокирован')
  await user.click(screen.getByRole('button', { name: /Повторить/ }))

  expect(
    await screen.findByText(/Пока не получается отправить код/),
  ).toBeInTheDocument()
  expect(currentPath()).toBe('/onboarding/locked')
})
