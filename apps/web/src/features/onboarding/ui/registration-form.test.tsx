import type { UserEvent } from '@testing-library/user-event'

import { screen, waitFor } from '@testing-library/react'
import { HttpResponse, http } from 'msw'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'

import {
  firebaseAuth,
  renderApp,
  residentMe,
  trpcMutation,
  trpcMutationError,
  trpcQueries,
  trpcServer,
} from '@/shared/test'

import { useAuthMethodStore } from '../model/use-auth-method-store'
import { useOnboardingStore } from '../model/use-onboarding-store'
import { useOtpRequestStore } from '../model/use-otp-request-store'

const next = () => screen.getByRole('button', { name: /Далее/ })

const carrierWarning = () => screen.queryByText(/Код может не дойти/)

const fieldOf = (label: string) => screen.getByLabelText(label).closest('label')

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

const fillFormWithoutPhone = async (user: UserEvent, name = 'Алиса') => {
  await fillName(user, name)
  await pickBlock(user, /Блок 1/)
  await fillApartment(user, '42')
  await pickRole(user, /Собственник/)
}

const renderRegistration = async () => {
  const app = renderApp('/onboarding/registration')
  await screen.findByLabelText('Имя')
  return app
}

const signInWithProvider = (
  displayName: string | null = 'Провайдер Имя',
  { isRegistrationFailing = false } = {},
) => {
  const registered: unknown[] = []
  const server = { isProfileRegistered: false, isRegistrationFailing }
  trpcServer.use(
    trpcQueries({
      'events.list': () => [],
      'resident.me': () =>
        residentMe({ isRegistered: server.isProfileRegistered, name: '' }),
      'serviceContacts.list': () => [],
    }),
    trpcMutation('resident.register', input => {
      if (server.isRegistrationFailing) throw new Error('register unavailable')
      server.isProfileRegistered = true
      registered.push(input)
      return { resident: input }
    }),
  )
  firebaseAuth.signInSocial(displayName)
  return {
    registered,
    recoverRegistration: () => {
      server.isRegistrationFailing = false
    },
  }
}

const recordSentCodes = () => {
  const sends: unknown[] = []
  trpcServer.use(
    trpcMutation('otp.send', input => {
      sends.push(input)
      return { ok: true }
    }),
  )
  return sends
}

const expectPhoneNormalizedOnSubmit = async (
  input: string,
  normalized: string,
) => {
  const sends = recordSentCodes()
  const { user, currentPath } = await renderRegistration()
  await fillValidForm(user, { phone: input })

  await waitFor(() => expect(next()).toBeEnabled())
  await user.click(next())

  await waitFor(() => expect(currentPath()).toBe('/onboarding/verification'))
  expect(sends).toEqual([{ phone: normalized }])
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
  useAuthMethodStore.setState({ method: 'phone' })
})

afterEach(() => {
  vi.useRealTimers()
})

test('validation 1: an invalid field surfaces a toast and blocks navigation until fixed', async () => {
  const { user, currentPath } = await renderRegistration()

  await fillValidForm(user, { name: 'А' })

  await user.click(next())
  expect(
    await screen.findByText('Имя должно быть не короче 2 символов'),
  ).toBeInTheDocument()
  expect(currentPath()).toBe('/onboarding/registration')

  await user.clear(screen.getByLabelText('Имя'))
  await fillName(user, 'Алиса')
  await user.click(next())

  await waitFor(() => expect(currentPath()).toBe('/onboarding/verification'))
})

test('validation 1: "Далее" stays enabled on an empty form', async () => {
  await renderRegistration()

  expect(next()).toBeEnabled()
})

test('validation 2: a valid value shows the inline success check, an invalid one the error state', async () => {
  const { user } = await renderRegistration()

  await fillName(user, 'Алиса')

  expect(
    fieldOf('Имя')?.querySelector('[data-glyph="check"]'),
  ).toBeInTheDocument()

  await user.clear(screen.getByLabelText('Имя'))
  await fillName(user, 'А')
  await user.tab()

  await waitFor(() =>
    expect(
      fieldOf('Имя')?.querySelector('[data-glyph="circle-alert"]'),
    ).toBeInTheDocument(),
  )
})

test('happy-path 3: the phone field starts empty and shows the "+7 701 123 44 55" placeholder', async () => {
  await renderRegistration()

  const phone = screen.getByLabelText('Телефон')
  expect(phone).toHaveValue('')
  expect(phone).toHaveAttribute('placeholder', '+7 701 123 44 55')
  expect(phone).toBeEnabled()
})

test('happy-path 3: typing the first digit leaves only what was typed — the placeholder was never a value', async () => {
  const { user } = await renderRegistration()

  await user.type(screen.getByLabelText('Телефон'), '8')

  expect(screen.getByLabelText('Телефон')).toHaveValue('8')
})

test('the phone field shows a static private indicator', async () => {
  await renderRegistration()

  expect(
    fieldOf('Телефон')?.querySelector('[data-glyph="eye-closed"]'),
  ).toBeInTheDocument()
})

test("edge-cases 11: a returning resident's registration details are pre-filled", async () => {
  useOnboardingStore.getState().setDraft({
    name: 'Борис',
    phone: '+77051112233',
    block: 2,
    apartment: 71,
    role: 'tenant',
  })

  await renderRegistration()

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

test('happy-path 4: submitting sends a code and opens the verification screen', async () => {
  const { user, currentPath } = await renderRegistration()
  await fillValidForm(user)

  await user.click(next())

  await waitFor(() =>
    expect(screen.getByText('Введите код из SMS')).toBeInTheDocument(),
  )
  expect(currentPath()).toBe('/onboarding/verification')
})

test('validation 1: submitting without a role surfaces the role toast', async () => {
  const { user, currentPath } = await renderRegistration()
  await fillName(user, 'Алиса')
  await setPhone(user, '+77071234567')
  await pickBlock(user, /Блок 1/)
  await fillApartment(user, '42')

  await user.click(next())

  expect(await screen.findByText('Выберите роль')).toBeInTheDocument()
  expect(currentPath()).toBe('/onboarding/registration')
})

test('validation 1: submitting without a block shows the block toast and does not send', async () => {
  const { user, currentPath } = await renderRegistration()
  await fillName(user, 'Алиса')
  await setPhone(user, '+77071234567')
  await fillApartment(user, '42')
  await pickRole(user, /Собственник/)

  await user.click(next())

  expect(
    await screen.findByText('Выберите блок', { selector: 'p' }),
  ).toBeInTheDocument()
  expect(currentPath()).toBe('/onboarding/registration')
  expect(screen.queryByText('Введите код из SMS')).not.toBeInTheDocument()
})

test('validation 3: a 1-character name surfaces the name-length toast', async () => {
  const { user } = await renderRegistration()
  await fillValidForm(user, { name: 'А' })

  await user.click(next())

  expect(
    await screen.findByText('Имя должно быть не короче 2 символов'),
  ).toBeInTheDocument()
})

test('validation 3: a 2-character name does not block "Далее"', async () => {
  const { user, currentPath } = await renderRegistration()
  await fillValidForm(user, { name: 'Аб' })

  await user.click(next())

  await waitFor(() => expect(currentPath()).toBe('/onboarding/verification'))
})

test('validation 4: a 61-character name surfaces the name-length toast', async () => {
  const { user } = await renderRegistration()
  await fillValidForm(user, { name: 'А'.repeat(61) })

  await user.click(next())

  expect(
    await screen.findByText('Имя должно быть не длиннее 60 символов'),
  ).toBeInTheDocument()
})

test('validation 4: a 60-character name does not block "Далее"', async () => {
  const { user, currentPath } = await renderRegistration()
  await fillValidForm(user, { name: 'А'.repeat(60) })

  await user.click(next())

  await waitFor(() => expect(currentPath()).toBe('/onboarding/verification'))
})

test('validation 5: a whitespace-only name surfaces the name-length toast', async () => {
  const { user } = await renderRegistration()
  await fillValidForm(user, { name: '   ' })

  await user.click(next())

  expect(
    await screen.findByText('Имя должно быть не короче 2 символов'),
  ).toBeInTheDocument()
})

test('validation 6: a provider-prefilled name cut to one character is still rejected', async () => {
  signInWithProvider('Провайдер Имя')
  const { user, currentPath } = await renderRegistration()
  expect(screen.getByLabelText('Имя')).toHaveValue('Провайдер Имя')

  await user.clear(screen.getByLabelText('Имя'))
  await fillName(user, 'П')
  await pickBlock(user, /Блок 1/)
  await fillApartment(user, '42')
  await pickRole(user, /Собственник/)
  await user.click(next())

  expect(
    await screen.findByText('Имя должно быть не короче 2 символов'),
  ).toBeInTheDocument()
  expect(currentPath()).toBe('/onboarding/registration')
})

test('validation 8: an incomplete phone surfaces the phone toast', async () => {
  const { user } = await renderRegistration()
  await fillValidForm(user, { phone: '+77012 3' })

  await user.click(next())

  expect(
    await screen.findByText('Введите корректный номер'),
  ).toBeInTheDocument()
})

test('validation 7: a domestic 8XXXXXXXXXX phone normalizes to +7 on submit', () =>
  expectPhoneNormalizedOnSubmit('87071234567', '+77071234567'))

test('validation 9: an explicit international number is accepted as dialed', () =>
  expectPhoneNormalizedOnSubmit('+14155552671', '+14155552671'))

test('validation 10: an empty phone on the phone method blocks the submit and sends no code', async () => {
  const sends = recordSentCodes()
  const { user, currentPath } = await renderRegistration()
  await fillFormWithoutPhone(user)

  await user.click(next())

  expect(
    await screen.findByText('Введите корректный номер'),
  ).toBeInTheDocument()
  expect(currentPath()).toBe('/onboarding/registration')
  expect(sends).toHaveLength(0)
})

test('validation 11: an empty phone on the Google channel submits and registers', async () => {
  const { registered } = signInWithProvider()
  const { user, currentPath } = await renderRegistration()
  await user.clear(screen.getByLabelText('Имя'))
  await fillFormWithoutPhone(user)

  await user.click(next())

  await waitFor(() => expect(currentPath()).toBe('/home'))
  expect(registered[0]).toMatchObject({ name: 'Алиса', phone: '' })
})

test('validation 12: a non-empty but invalid phone on the Google channel blocks the submit', async () => {
  signInWithProvider()
  const { user, currentPath } = await renderRegistration()
  await user.clear(screen.getByLabelText('Имя'))
  await fillValidForm(user, { phone: '+77012 3' })

  await user.click(next())

  expect(
    await screen.findByText('Введите корректный номер'),
  ).toBeInTheDocument()
  expect(currentPath()).toBe('/onboarding/registration')
})

test('validation 13: a Kcell/Activ prefix carries no carrier warning', async () => {
  const { user } = await renderRegistration()

  await setPhone(user, '+77011234567')

  expect(carrierWarning()).not.toBeInTheDocument()
})

test('validation 14: a prefix outside Kcell/Activ warns without invalidating the phone', async () => {
  const { user } = await renderRegistration()

  await setPhone(user, '+77051234567')

  expect(await screen.findByText(/Код может не дойти/)).toBeInTheDocument()
  expect(
    fieldOf('Телефон')?.querySelector('[data-glyph="check"]'),
  ).toBeInTheDocument()
})

test('validation 14: the carrier warning never blocks the send', async () => {
  const sends = recordSentCodes()
  const { user, currentPath } = await renderRegistration()
  await fillValidForm(user, { phone: '+77051234567' })
  expect(await screen.findByText(/Код может не дойти/)).toBeInTheDocument()

  await user.click(next())

  await waitFor(() => expect(currentPath()).toBe('/onboarding/verification'))
  expect(sends).toEqual([{ phone: '+77051234567' }])
})

test('validation 15: the carrier prefix is not checked on the Google channel', async () => {
  signInWithProvider()
  const { user } = await renderRegistration()

  await setPhone(user, '+77051234567')

  expect(carrierWarning()).not.toBeInTheDocument()
})

test('validation 16: an empty apartment number surfaces the apartment toast', async () => {
  const { user, currentPath } = await renderRegistration()
  await fillName(user, 'Алиса')
  await setPhone(user, '+77071234567')
  await pickBlock(user, /Блок 1/)
  await pickRole(user, /Собственник/)

  await user.click(next())

  expect(await screen.findByText('Введите номер квартиры')).toBeInTheDocument()
  expect(currentPath()).toBe('/onboarding/registration')
})

test('validation 18: an apartment outside the block range surfaces the apartment toast', async () => {
  const { user } = await renderRegistration()
  await fillValidForm(user, { apartment: '99' })

  await user.click(next())

  expect(
    await screen.findByText('Квартира вне диапазона выбранного блока'),
  ).toBeInTheDocument()
})

test('validation 19: switching block re-validates the apartment number', async () => {
  const { user, currentPath } = await renderRegistration()
  await fillValidForm(user, { apartment: '70' })

  await pickBlock(user, /Блок 2/)
  await user.click(next())

  expect(
    await screen.findByText('Квартира вне диапазона выбранного блока'),
  ).toBeInTheDocument()
  expect(currentPath()).toBe('/onboarding/registration')
})

test('validation 17: the apartment field keeps digits only', async () => {
  const { user } = await renderRegistration()
  await fillApartment(user, '4a2b')

  expect(screen.getByLabelText('Номер квартиры')).toHaveValue('42')
})

test('validation 20: picking a different block clears the previous selection', async () => {
  const { user } = await renderRegistration()

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

test('validation 20: picking a different role clears the previous selection', async () => {
  const { user } = await renderRegistration()

  await pickRole(user, /Собственник/)
  await pickRole(user, /Арендатор/)

  expect(screen.getByRole('button', { name: /Собственник/ })).toHaveAttribute(
    'aria-pressed',
    'false',
  )
  expect(screen.getByRole('button', { name: /Арендатор/ })).toHaveAttribute(
    'aria-pressed',
    'true',
  )
})

test('happy-path 14: "Далее" cannot be submitted twice while the send is in flight', async () => {
  let onStart: () => void = () => {}
  let release: () => void = () => {}
  const sendStarted = new Promise<void>(resolve => {
    onStart = resolve
  })
  const sendHeld = new Promise<void>(resolve => {
    release = resolve
  })
  holdOtpSend(onStart, sendHeld)

  const { user } = await renderRegistration()
  await fillValidForm(user)
  await waitFor(() => expect(next()).toBeEnabled())

  await user.click(next())
  await sendStarted

  expect(next()).toBeDisabled()
  release()
})

test('happy-path 14: inputs and block/role choices are disabled while the send is in flight', async () => {
  let onStart: () => void = () => {}
  let release: () => void = () => {}
  const sendStarted = new Promise<void>(resolve => {
    onStart = resolve
  })
  const sendHeld = new Promise<void>(resolve => {
    release = resolve
  })
  holdOtpSend(onStart, sendHeld)

  const { user } = await renderRegistration()
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

test('error-states 4: a send failure opens the verification screen carrying the error', async () => {
  trpcServer.use(trpcMutationError('otp.send', 'BAD_GATEWAY', 502))
  const { user, currentPath } = await renderRegistration()
  await fillValidForm(user)
  await waitFor(() => expect(next()).toBeEnabled())

  await user.click(next())

  await waitFor(() => expect(currentPath()).toBe('/onboarding/verification'))
  expect(
    await screen.findByText(/Не удалось отправить SMS/),
  ).toBeInTheDocument()
  expect(
    screen.getByRole('button', { name: /Запросить код повторно/ }),
  ).toBeInTheDocument()
})

test('error-states 12: a too-many-requests send routes to the locked screen', async () => {
  trpcServer.use(trpcMutationError('otp.send', 'TOO_MANY_REQUESTS', 429))
  const { user, currentPath } = await renderRegistration()
  await fillValidForm(user)
  await waitFor(() => expect(next()).toBeEnabled())

  await user.click(next())

  await waitFor(() => expect(currentPath()).toBe('/onboarding/locked'))
  expect(await screen.findByText('Доступ заблокирован')).toBeInTheDocument()
})

test('happy-path 9: the Google profile name pre-fills an empty name field and stays editable', async () => {
  signInWithProvider('Гугл Пользователь')
  const { user } = await renderRegistration()

  const name = screen.getByLabelText('Имя')
  expect(name).toHaveValue('Гугл Пользователь')
  expect(name).toBeEnabled()
  expect(screen.getByLabelText('Телефон')).toHaveValue('')

  await user.clear(name)
  await fillName(user, 'Своё Имя')

  expect(name).toHaveValue('Своё Имя')
})

test('happy-path 10: the Google channel registers without sending a code', async () => {
  const { registered } = signInWithProvider()
  const sends = recordSentCodes()
  const { user, currentPath } = await renderRegistration()
  await user.clear(screen.getByLabelText('Имя'))
  await fillValidForm(user)

  await user.click(next())

  await waitFor(() => expect(currentPath()).toBe('/home'))
  expect(sends).toHaveLength(0)
  expect(registered[0]).toMatchObject({
    apartment: 42,
    block: 1,
    name: 'Алиса',
    phone: '+77071234567',
    role: 'owner',
  })
})

test('happy-path 11: the Facebook channel registers the form and lands on home', async () => {
  const { registered } = signInWithProvider('Фейсбук Пользователь')
  const { user, currentPath } = await renderRegistration()
  expect(screen.getByLabelText('Имя')).toHaveValue('Фейсбук Пользователь')

  await user.clear(screen.getByLabelText('Имя'))
  await fillValidForm(user)
  await user.click(next())

  await waitFor(() => expect(currentPath()).toBe('/home'))
  expect(registered[0]).toMatchObject({ name: 'Алиса' })
})

test('happy-path 13: a social-channel phone is registered in canonical E.164 form', async () => {
  const { registered } = signInWithProvider()
  const { user, currentPath } = await renderRegistration()
  await user.clear(screen.getByLabelText('Имя'))
  await fillValidForm(user, { phone: '87071234567' })

  await user.click(next())

  await waitFor(() => expect(currentPath()).toBe('/home'))
  expect(registered[0]).toMatchObject({ phone: '+77071234567' })
})

test('happy-path 16: a name typed before a Google sign-in survives the provider name', async () => {
  useOnboardingStore.getState().setDraft({
    name: 'Своё Имя',
    phone: '',
    block: null,
    apartment: Number.NaN,
    role: null,
  })
  signInWithProvider('Гугл Пользователь')

  await renderRegistration()

  expect(screen.getByLabelText('Имя')).toHaveValue('Своё Имя')
})

test('edge-cases 13: a provider account without a name leaves the field empty and submittable', async () => {
  const { registered } = signInWithProvider(null)
  const { user, currentPath } = await renderRegistration()
  expect(screen.getByLabelText('Имя')).toHaveValue('')

  await fillValidForm(user)
  await user.click(next())

  await waitFor(() => expect(currentPath()).toBe('/home'))
  expect(registered[0]).toMatchObject({ name: 'Алиса' })
})

test('error-states 10: a failed social registration stays on the form and retries on the same session', async () => {
  const { recoverRegistration } = signInWithProvider('Провайдер Имя', {
    isRegistrationFailing: true,
  })
  const { user, currentPath } = await renderRegistration()
  await user.clear(screen.getByLabelText('Имя'))
  await fillValidForm(user)

  await user.click(next())

  expect(
    await screen.findByText(/Не удалось завершить регистрацию/),
  ).toBeInTheDocument()
  expect(currentPath()).toBe('/onboarding/registration')

  recoverRegistration()
  await user.click(screen.getByRole('button', { name: /Повторить попытку/ }))

  await waitFor(() => expect(currentPath()).toBe('/home'))
  expect(firebaseAuth.popupCount()).toBe(0)
})

test('edge-cases 5: the registration form without a chosen method redirects to the method screen', async () => {
  useAuthMethodStore.setState({ method: null })
  const { currentPath } = renderApp('/onboarding/registration')

  await waitFor(() => expect(currentPath()).toBe('/onboarding/auth-method'))
})

test('edge-cases 6: the Google method without a session redirects to the method screen', async () => {
  useAuthMethodStore.setState({ method: 'google' })
  const { currentPath } = renderApp('/onboarding/registration')

  await waitFor(() => expect(currentPath()).toBe('/onboarding/auth-method'))
})

test('edge-cases 9: a signed-in resident without a profile resumes on the registration form', async () => {
  signInWithProvider('Гугл Пользователь')
  const { currentPath } = renderApp('/onboarding/auth-method')

  await screen.findByLabelText('Имя')
  expect(currentPath()).toBe('/onboarding/registration')
  expect(screen.getByLabelText('Имя')).toHaveValue('Гугл Пользователь')
})

test('edge-cases 9: a session alone does not unlock home', async () => {
  signInWithProvider()
  const { currentPath } = renderApp('/home')

  await screen.findByLabelText('Имя')
  expect(currentPath()).toBe('/onboarding/registration')
})
