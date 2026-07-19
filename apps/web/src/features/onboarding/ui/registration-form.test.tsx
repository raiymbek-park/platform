import type { UserEvent } from '@testing-library/user-event'

import {
  authFake,
  fake,
  injectFake,
  resetFirestore,
} from '@raiymbek-park/api/testing'
import { screen, waitFor } from '@testing-library/react'
import { HttpResponse, http } from 'msw'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'

import { env } from '@/shared/config'
import { firebaseAuth, trpcServer } from '@/shared/test'
import { renderAppWithServer } from '@/shared/test/render-app-server'

import { useAuthMethodStore } from '../model/use-auth-method-store'
import { useOnboardingStore } from '../model/use-onboarding-store'
import { useOtpRequestStore } from '../model/use-otp-request-store'

const uid = 'social-uid'
const phone = '+77781234455'

const next = () => screen.getByRole('button', { name: /Next/ })

const carrierWarning = () => screen.queryByText(/may not reach this number/)

const fieldOf = (label: string) => screen.getByLabelText(label).closest('label')

const sentTo = (phoneNumber: string) => fake.getDoc(`otps/${phoneNumber}`)

const fillName = (user: UserEvent, value: string) =>
  user.type(screen.getByLabelText('Name'), value)

const setPhone = async (user: UserEvent, value: string) => {
  const field = screen.getByLabelText('Phone')
  await user.clear(field)
  await user.type(field, value)
}

const fillApartment = (user: UserEvent, value: string) =>
  user.type(screen.getByLabelText('Apartment number'), value)

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
    name = 'Alice',
    phone: phoneValue = phone,
    block = /Block 1/,
    apartment = '42',
    role = /Property owner/,
  }: FormOverrides = {},
) => {
  await fillName(user, name)
  await setPhone(user, phoneValue)
  await pickBlock(user, block)
  await fillApartment(user, apartment)
  await pickRole(user, role)
}

const fillFormWithoutPhone = async (user: UserEvent, name = 'Alice') => {
  await fillName(user, name)
  await pickBlock(user, /Block 1/)
  await fillApartment(user, '42')
  await pickRole(user, /Property owner/)
}

const renderRegistration = async () => {
  const app = renderAppWithServer('/onboarding/registration', { uid })
  await screen.findByLabelText('Name')
  return app
}

const storedResident = () => fake.getDoc(`residents/${uid}`)

const holdOtpSend = (onStart: () => void, release: Promise<void>) =>
  trpcServer.use(
    http.post(`${env.apiUrl}/otp.send`, async () => {
      onStart()
      await release
      return HttpResponse.json([{ result: { data: { ok: true } } }])
    }),
  )

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
  vi.useRealTimers()
})

test('validation 1: an invalid field surfaces a toast and blocks navigation until fixed', async () => {
  const { user, currentPath } = await renderRegistration()

  await fillValidForm(user, { name: 'A' })

  await user.click(next())
  expect(currentPath()).toBe('/onboarding/registration')

  await user.clear(screen.getByLabelText('Name'))
  await fillName(user, 'Alice')
  await user.click(next())

  await waitFor(() => expect(currentPath()).toBe('/onboarding/verification'))
})

test('validation 1: "Next" stays enabled on an empty form', async () => {
  await renderRegistration()

  expect(next()).toBeEnabled()
})

test('validation 2: a valid value shows the inline success check, an invalid one the error state', async () => {
  const { user } = await renderRegistration()

  await fillName(user, 'Alice')

  expect(
    fieldOf('Name')?.querySelector('[data-glyph="check"]'),
  ).toBeInTheDocument()

  await user.clear(screen.getByLabelText('Name'))
  await fillName(user, 'A')
  await user.tab()

  await waitFor(() =>
    expect(
      fieldOf('Name')?.querySelector('[data-glyph="circle-alert"]'),
    ).toBeInTheDocument(),
  )
})

test('happy-path 3: the phone field starts empty and shows the "+7 701 123 44 55" placeholder', async () => {
  await renderRegistration()

  const field = screen.getByLabelText('Phone')
  expect(field).toHaveValue('')
  expect(field).toHaveAttribute('placeholder', '+7 701 123 44 55')
  expect(field).toBeEnabled()
})

test('happy-path 3: typing the first digit leaves only what was typed — the placeholder was never a value', async () => {
  const { user } = await renderRegistration()

  await user.type(screen.getByLabelText('Phone'), '8')

  expect(screen.getByLabelText('Phone')).toHaveValue('8')
})

test('the phone field shows a static private indicator', async () => {
  await renderRegistration()

  expect(
    fieldOf('Phone')?.querySelector('[data-glyph="eye-closed"]'),
  ).toBeInTheDocument()
})

test("edge-cases 11: a returning resident's registration details are pre-filled", async () => {
  useOnboardingStore.getState().setDraft({
    name: 'Boris',
    phone: '+77051112233',
    block: 2,
    apartment: 71,
    role: 'tenant',
  })

  await renderRegistration()

  expect(screen.getByLabelText('Name')).toHaveValue('Boris')
  expect(screen.getByLabelText('Phone')).toHaveValue('+77051112233')
  expect(screen.getByLabelText('Apartment number')).toHaveValue('71')
  expect(screen.getByRole('button', { name: /Block 2/ })).toHaveAttribute(
    'aria-pressed',
    'true',
  )
  expect(screen.getByRole('button', { name: /Tenant/ })).toHaveAttribute(
    'aria-pressed',
    'true',
  )
})

test('happy-path 4: submitting sends a code and opens the verification screen', async () => {
  const { user, currentPath } = await renderRegistration()
  await fillValidForm(user)

  await user.click(next())

  await waitFor(() =>
    expect(screen.getByText('Enter the code from the SMS')).toBeInTheDocument(),
  )
  expect(currentPath()).toBe('/onboarding/verification')
  await waitFor(() => expect(sentTo(phone)).toBeTruthy())
})

test('validation 1: submitting without a role surfaces the role toast', async () => {
  const { user, currentPath } = await renderRegistration()
  await fillName(user, 'Alice')
  await setPhone(user, phone)
  await pickBlock(user, /Block 1/)
  await fillApartment(user, '42')

  await user.click(next())

  expect(await screen.findByText('Select a role')).toBeInTheDocument()
  expect(currentPath()).toBe('/onboarding/registration')
})

test('validation 1: submitting without a block shows the block toast and does not send', async () => {
  const { user, currentPath } = await renderRegistration()
  await fillName(user, 'Alice')
  await setPhone(user, phone)
  await fillApartment(user, '42')
  await pickRole(user, /Property owner/)

  await user.click(next())

  expect(
    await screen.findByText('Select a block', { selector: 'p' }),
  ).toBeInTheDocument()
  expect(currentPath()).toBe('/onboarding/registration')
  expect(
    screen.queryByText('Enter the code from the SMS'),
  ).not.toBeInTheDocument()
})

test('validation 3: a 1-character name blocks the submit', async () => {
  const { user, currentPath } = await renderRegistration()
  await fillValidForm(user, { name: 'A' })

  await user.click(next())

  expect(currentPath()).toBe('/onboarding/registration')
  expect(
    screen.queryByText('Enter the code from the SMS'),
  ).not.toBeInTheDocument()
})

test('validation 3: a 2-character name does not block the submit', async () => {
  const { user, currentPath } = await renderRegistration()
  await fillValidForm(user, { name: 'Al' })

  await user.click(next())

  await waitFor(() => expect(currentPath()).toBe('/onboarding/verification'))
})

test('validation 4: a 61-character name blocks the submit', async () => {
  const { user, currentPath } = await renderRegistration()
  await fillValidForm(user, { name: 'A'.repeat(61) })

  await user.click(next())

  expect(currentPath()).toBe('/onboarding/registration')
})

test('validation 4: a 60-character name does not block the submit', async () => {
  const { user, currentPath } = await renderRegistration()
  await fillValidForm(user, { name: 'A'.repeat(60) })

  await user.click(next())

  await waitFor(() => expect(currentPath()).toBe('/onboarding/verification'))
})

test('validation 5: a whitespace-only name blocks the submit', async () => {
  const { user, currentPath } = await renderRegistration()
  await fillValidForm(user, { name: '   ' })

  await user.click(next())

  expect(currentPath()).toBe('/onboarding/registration')
})

test('validation 6: a provider-prefilled name cut to one character is still rejected', async () => {
  firebaseAuth.signInSocial('Provider Name')
  const { user, currentPath } = await renderRegistration()
  expect(screen.getByLabelText('Name')).toHaveValue('Provider Name')

  await user.clear(screen.getByLabelText('Name'))
  await fillName(user, 'P')
  await pickBlock(user, /Block 1/)
  await fillApartment(user, '42')
  await pickRole(user, /Property owner/)
  await user.click(next())

  expect(currentPath()).toBe('/onboarding/registration')
  expect(storedResident()).toBeFalsy()
})

test('validation 8: an incomplete phone blocks the submit', async () => {
  const { user, currentPath } = await renderRegistration()
  await fillValidForm(user, { phone: '+77012 3' })

  await user.click(next())

  expect(currentPath()).toBe('/onboarding/registration')
})

test('validation 7: a domestic 8XXXXXXXXXX phone normalizes to +7 on submit', async () => {
  const { user, currentPath } = await renderRegistration()
  await fillValidForm(user, { phone: '87781234455' })

  await user.click(next())

  await waitFor(() => expect(currentPath()).toBe('/onboarding/verification'))
  await waitFor(() => expect(sentTo('+77781234455')).toBeTruthy())
})

test('validation 9: an explicit international number is accepted as dialed', async () => {
  const { user, currentPath } = await renderRegistration()
  await fillValidForm(user, { phone: '+14155552671' })

  await user.click(next())

  await waitFor(() => expect(currentPath()).toBe('/onboarding/verification'))
  await waitFor(() => expect(sentTo('+14155552671')).toBeTruthy())
})

test('validation 10: an empty phone on the phone method blocks the submit and sends no code', async () => {
  const { user, currentPath } = await renderRegistration()
  await fillFormWithoutPhone(user)

  await user.click(next())

  expect(currentPath()).toBe('/onboarding/registration')
  expect(sentTo(phone)).toBeFalsy()
})

test('validation 11: an empty phone on the Google channel submits and registers', async () => {
  firebaseAuth.signInSocial()
  const { user, currentPath } = await renderRegistration()
  await user.clear(screen.getByLabelText('Name'))
  await fillFormWithoutPhone(user)

  await user.click(next())

  await waitFor(() => expect(currentPath()).toBe('/home'))
  await waitFor(() =>
    expect(storedResident()).toMatchObject({ name: 'Alice', phone: '' }),
  )
})

test('validation 12: a non-empty but invalid phone on the Google channel blocks the submit', async () => {
  firebaseAuth.signInSocial()
  const { user, currentPath } = await renderRegistration()
  await user.clear(screen.getByLabelText('Name'))
  await fillValidForm(user, { phone: '+77012 3' })

  await user.click(next())

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

  expect(
    await screen.findByText(/may not reach this number/),
  ).toBeInTheDocument()
  expect(
    fieldOf('Phone')?.querySelector('[data-glyph="check"]'),
  ).toBeInTheDocument()
})

test('validation 14: the carrier warning never blocks the send', async () => {
  const { user, currentPath } = await renderRegistration()
  await fillValidForm(user, { phone: '+77051234567' })
  expect(
    await screen.findByText(/may not reach this number/),
  ).toBeInTheDocument()

  await user.click(next())

  await waitFor(() => expect(currentPath()).toBe('/onboarding/verification'))
  await waitFor(() => expect(sentTo('+77051234567')).toBeTruthy())
})

test('validation 15: the carrier prefix is not checked on the Google channel', async () => {
  firebaseAuth.signInSocial()
  const { user } = await renderRegistration()

  await setPhone(user, '+77051234567')

  expect(carrierWarning()).not.toBeInTheDocument()
})

test('validation 16: an empty apartment number surfaces the apartment toast', async () => {
  const { user, currentPath } = await renderRegistration()
  await fillName(user, 'Alice')
  await setPhone(user, phone)
  await pickBlock(user, /Block 1/)
  await pickRole(user, /Property owner/)

  await user.click(next())

  expect(
    await screen.findByText('Enter the apartment number'),
  ).toBeInTheDocument()
  expect(currentPath()).toBe('/onboarding/registration')
})

test('validation 18: an apartment outside the block range surfaces the apartment toast', async () => {
  const { user } = await renderRegistration()
  await fillValidForm(user, { apartment: '99' })

  await user.click(next())

  expect(
    await screen.findByText(/outside the selected block/),
  ).toBeInTheDocument()
})

test('validation 19: switching block re-validates the apartment number', async () => {
  const { user, currentPath } = await renderRegistration()
  await fillValidForm(user, { apartment: '70' })

  await pickBlock(user, /Block 2/)
  await user.click(next())

  expect(
    await screen.findByText(/outside the selected block/),
  ).toBeInTheDocument()
  expect(currentPath()).toBe('/onboarding/registration')
})

test('validation 17: the apartment field keeps digits only', async () => {
  const { user } = await renderRegistration()
  await fillApartment(user, '4a2b')

  expect(screen.getByLabelText('Apartment number')).toHaveValue('42')
})

test('validation 20: picking a different block clears the previous selection', async () => {
  const { user } = await renderRegistration()

  await pickBlock(user, /Block 1/)
  await pickBlock(user, /Block 2/)

  expect(screen.getByRole('button', { name: /Block 1/ })).toHaveAttribute(
    'aria-pressed',
    'false',
  )
  expect(screen.getByRole('button', { name: /Block 2/ })).toHaveAttribute(
    'aria-pressed',
    'true',
  )
})

test('validation 20: picking a different role clears the previous selection', async () => {
  const { user } = await renderRegistration()

  await pickRole(user, /Property owner/)
  await pickRole(user, /Tenant/)

  expect(
    screen.getByRole('button', { name: /Property owner/ }),
  ).toHaveAttribute('aria-pressed', 'false')
  expect(screen.getByRole('button', { name: /Tenant/ })).toHaveAttribute(
    'aria-pressed',
    'true',
  )
})

test('happy-path 14: "Next" cannot be submitted twice while the send is in flight', async () => {
  let onStart: () => void = () => {}
  let release: () => void = () => {}
  const sendStarted = new Promise<void>(resolve => {
    onStart = resolve
  })
  const sendHeld = new Promise<void>(resolve => {
    release = resolve
  })

  const { user } = await renderRegistration()
  holdOtpSend(onStart, sendHeld)
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

  const { user } = await renderRegistration()
  holdOtpSend(onStart, sendHeld)
  await fillValidForm(user)
  await waitFor(() => expect(next()).toBeEnabled())

  await user.click(next())
  await sendStarted

  expect(screen.getByLabelText('Name')).toBeDisabled()
  expect(screen.getByLabelText('Phone')).toBeDisabled()
  expect(screen.getByLabelText('Apartment number')).toBeDisabled()
  expect(screen.getByRole('button', { name: /Block 2/ })).toBeDisabled()
  expect(screen.getByRole('button', { name: /Tenant/ })).toBeDisabled()
  release()
})

test('error-states 4: a send failure opens the verification screen carrying the error', async () => {
  const { user, currentPath } = await renderRegistration()
  await fillValidForm(user, { phone: '+77051234567' })
  await waitFor(() => expect(next()).toBeEnabled())

  await user.click(next())

  await waitFor(() => expect(currentPath()).toBe('/onboarding/verification'))
  expect(await screen.findByText(/Could not send the SMS/)).toBeInTheDocument()
  expect(
    screen.getByRole('button', { name: /Resend code/ }),
  ).toBeInTheDocument()
})

test('error-states 12: a rate-limited send routes to the locked screen', async () => {
  fake.seed(`otps/${phone}`, {
    attemptCount: 0,
    codeHash: '',
    createdAt: Date.now(),
    expiresAt: Date.now() + 300_000,
    lastSentAt: Date.now(),
    salt: '',
    sendCount: 1,
    windowStart: Date.now(),
  })
  const { user, currentPath } = await renderRegistration()
  await fillValidForm(user)
  await waitFor(() => expect(next()).toBeEnabled())

  await user.click(next())

  await waitFor(() => expect(currentPath()).toBe('/onboarding/locked'))
  expect(await screen.findByText('Access blocked')).toBeInTheDocument()
})

test('happy-path 9: the Google profile name pre-fills an empty name field and stays editable', async () => {
  firebaseAuth.signInSocial('Google User')
  const { user } = await renderRegistration()

  const name = screen.getByLabelText('Name')
  expect(name).toHaveValue('Google User')
  expect(name).toBeEnabled()
  expect(screen.getByLabelText('Phone')).toHaveValue('')

  await user.clear(name)
  await fillName(user, 'My Name')

  expect(name).toHaveValue('My Name')
})

test('happy-path 10: the Google channel registers without sending a code', async () => {
  firebaseAuth.signInSocial()
  const { user, currentPath } = await renderRegistration()
  await user.clear(screen.getByLabelText('Name'))
  await fillValidForm(user)

  await user.click(next())

  await waitFor(() => expect(currentPath()).toBe('/home'))
  expect(sentTo('+77781234455')).toBeFalsy()
  await waitFor(() =>
    expect(storedResident()).toMatchObject({
      apartment: 42,
      block: 1,
      name: 'Alice',
      phone,
      role: 'owner',
    }),
  )
})

test('happy-path 11: the Facebook channel registers the form and lands on home', async () => {
  firebaseAuth.signInSocial('Facebook User')
  const { user, currentPath } = await renderRegistration()
  expect(screen.getByLabelText('Name')).toHaveValue('Facebook User')

  await user.clear(screen.getByLabelText('Name'))
  await fillValidForm(user)
  await user.click(next())

  await waitFor(() => expect(currentPath()).toBe('/home'))
  await waitFor(() => expect(storedResident()).toMatchObject({ name: 'Alice' }))
})

test('happy-path 13: a social-channel phone is registered in canonical E.164 form', async () => {
  firebaseAuth.signInSocial()
  const { user, currentPath } = await renderRegistration()
  await user.clear(screen.getByLabelText('Name'))
  await fillValidForm(user, { phone: '87071234567' })

  await user.click(next())

  await waitFor(() => expect(currentPath()).toBe('/home'))
  await waitFor(() =>
    expect(storedResident()).toMatchObject({ phone: '+77071234567' }),
  )
})

test('happy-path 16: a name typed before a Google sign-in survives the provider name', async () => {
  useOnboardingStore.getState().setDraft({
    name: 'My Name',
    phone: '',
    block: null,
    apartment: Number.NaN,
    role: null,
  })
  firebaseAuth.signInSocial('Google User')

  await renderRegistration()

  expect(screen.getByLabelText('Name')).toHaveValue('My Name')
})

test('edge-cases 13: a provider account without a name leaves the field empty and submittable', async () => {
  firebaseAuth.signInSocial(null)
  const { user, currentPath } = await renderRegistration()
  expect(screen.getByLabelText('Name')).toHaveValue('')

  await fillValidForm(user)
  await user.click(next())

  await waitFor(() => expect(currentPath()).toBe('/home'))
  await waitFor(() => expect(storedResident()).toMatchObject({ name: 'Alice' }))
})

test('error-states 10: a failed social registration stays on the form and retries on the same session', async () => {
  firebaseAuth.signInSocial('Provider Name')
  const { user, currentPath } = await renderRegistration()
  await user.clear(screen.getByLabelText('Name'))
  await fillValidForm(user)
  trpcServer.use(
    http.post(
      `${env.apiUrl}/resident.register`,
      () =>
        HttpResponse.json(
          [
            {
              error: {
                code: -32603,
                data: { code: 'INTERNAL_SERVER_ERROR', httpStatus: 500 },
                message: 'INTERNAL_SERVER_ERROR',
              },
            },
          ],
          { status: 500 },
        ),
      { once: true },
    ),
  )

  await user.click(next())

  expect(await screen.findByText(/complete registration/)).toBeInTheDocument()
  expect(currentPath()).toBe('/onboarding/registration')

  await user.click(next())

  await waitFor(() => expect(currentPath()).toBe('/home'))
  expect(firebaseAuth.popupCount()).toBe(0)
})

test('edge-cases 5: the registration form without a chosen method redirects to the method screen', async () => {
  useAuthMethodStore.setState({ method: null })
  const { currentPath } = renderAppWithServer('/onboarding/registration', {
    uid,
  })

  await waitFor(() => expect(currentPath()).toBe('/onboarding/auth-method'))
})

test('edge-cases 6: the Google method without a session redirects to the method screen', async () => {
  useAuthMethodStore.setState({ method: 'google' })
  const { currentPath } = renderAppWithServer('/onboarding/registration', {
    uid,
  })

  await waitFor(() => expect(currentPath()).toBe('/onboarding/auth-method'))
})

test('edge-cases 9: a signed-in resident without a profile resumes on the registration form', async () => {
  firebaseAuth.signInSocial('Google User')
  const { currentPath } = renderAppWithServer('/onboarding/auth-method', {
    uid,
  })

  await screen.findByLabelText('Name')
  expect(currentPath()).toBe('/onboarding/registration')
  expect(screen.getByLabelText('Name')).toHaveValue('Google User')
})

test('edge-cases 9: a session alone does not unlock home', async () => {
  firebaseAuth.signInSocial()
  const { currentPath } = renderAppWithServer('/home', { uid })

  await screen.findByLabelText('Name')
  expect(currentPath()).toBe('/onboarding/registration')
})
