import type { UserEvent } from '@testing-library/user-event'

import { screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'

import { useConfirmationStore } from '@/shared/auth'
import { firebaseAuth } from '@/shared/test/firebase-auth'
import { renderApp } from '@/shared/test/render-app'
import { trpcMutation, trpcServer } from '@/shared/test/trpc-server'

import { useOnboardingStore } from '../model/use-onboarding-store'

const next = () => screen.getByRole('button', { name: /Далее/ })

const fillName = (user: UserEvent, value: string) =>
  user.type(screen.getByLabelText('Имя'), value)

const setPhone = async (user: UserEvent, value: string) => {
  const phone = screen.getByLabelText('Телефон')
  await user.clear(phone)
  await user.type(phone, value)
}

const fillApartment = (user: UserEvent, value: string) =>
  user.type(screen.getByLabelText('Номер квартиры'), value)

const pickBlock = (user: UserEvent, label: RegExp) =>
  user.click(screen.getByRole('button', { name: label }))

const pickRole = (user: UserEvent, label: RegExp) =>
  user.click(screen.getByRole('button', { name: label }))

type FormOverrides = {
  name?: string
  phone?: string
  block?: RegExp
  apartment?: string
  role?: RegExp
}

const fillValidForm = async (
  user: UserEvent,
  {
    name = 'Алиса',
    phone = '+77071234567',
    block = /Блок 1/,
    apartment = '42',
    role = /Собственник/,
  }: FormOverrides = {},
) => {
  await fillName(user, name)
  await setPhone(user, phone)
  await pickBlock(user, block)
  await fillApartment(user, apartment)
  await pickRole(user, role)
}

const renderWelcome = async () => {
  const app = renderApp('/onboarding/welcome')
  await screen.findByLabelText('Имя')
  return app
}

beforeEach(() => {
  firebaseAuth.reset()
  useOnboardingStore.getState().reset()
  useConfirmationStore.getState().clear()
})

afterEach(() => {
  vi.useRealTimers()
})

test('happy-path 1: a partially filled form keeps "Далее" disabled until every field is valid', async () => {
  const { user } = await renderWelcome()

  await fillName(user, 'А')
  await setPhone(user, '+77071234567')
  await pickBlock(user, /Блок 1/)
  await fillApartment(user, '42')
  await pickRole(user, /Собственник/)
  expect(next()).toBeDisabled()

  await user.clear(screen.getByLabelText('Имя'))
  await fillName(user, 'Алиса')

  await waitFor(() => expect(next()).toBeEnabled())
})

test('happy-path 2: the phone field defaults to "+7"', async () => {
  renderWelcome()

  expect(await screen.findByLabelText('Телефон')).toHaveValue('+7')
})

test('happy-path 3: submitting sends a code and opens the verification screen', async () => {
  const { user, currentPath } = await renderWelcome()
  await fillValidForm(user)

  await user.click(next())

  await waitFor(() =>
    expect(screen.getByText('Введите код из SMS')).toBeInTheDocument(),
  )
  expect(currentPath()).toBe('/onboarding/verification')
})

test('validation 1: a missing role keeps "Далее" disabled even when every other field is valid', async () => {
  const { user } = await renderWelcome()
  await fillName(user, 'Алиса')
  await setPhone(user, '+77071234567')
  await pickBlock(user, /Блок 1/)
  await fillApartment(user, '42')

  expect(next()).toBeDisabled()
})

test('validation 3: a 1-character name keeps "Далее" disabled', async () => {
  const { user } = await renderWelcome()
  await fillValidForm(user, { name: 'А' })

  expect(next()).toBeDisabled()
})

test('validation 3: a 2-character name does not block "Далее"', async () => {
  const { user } = await renderWelcome()
  await fillValidForm(user, { name: 'Аб' })

  await waitFor(() => expect(next()).toBeEnabled())
})

test('validation 4: a 61-character name keeps "Далее" disabled', async () => {
  const { user } = await renderWelcome()
  await fillValidForm(user, { name: 'А'.repeat(61) })

  expect(next()).toBeDisabled()
})

test('validation 4: a 60-character name does not block "Далее"', async () => {
  const { user } = await renderWelcome()
  await fillValidForm(user, { name: 'А'.repeat(60) })

  await waitFor(() => expect(next()).toBeEnabled())
})

test('validation 5: a whitespace-only name keeps "Далее" disabled', async () => {
  const { user } = await renderWelcome()
  await fillValidForm(user, { name: '   ' })

  expect(next()).toBeDisabled()
})

test('validation 7: an incomplete phone keeps "Далее" disabled', async () => {
  const { user } = await renderWelcome()
  await fillValidForm(user, { phone: '+770' })

  expect(next()).toBeDisabled()
})

test('validation 6: a domestic 8XXXXXXXXXX phone normalizes to +7 on submit', async () => {
  const { user, currentPath } = await renderWelcome()
  await fillValidForm(user, { phone: '87071234567' })

  await waitFor(() => expect(next()).toBeEnabled())
  await user.click(next())

  await waitFor(() => expect(currentPath()).toBe('/onboarding/verification'))
  expect(useOnboardingStore.getState().draft.phone).toBe('+77071234567')
})

test('validation 8: an explicit international number is accepted as dialed', async () => {
  const { user, currentPath } = await renderWelcome()
  await fillValidForm(user, { phone: '+14155552671' })

  await waitFor(() => expect(next()).toBeEnabled())
  await user.click(next())

  await waitFor(() => expect(currentPath()).toBe('/onboarding/verification'))
  expect(useOnboardingStore.getState().draft.phone).toBe('+14155552671')
})

test('validation 9: an apartment outside the block range keeps "Далее" disabled', async () => {
  const { user } = await renderWelcome()
  await fillValidForm(user, { apartment: '99' })

  expect(next()).toBeDisabled()
})

test('validation 12: switching block re-validates the apartment number', async () => {
  const { user } = await renderWelcome()
  await fillValidForm(user, { apartment: '70' })
  await waitFor(() => expect(next()).toBeEnabled())

  await pickBlock(user, /Блок 2/)

  await waitFor(() => expect(next()).toBeDisabled())
})

test('validation 10: the apartment field keeps digits only', async () => {
  const { user } = await renderWelcome()
  await fillApartment(user, '4a2b')

  expect(screen.getByLabelText('Номер квартиры')).toHaveValue('42')
})

test('validation 13: picking a different block clears the previous selection', async () => {
  const { user } = await renderWelcome()

  await pickBlock(user, /Блок 1/)
  await pickBlock(user, /Блок 2/)

  expect(screen.getByRole('button', { name: /Блок 1/ })).toHaveAttribute(
    'aria-pressed',
    'false',
  )
  expect(screen.getByRole('button', { name: /Блок 2/ })).toHaveAttribute(
    'aria-pressed',
    'true',
  )
})

test('happy-path 10: "Далее" cannot be submitted twice while the send is in flight', async () => {
  let onStart: () => void = () => {}
  let release: () => void = () => {}
  const sendStarted = new Promise<void>(resolve => {
    onStart = resolve
  })
  const sendHeld = new Promise<void>(resolve => {
    release = resolve
  })
  firebaseAuth.holdSend(onStart, sendHeld)

  const { user } = await renderWelcome()
  await fillValidForm(user)
  await waitFor(() => expect(next()).toBeEnabled())

  await user.click(next())
  await sendStarted

  expect(next()).toBeDisabled()
  release()
})

test('error-states 1: a send failure keeps the welcome screen and re-enables "Далее"', async () => {
  firebaseAuth.failSend()
  const { user, currentPath } = await renderWelcome()
  await fillValidForm(user)
  await waitFor(() => expect(next()).toBeEnabled())

  await user.click(next())

  expect(
    await screen.findByText(/Не удалось отправить код/),
  ).toBeInTheDocument()
  expect(currentPath()).toBe('/onboarding/welcome')
  await waitFor(() => expect(next()).toBeEnabled())
})

test('happy-path: the submitted resident reaches the backend register call', async () => {
  const received: unknown[] = []
  trpcServer.use(
    trpcMutation('resident.register', input => {
      received.push(input)
      return { resident: input }
    }),
  )
  const { user } = await renderWelcome()
  await fillValidForm(user)
  await user.click(next())

  await screen.findByText('Введите код из SMS')
  expect(useOnboardingStore.getState().draft).toMatchObject({
    apartment: 42,
    block: 1,
    name: 'Алиса',
    phone: '+77071234567',
    role: 'owner',
  })
})
