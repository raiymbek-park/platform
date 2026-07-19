import {
  authFake,
  fake,
  injectFake,
  resetFirestore,
} from '@raiymbek-park/api/testing'
import { screen, waitFor } from '@testing-library/react'
import { HttpResponse, http } from 'msw'
import { afterEach, beforeEach, expect, test } from 'vitest'

import {
  useAuthMethodStore,
  useOnboardingStore,
  useOtpRequestStore,
} from '@/features/onboarding'
import { env } from '@/shared/config'
import { firebaseAuth, trpcServer } from '@/shared/test'
import { renderAppWithServer } from '@/shared/test/render-app-server'

const socialUid = 'social-uid'
const residentUid = 'resident-uid'

const methodOption = (name: RegExp) => screen.getByRole('button', { name })

const phoneOption = () => methodOption(/By phone number/)
const googleOption = () => methodOption(/^Google/)
const facebookOption = () => methodOption(/^Facebook/)

const confirmButton = () => screen.getByRole('button', { name: /Select/ })

const seedRegisteredResident = () =>
  fake.seed(`residents/${residentUid}`, {
    apartment: 42,
    avatarUrl: null,
    block: 1,
    cars: [],
    isPhoneVisible: false,
    name: 'Alice',
    phone: '+77781234455',
    role: 'owner',
  })

const breakProfile = () =>
  trpcServer.use(
    http.get(`${env.apiUrl}/*`, ({ request }) => {
      const url = new URL(request.url)
      if (!url.pathname.includes('resident.me')) return undefined
      const procedures = (url.pathname.split('/').at(-1) ?? '').split(',')
      return HttpResponse.json(
        procedures.map(() => ({
          error: {
            code: -32603,
            data: { code: 'INTERNAL_SERVER_ERROR', httpStatus: 500 },
            message: 'INTERNAL_SERVER_ERROR',
          },
        })),
        { status: 500 },
      )
    }),
  )

const renderAuthMethod = async (uid: string | null = socialUid) => {
  const app = renderAppWithServer('/onboarding/auth-method', { uid })
  await screen.findByRole('button', { name: /Select/ })
  return app
}

beforeEach(() => {
  firebaseAuth.reset()
  fake.reset()
  authFake.reset()
  injectFake()
  useOnboardingStore.getState().reset()
  useOtpRequestStore.getState().clear()
  useAuthMethodStore.setState({ method: null })
})

afterEach(resetFirestore)

test('happy-path 1: the screen opens with a welcome hero, three methods, and phone preselected', async () => {
  await renderAuthMethod()

  expect(screen.getByRole('heading', { name: 'Welcome!' })).toBeInTheDocument()
  expect(screen.getByText(/personal space for residents/)).toBeInTheDocument()
  expect(phoneOption()).toHaveAttribute('aria-pressed', 'true')
  expect(googleOption()).toHaveAttribute('aria-pressed', 'false')
  expect(facebookOption()).toHaveAttribute('aria-pressed', 'false')
  expect(confirmButton()).toBeEnabled()
})

test('happy-path 1: each method carries its own guidance label', async () => {
  await renderAuthMethod()

  expect(screen.getByText('Kcell/Activ operators only')).toBeInTheDocument()
  expect(screen.getAllByText('Quick sign-in with your account')).toHaveLength(2)
})

test('happy-path 2: picking Google leaves exactly one method selected', async () => {
  const { user } = await renderAuthMethod()

  await user.click(googleOption())

  expect(googleOption()).toHaveAttribute('aria-pressed', 'true')
  expect(phoneOption()).toHaveAttribute('aria-pressed', 'false')
  expect(facebookOption()).toHaveAttribute('aria-pressed', 'false')
})

test('happy-path 3: confirming the phone method opens the form without a provider window', async () => {
  const { user, currentPath } = await renderAuthMethod()

  await user.click(confirmButton())

  await waitFor(() => expect(currentPath()).toBe('/onboarding/registration'))
  expect(firebaseAuth.popupCount()).toBe(0)
  const phone = await screen.findByLabelText('Phone')
  expect(phone).toHaveValue('')
  expect(phone).toBeEnabled()
  expect(phone).toHaveAttribute('placeholder', '+7 701 123 44 55')
})

test('happy-path 9: confirming Google signs in and opens the form with the profile name', async () => {
  firebaseAuth.setPopupDisplayName('Google User')
  const { user, currentPath } = await renderAuthMethod()

  await user.click(googleOption())
  await user.click(confirmButton())

  await waitFor(() => expect(currentPath()).toBe('/onboarding/registration'))
  expect(firebaseAuth.popupProviders()).toEqual(['google'])
  expect(firebaseAuth.isSignedIn()).toBe(true)
  expect(await screen.findByLabelText('Name')).toHaveValue('Google User')
  expect(screen.getByLabelText('Phone')).toHaveValue('')
})

test('happy-path 11: confirming Facebook signs in through the Facebook provider', async () => {
  firebaseAuth.setPopupDisplayName('Facebook User')
  const { user, currentPath } = await renderAuthMethod()

  await user.click(facebookOption())
  await user.click(confirmButton())

  await waitFor(() => expect(currentPath()).toBe('/onboarding/registration'))
  expect(firebaseAuth.popupProviders()).toEqual(['facebook'])
  expect(await screen.findByLabelText('Name')).toHaveValue('Facebook User')
})

test('error-states 1: dismissing the Google window leaves the screen untouched and silent', async () => {
  firebaseAuth.failPopup('auth/popup-closed-by-user')
  const { user, currentPath } = await renderAuthMethod()

  await user.click(googleOption())
  await user.click(confirmButton())

  await waitFor(() => expect(confirmButton()).toBeEnabled())
  expect(currentPath()).toBe('/onboarding/auth-method')
  expect(screen.queryByText(/Could not/)).not.toBeInTheDocument()
  expect(googleOption()).toHaveAttribute('aria-pressed', 'true')
  expect(phoneOption()).toBeEnabled()
  expect(facebookOption()).toBeEnabled()
  expect(firebaseAuth.isSignedIn()).toBe(false)
})

test('error-states 1: dismissing the Facebook window leaves the screen untouched and silent', async () => {
  firebaseAuth.failPopup('auth/popup-closed-by-user')
  const { user, currentPath } = await renderAuthMethod()

  await user.click(facebookOption())
  await user.click(confirmButton())

  await waitFor(() => expect(confirmButton()).toBeEnabled())
  expect(currentPath()).toBe('/onboarding/auth-method')
  expect(screen.queryByText(/Could not/)).not.toBeInTheDocument()
})

test('error-states 2: a blocked sign-in window says so and keeps every method available', async () => {
  firebaseAuth.failPopup('auth/popup-blocked')
  const { user, currentPath } = await renderAuthMethod()

  await user.click(googleOption())
  await user.click(confirmButton())

  expect(
    await screen.findByText(/Could not open the sign-in window/),
  ).toBeInTheDocument()
  expect(currentPath()).toBe('/onboarding/auth-method')
  expect(phoneOption()).toBeEnabled()
  expect(googleOption()).toBeEnabled()
  expect(facebookOption()).toBeEnabled()
})

test('error-states 3: a network failure shows a connection error and the method can be taken again', async () => {
  firebaseAuth.failPopup('auth/network-request-failed')
  const { user, currentPath } = await renderAuthMethod()

  await user.click(googleOption())
  await user.click(confirmButton())

  expect(await screen.findByText(/Could not sign in/)).toBeInTheDocument()
  expect(currentPath()).toBe('/onboarding/auth-method')
  expect(firebaseAuth.isSignedIn()).toBe(false)

  firebaseAuth.recoverPopup()
  await user.click(confirmButton())

  await waitFor(() => expect(currentPath()).toBe('/onboarding/registration'))
})

test('validation 22: "Select" cannot start a second provider sign-in while one is in flight', async () => {
  const releasePopup = firebaseAuth.holdPopup()
  const { user } = await renderAuthMethod()
  await user.click(googleOption())

  await user.click(confirmButton())
  await waitFor(() => expect(confirmButton()).toBeDisabled())
  await user.click(confirmButton())

  expect(firebaseAuth.popupCount()).toBe(1)
  expect(confirmButton()).toBeDisabled()
  releasePopup()
})

test('edge-cases 19: a signed-in resident without a profile is sent from the method screen to the form', async () => {
  firebaseAuth.signInSocial('Google User')
  const { currentPath } = renderAppWithServer('/onboarding/auth-method', {
    uid: socialUid,
  })

  await screen.findByLabelText('Name')
  expect(currentPath()).toBe('/onboarding/registration')
  expect(screen.queryByText('Choose a sign-in method')).not.toBeInTheDocument()
})

test('edge-cases 8: a signed-in registered resident is kept out of the method screen', async () => {
  seedRegisteredResident()
  firebaseAuth.signIn()
  const { currentPath } = renderAppWithServer('/onboarding/auth-method', {
    uid: residentUid,
  })

  await waitFor(() => expect(currentPath()).toBe('/home'))
  expect(screen.queryByText('Choose a sign-in method')).not.toBeInTheDocument()
})

test('error-states 14: a profile that cannot be loaded keeps the resident in onboarding', async () => {
  firebaseAuth.signIn()
  const { currentPath } = renderAppWithServer('/onboarding/auth-method', {
    uid: residentUid,
  })
  breakProfile()

  await waitFor(() => expect(currentPath()).toBe('/onboarding/registration'), {
    timeout: 4000,
  })
})

test('the back control returns to the language screen', async () => {
  const { user, currentPath } = await renderAuthMethod()

  await user.click(screen.getByRole('button', { name: 'Back' }))

  await waitFor(() => expect(currentPath()).toBe('/onboarding/language'))
})
