import type { UserEvent } from '@testing-library/user-event'

import { screen, waitFor } from '@testing-library/react'
import { HttpResponse, http } from 'msw'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'

import {
  firebaseAuth,
  renderApp,
  trpcMutation,
  trpcMutationError,
  trpcServer,
} from '@/shared/test'

import { useOnboardingStore } from '../model/use-onboarding-store'
import { useOtpRequestStore } from '../model/use-otp-request-store'

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

const expectPhoneNormalizedOnSubmit = async (
  input: string,
  normalized: string,
) => {
  const { user, currentPath } = await renderWelcome()
  await fillValidForm(user, { phone: input })

  await waitFor(() => expect(next()).toBeEnabled())
  await user.click(next())

  await waitFor(() => expect(currentPath()).toBe('/onboarding/verification'))
  expect(useOnboardingStore.getState().draft.phone).toBe(normalized)
}

const holdOtpSend = (onStart: () => void, release: Promise<void>) =>
  trpcServer.use(
    http.post('*/otp.send', async () => {
      onStart()
      await release
      return HttpResponse.json([{ result: { data: { ok: true } } }])
    }),
  )

beforeEach(() => {
  firebaseAuth.reset()
  useOnboardingStore.getState().reset()
  useOtpRequestStore.getState().clear()
})

afterEach(() => {
  vi.useRealTimers()
})

test('happy-path 1: an invalid field surfaces a toast and blocks navigation until fixed', async () => {
  const { user, currentPath } = await renderWelcome()

  await fillName(user, 'А')
  await setPhone(user, '+77071234567')
  await pickBlock(user, /Блок 1/)
  await fillApartment(user, '42')
  await pickRole(user, /Собственник/)

  await user.click(next())
  expect(
    await screen.findByText('Имя должно быть не короче 2 символов'),
  ).toBeInTheDocument()
  expect(currentPath()).toBe('/onboarding/welcome')

  await user.clear(screen.getByLabelText('Имя'))
  await fillName(user, 'Алиса')
  await user.click(next())

  await waitFor(() => expect(currentPath()).toBe('/onboarding/verification'))
})

test('the "Далее" button stays enabled on an empty form', async () => {
  await renderWelcome()

  expect(next()).toBeEnabled()
})

test('happy-path 2: the phone field defaults to "+7"', async () => {
  renderWelcome()

  expect(await screen.findByLabelText('Телефон')).toHaveValue('+7')
})

test('the phone field shows a static private indicator', async () => {
  await renderWelcome()

  const phoneField = screen.getByLabelText('Телефон').closest('label')
  expect(
    phoneField?.querySelector('[data-glyph="eye-closed"]'),
  ).toBeInTheDocument()
})

test("edge-cases 5: a returning user's registration details are pre-filled", async () => {
  useOnboardingStore.getState().setDraft({
    name: 'Борис',
    phone: '+77051112233',
    block: 2,
    apartment: 71,
    role: 'tenant',
  })

  await renderWelcome()

  expect(screen.getByLabelText('Имя')).toHaveValue('Борис')
  expect(screen.getByLabelText('Телефон')).toHaveValue('+77051112233')
  expect(screen.getByLabelText('Номер квартиры')).toHaveValue('71')
  expect(screen.getByRole('button', { name: /Блок 2/ })).toHaveAttribute(
    'aria-pressed',
    'true',
  )
  expect(screen.getByRole('button', { name: /Арендатор/ })).toHaveAttribute(
    'aria-pressed',
    'true',
  )
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

test('validation 1: submitting without a role surfaces the role toast', async () => {
  const { user, currentPath } = await renderWelcome()
  await fillName(user, 'Алиса')
  await setPhone(user, '+77071234567')
  await pickBlock(user, /Блок 1/)
  await fillApartment(user, '42')

  await user.click(next())

  expect(await screen.findByText('Выберите роль')).toBeInTheDocument()
  expect(currentPath()).toBe('/onboarding/welcome')
})

test('validation: submitting without a block shows the block toast and does not send', async () => {
  const { user, currentPath } = await renderWelcome()
  await fillName(user, 'Алиса')
  await setPhone(user, '+77071234567')
  await fillApartment(user, '42')
  await pickRole(user, /Собственник/)

  await user.click(next())

  expect(
    await screen.findByText('Выберите блок', { selector: 'p' }),
  ).toBeInTheDocument()
  expect(currentPath()).toBe('/onboarding/welcome')
  expect(screen.queryByText('Введите код из SMS')).not.toBeInTheDocument()
})

test('validation 3: a 1-character name surfaces the name-length toast', async () => {
  const { user } = await renderWelcome()
  await fillValidForm(user, { name: 'А' })

  await user.click(next())

  expect(
    await screen.findByText('Имя должно быть не короче 2 символов'),
  ).toBeInTheDocument()
})

test('validation 3: a 2-character name does not block "Далее"', async () => {
  const { user, currentPath } = await renderWelcome()
  await fillValidForm(user, { name: 'Аб' })

  await user.click(next())

  await waitFor(() => expect(currentPath()).toBe('/onboarding/verification'))
})

test('validation 4: a 61-character name surfaces the name-length toast', async () => {
  const { user } = await renderWelcome()
  await fillValidForm(user, { name: 'А'.repeat(61) })

  await user.click(next())

  expect(
    await screen.findByText('Имя должно быть не длиннее 60 символов'),
  ).toBeInTheDocument()
})

test('validation 4: a 60-character name does not block "Далее"', async () => {
  const { user, currentPath } = await renderWelcome()
  await fillValidForm(user, { name: 'А'.repeat(60) })

  await user.click(next())

  await waitFor(() => expect(currentPath()).toBe('/onboarding/verification'))
})

test('validation 5: a whitespace-only name surfaces the name-length toast', async () => {
  const { user } = await renderWelcome()
  await fillValidForm(user, { name: '   ' })

  await user.click(next())

  expect(
    await screen.findByText('Имя должно быть не короче 2 символов'),
  ).toBeInTheDocument()
})

test('validation 7: an incomplete phone surfaces the phone toast', async () => {
  const { user } = await renderWelcome()
  await fillValidForm(user, { phone: '+770' })

  await user.click(next())

  expect(
    await screen.findByText('Введите корректный номер'),
  ).toBeInTheDocument()
})

test('validation 6: a domestic 8XXXXXXXXXX phone normalizes to +7 on submit', () =>
  expectPhoneNormalizedOnSubmit('87071234567', '+77071234567'))

test('validation 8: an explicit international number is accepted as dialed', () =>
  expectPhoneNormalizedOnSubmit('+14155552671', '+14155552671'))

test('validation 9: an apartment outside the block range surfaces the apartment toast', async () => {
  const { user } = await renderWelcome()
  await fillValidForm(user, { apartment: '99' })

  await user.click(next())

  expect(
    await screen.findByText('Квартира вне диапазона выбранного блока'),
  ).toBeInTheDocument()
})

test('validation 12: switching block re-validates the apartment number', async () => {
  const { user, currentPath } = await renderWelcome()
  await fillValidForm(user, { apartment: '70' })

  await pickBlock(user, /Блок 2/)
  await user.click(next())

  expect(
    await screen.findByText('Квартира вне диапазона выбранного блока'),
  ).toBeInTheDocument()
  expect(currentPath()).toBe('/onboarding/welcome')
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
  holdOtpSend(onStart, sendHeld)

  const { user } = await renderWelcome()
  await fillValidForm(user)
  await waitFor(() => expect(next()).toBeEnabled())

  await user.click(next())
  await sendStarted

  expect(next()).toBeDisabled()
  release()
})

test('inputs and block/role choices are disabled while the send is in flight', async () => {
  let onStart: () => void = () => {}
  let release: () => void = () => {}
  const sendStarted = new Promise<void>(resolve => {
    onStart = resolve
  })
  const sendHeld = new Promise<void>(resolve => {
    release = resolve
  })
  holdOtpSend(onStart, sendHeld)

  const { user } = await renderWelcome()
  await fillValidForm(user)
  await waitFor(() => expect(next()).toBeEnabled())

  await user.click(next())
  await sendStarted

  expect(screen.getByLabelText('Имя')).toBeDisabled()
  expect(screen.getByLabelText('Телефон')).toBeDisabled()
  expect(screen.getByLabelText('Номер квартиры')).toBeDisabled()
  expect(screen.getByRole('button', { name: /Блок 2/ })).toBeDisabled()
  expect(screen.getByRole('button', { name: /Арендатор/ })).toBeDisabled()
  release()
})

test('error-states 1: a send failure keeps the welcome screen and re-enables "Далее"', async () => {
  trpcServer.use(trpcMutationError('otp.send', 'BAD_GATEWAY', 502))
  const { user, currentPath } = await renderWelcome()
  await fillValidForm(user)
  await waitFor(() => expect(next()).toBeEnabled())

  await user.click(next())

  expect(
    await screen.findByText(/Не удалось отправить SMS/),
  ).toBeInTheDocument()
  expect(currentPath()).toBe('/onboarding/welcome')
  await waitFor(() => expect(next()).toBeEnabled())
})

test('error-states 6: a too-many-requests send routes to the locked screen', async () => {
  trpcServer.use(trpcMutationError('otp.send', 'TOO_MANY_REQUESTS', 429))
  const { user, currentPath } = await renderWelcome()
  await fillValidForm(user)
  await waitFor(() => expect(next()).toBeEnabled())

  await user.click(next())

  await waitFor(() => expect(currentPath()).toBe('/onboarding/locked'))
  expect(await screen.findByText('Доступ заблокирован')).toBeInTheDocument()
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
