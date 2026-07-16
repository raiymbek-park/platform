import { screen, waitFor } from '@testing-library/react'
import { beforeEach, expect, test } from 'vitest'

import {
  useAuthMethodStore,
  useOnboardingStore,
  useOtpRequestStore,
} from '@/features/onboarding'
import {
  firebaseAuth,
  renderApp,
  residentMe,
  trpcQueries,
  trpcQueriesError,
  trpcServer,
} from '@/shared/test'

const methodOption = (name: RegExp) => screen.getByRole('button', { name })

const phoneOption = () => methodOption(/По номеру телефона/)
const googleOption = () => methodOption(/^Google/)
const facebookOption = () => methodOption(/^Facebook/)

const confirmButton = () => screen.getByRole('button', { name: /Выбрать/ })

const renderAuthMethod = async () => {
  const app = renderApp('/onboarding/auth-method')
  await screen.findByRole('button', { name: /Выбрать/ })
  return app
}

const serveUnregisteredProfile = () =>
  trpcServer.use(
    trpcQueries({
      'events.list': () => [],
      'resident.me': () => residentMe({ isRegistered: false, name: '' }),
      'serviceContacts.list': () => [],
    }),
  )

beforeEach(() => {
  firebaseAuth.reset()
  useOnboardingStore.getState().reset()
  useOtpRequestStore.getState().clear()
  useAuthMethodStore.setState({ method: null })
})

test('happy-path 1: the screen opens with a welcome hero, three methods, and phone preselected', async () => {
  await renderAuthMethod()

  expect(
    screen.getByRole('heading', { name: 'Добро пожаловать!' }),
  ).toBeInTheDocument()
  expect(screen.getByText(/личное пространство жильцов/)).toBeInTheDocument()
  expect(phoneOption()).toHaveAttribute('aria-pressed', 'true')
  expect(googleOption()).toHaveAttribute('aria-pressed', 'false')
  expect(facebookOption()).toHaveAttribute('aria-pressed', 'false')
  expect(confirmButton()).toBeEnabled()
})

test('happy-path 1: each method carries its own guidance label', async () => {
  await renderAuthMethod()

  expect(
    screen.getByText('Только для операторов Kcell/Activ'),
  ).toBeInTheDocument()
  expect(screen.getAllByText('Быстрый вход с аккаунтом')).toHaveLength(2)
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
  const phone = await screen.findByLabelText('Телефон')
  expect(phone).toHaveValue('')
  expect(phone).toBeEnabled()
  expect(phone).toHaveAttribute('placeholder', '+7 701 123 44 55')
})

test('happy-path 9: confirming Google signs in and opens the form with the profile name', async () => {
  serveUnregisteredProfile()
  firebaseAuth.setPopupDisplayName('Гугл Пользователь')
  const { user, currentPath } = await renderAuthMethod()

  await user.click(googleOption())
  await user.click(confirmButton())

  await waitFor(() => expect(currentPath()).toBe('/onboarding/registration'))
  expect(firebaseAuth.popupProviders()).toEqual(['google'])
  expect(firebaseAuth.isSignedIn()).toBe(true)
  expect(await screen.findByLabelText('Имя')).toHaveValue('Гугл Пользователь')
  expect(screen.getByLabelText('Телефон')).toHaveValue('')
})

test('happy-path 11: confirming Facebook signs in through the Facebook provider', async () => {
  serveUnregisteredProfile()
  firebaseAuth.setPopupDisplayName('Фейсбук Пользователь')
  const { user, currentPath } = await renderAuthMethod()

  await user.click(facebookOption())
  await user.click(confirmButton())

  await waitFor(() => expect(currentPath()).toBe('/onboarding/registration'))
  expect(firebaseAuth.popupProviders()).toEqual(['facebook'])
  expect(await screen.findByLabelText('Имя')).toHaveValue(
    'Фейсбук Пользователь',
  )
})

test('error-states 1: dismissing the Google window leaves the screen untouched and silent', async () => {
  firebaseAuth.failPopup('auth/popup-closed-by-user')
  const { user, currentPath } = await renderAuthMethod()

  await user.click(googleOption())
  await user.click(confirmButton())

  await waitFor(() => expect(confirmButton()).toBeEnabled())
  expect(currentPath()).toBe('/onboarding/auth-method')
  expect(screen.queryByText(/Не удалось/)).not.toBeInTheDocument()
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
  expect(screen.queryByText(/Не удалось/)).not.toBeInTheDocument()
})

test('error-states 2: a blocked sign-in window says so and keeps every method available', async () => {
  firebaseAuth.failPopup('auth/popup-blocked')
  const { user, currentPath } = await renderAuthMethod()

  await user.click(googleOption())
  await user.click(confirmButton())

  expect(
    await screen.findByText(/Не удалось открыть окно входа/),
  ).toBeInTheDocument()
  expect(currentPath()).toBe('/onboarding/auth-method')
  expect(phoneOption()).toBeEnabled()
  expect(googleOption()).toBeEnabled()
  expect(facebookOption()).toBeEnabled()
})

test('error-states 3: a network failure shows a connection error and the method can be taken again', async () => {
  serveUnregisteredProfile()
  firebaseAuth.failPopup('auth/network-request-failed')
  const { user, currentPath } = await renderAuthMethod()

  await user.click(googleOption())
  await user.click(confirmButton())

  expect(
    await screen.findByText(/Не удалось выполнить вход/),
  ).toBeInTheDocument()
  expect(currentPath()).toBe('/onboarding/auth-method')
  expect(firebaseAuth.isSignedIn()).toBe(false)

  firebaseAuth.recoverPopup()
  await user.click(confirmButton())

  await waitFor(() => expect(currentPath()).toBe('/onboarding/registration'))
})

test('validation 22: "Выбрать" cannot start a second provider sign-in while one is in flight', async () => {
  serveUnregisteredProfile()
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

test('edge-cases 4: the method screen without a language choice redirects to the language screen', async () => {
  localStorage.removeItem('locale')
  const { currentPath } = renderApp('/onboarding/auth-method')

  await waitFor(() => expect(currentPath()).toBe('/onboarding/language'))
})

test('edge-cases 19: a signed-in resident without a profile is sent from the method screen to the form', async () => {
  serveUnregisteredProfile()
  firebaseAuth.signInSocial('Гугл Пользователь')
  const { currentPath } = renderApp('/onboarding/auth-method')

  await screen.findByLabelText('Имя')
  expect(currentPath()).toBe('/onboarding/registration')
  expect(screen.queryByText('Выберите способ входа')).not.toBeInTheDocument()
})

test('edge-cases 8: a signed-in registered resident is kept out of the method screen', async () => {
  firebaseAuth.signIn()
  const { currentPath } = renderApp('/onboarding/auth-method')

  await waitFor(() => expect(currentPath()).toBe('/home'))
  expect(screen.queryByText('Выберите способ входа')).not.toBeInTheDocument()
})

test('error-states 14: a profile that cannot be loaded keeps the resident in onboarding', async () => {
  trpcServer.use(trpcQueriesError())
  firebaseAuth.signIn()
  const { currentPath } = renderApp('/onboarding/auth-method')

  await waitFor(() => expect(currentPath()).toBe('/onboarding/registration'), {
    timeout: 4000,
  })
})

test('the back control returns to the language screen', async () => {
  const { user, currentPath } = await renderAuthMethod()

  await user.click(screen.getByRole('button', { name: 'Назад' }))

  await waitFor(() => expect(currentPath()).toBe('/onboarding/language'))
})
