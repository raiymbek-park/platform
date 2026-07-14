import type { UserEvent } from '@testing-library/user-event'

import { act, screen, waitFor } from '@testing-library/react'
import { delay, HttpResponse, http } from 'msw'
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

const phone = '+77071234567'

const codeInput = () =>
  screen.getByRole('textbox', { name: 'Код подтверждения' })

const typeCode = (user: UserEvent, code: string) => user.type(codeInput(), code)

const resendButton = () =>
  screen.getByRole('button', { name: /Запросить код повторно/ })

const arriveAtVerification = async () => {
  const app = renderApp('/onboarding/welcome')
  const { user } = app

  await user.type(await screen.findByLabelText('Имя'), 'Алиса')
  const phoneField = screen.getByLabelText('Телефон')
  await user.clear(phoneField)
  await user.type(phoneField, phone)
  await user.click(screen.getByRole('button', { name: /Блок 1/ }))
  await user.type(screen.getByLabelText('Номер квартиры'), '42')
  await user.click(screen.getByRole('button', { name: /Собственник/ }))

  const submit = screen.getByRole('button', { name: /Далее/ })
  await waitFor(() => expect(submit).toBeEnabled())
  await user.click(submit)

  await screen.findByText('Введите код из SMS')
  return app
}

beforeEach(() => {
  firebaseAuth.reset()
  useOnboardingStore.getState().reset()
  useOtpRequestStore.getState().clear()
  sessionStorage.clear()
})

afterEach(() => {
  vi.useRealTimers()
})

test('happy-path 4: the verification screen shows the number, an empty field, and a resend on cooldown', async () => {
  vi.useFakeTimers({ shouldAdvanceTime: true })
  await arriveAtVerification()

  expect(screen.getByText('+7 707 123 45 67')).toBeInTheDocument()
  expect(codeInput()).toHaveValue('')
  expect(resendButton()).toBeDisabled()
  expect(resendButton()).toHaveTextContent('1:00')
})

test('happy-path 5: the code field masks the digits as "xxx - xxx"', async () => {
  const { user } = await arriveAtVerification()

  await user.type(codeInput(), '12345')

  expect(codeInput()).toHaveValue('123 - 45')
})

test('validation 14: the code field accepts digits only', async () => {
  const { user } = await arriveAtVerification()

  await user.type(codeInput(), '1a2b3')

  expect(codeInput()).toHaveValue('123')
})

test('happy-path 7: a correct code registers the resident and lands on home', async () => {
  const { user, currentPath } = await arriveAtVerification()

  await typeCode(user, '123456')

  await waitFor(() => expect(currentPath()).toBe('/home'))
  expect(await screen.findByText(/Привет/)).toBeInTheDocument()
})

test('happy-path 7: the registered resident carries the draft details to the backend', async () => {
  const received: unknown[] = []
  trpcServer.use(
    trpcMutation('resident.register', input => {
      received.push(input)
      return { resident: input }
    }),
  )
  const { user } = await arriveAtVerification()

  await typeCode(user, '123456')

  await waitFor(() => expect(received).toHaveLength(1))
  expect(received[0]).toMatchObject({
    apartment: 42,
    block: 1,
    name: 'Алиса',
    phone,
    role: 'owner',
  })
})

test('checking: a progress callout shows and the actions are disabled while the code is checked', async () => {
  trpcServer.use(
    http.post('*/resident.register', async () => {
      await delay('infinite')
      return HttpResponse.json([{ result: { data: {} } }])
    }),
  )
  const { user } = await arriveAtVerification()

  await typeCode(user, '123456')

  expect(
    await screen.findByText(/Ваш код отправляется на проверку/),
  ).toBeInTheDocument()
  expect(codeInput()).toBeDisabled()
  expect(screen.getByRole('button', { name: 'Назад' })).toBeDisabled()
  expect(resendButton()).toBeDisabled()
})

test('the clipboard-paste affordance no longer exists', async () => {
  await arriveAtVerification()

  expect(
    screen.queryByRole('button', { name: /Вставить/ }),
  ).not.toBeInTheDocument()
})

test('error-states 2: a wrong code shows the wrong-code error and clears the field', async () => {
  trpcServer.use(trpcMutationError('otp.verify', 'BAD_REQUEST', 400))
  const { user, currentPath } = await arriveAtVerification()

  await typeCode(user, '999999')

  expect(await screen.findByText(/Неверный код/)).toBeInTheDocument()
  await waitFor(() => expect(codeInput()).toHaveValue(''))
  expect(currentPath()).toBe('/onboarding/verification')
})

test('error-states 3: a network failure during the check shows the connection error and clears the field', async () => {
  trpcServer.use(http.post('*/otp.verify', () => HttpResponse.error()))
  const { user } = await arriveAtVerification()

  await typeCode(user, '555555')

  expect(
    await screen.findByText(/Не удалось проверить код/),
  ).toBeInTheDocument()
  await waitFor(() => expect(codeInput()).toHaveValue(''))
})

test('error-states 2: after a wrong code, re-entering a correct code confirms again', async () => {
  trpcServer.use(trpcMutationError('otp.verify', 'BAD_REQUEST', 400))
  const { user, currentPath } = await arriveAtVerification()

  await typeCode(user, '111111')
  await screen.findByText(/Неверный код/)
  await waitFor(() => expect(codeInput()).toHaveValue(''))

  trpcServer.resetHandlers()
  await typeCode(user, '123456')

  await waitFor(() => expect(currentPath()).toBe('/home'))
})

test('error-states 4: a registration failure keeps the verification screen with a retry that recovers', async () => {
  trpcServer.use(trpcMutationError('resident.register'))
  const { user, currentPath } = await arriveAtVerification()

  await typeCode(user, '123456')

  expect(
    await screen.findByText(/Не удалось завершить регистрацию/),
  ).toBeInTheDocument()
  expect(currentPath()).toBe('/onboarding/verification')

  trpcServer.resetHandlers()
  await user.click(screen.getByRole('button', { name: /Повторить попытку/ }))

  await waitFor(() => expect(currentPath()).toBe('/home'))
})

test('error-states 5: a resend failure keeps the screen and lets the user retry', async () => {
  vi.useFakeTimers({ shouldAdvanceTime: true })
  const { user, currentPath } = await arriveAtVerification()

  await act(() => vi.advanceTimersByTimeAsync(60_000))
  trpcServer.use(trpcMutationError('otp.send', 'BAD_GATEWAY', 502))
  await user.click(resendButton())

  expect(
    await screen.findByText(/Не удалось отправить SMS/),
  ).toBeInTheDocument()
  expect(currentPath()).toBe('/onboarding/verification')
})

test('error-states 6: a too-many-requests resend routes to the locked screen', async () => {
  vi.useFakeTimers({ shouldAdvanceTime: true })
  const { user, currentPath } = await arriveAtVerification()

  await act(() => vi.advanceTimersByTimeAsync(60_000))
  trpcServer.use(trpcMutationError('otp.send', 'TOO_MANY_REQUESTS', 429))
  await user.click(resendButton())

  await waitFor(() => expect(currentPath()).toBe('/onboarding/locked'))
  expect(await screen.findByText('Доступ заблокирован')).toBeInTheDocument()
})

test('error-states 6: a too-many-requests code check routes to the locked screen', async () => {
  trpcServer.use(trpcMutationError('otp.verify', 'TOO_MANY_REQUESTS', 429))
  const { user, currentPath } = await arriveAtVerification()

  await typeCode(user, '999999')

  await waitFor(() => expect(currentPath()).toBe('/onboarding/locked'))
  expect(await screen.findByText('Доступ заблокирован')).toBeInTheDocument()
})

test('edge-cases 1: a successful resend clears the entered code and returns focus', async () => {
  vi.useFakeTimers({ shouldAdvanceTime: true })
  const { user } = await arriveAtVerification()

  await user.type(codeInput(), '12')
  await act(() => vi.advanceTimersByTimeAsync(60_000))
  await user.click(resendButton())

  await waitFor(() => expect(codeInput()).toHaveValue(''))
  await waitFor(() => expect(codeInput()).toHaveFocus())
})

test('edge-cases 2: the resend control is disabled during the cooldown and enables at 0:00', async () => {
  vi.useFakeTimers({ shouldAdvanceTime: true })
  await arriveAtVerification()

  expect(resendButton()).toBeDisabled()
  expect(resendButton()).toHaveTextContent('1:00')

  await act(() => vi.advanceTimersByTimeAsync(60_000))

  expect(resendButton()).toBeEnabled()
})

test('edge-cases 3: the resend cooldown escalates 60 → 120 across resends', async () => {
  vi.useFakeTimers({ shouldAdvanceTime: true })
  const { user } = await arriveAtVerification()

  await act(() => vi.advanceTimersByTimeAsync(60_000))
  expect(resendButton()).toBeEnabled()

  await user.click(resendButton())
  await act(() => vi.advanceTimersByTimeAsync(0))
  expect(resendButton()).toHaveTextContent('2:00')

  await act(() => vi.advanceTimersByTimeAsync(60_000))
  expect(resendButton()).toBeDisabled()
  await act(() => vi.advanceTimersByTimeAsync(60_000))
  expect(resendButton()).toBeEnabled()
})

const googleButton = () =>
  screen.getByRole('button', { name: /Продолжить с Google/ })

test('happy-path 11: the Google control is enabled the moment the screen opens', async () => {
  vi.useFakeTimers({ shouldAdvanceTime: true })
  await arriveAtVerification()

  expect(resendButton()).toBeDisabled()
  expect(googleButton()).toBeEnabled()
})

test('happy-path 10: continuing with Google registers the draft and lands on home', async () => {
  const received: unknown[] = []
  trpcServer.use(
    trpcMutation('resident.register', input => {
      received.push(input)
      return { resident: input }
    }),
  )
  const { user, currentPath } = await arriveAtVerification()

  await user.click(googleButton())

  await waitFor(() => expect(currentPath()).toBe('/home'))
  expect(received[0]).toMatchObject({
    apartment: 42,
    block: 1,
    name: 'Алиса',
    phone,
    role: 'owner',
  })
})

test('error-states 8: dismissing the Google window leaves the screen untouched', async () => {
  firebaseAuth.failGooglePopup('auth/popup-closed-by-user')
  const { user, currentPath } = await arriveAtVerification()

  await user.type(codeInput(), '123')
  await user.click(googleButton())

  await waitFor(() => expect(googleButton()).toBeEnabled())
  expect(currentPath()).toBe('/onboarding/verification')
  expect(codeInput()).toHaveValue('123')
  expect(screen.queryByText(/Не удалось/)).not.toBeInTheDocument()
  expect(resendButton()).toBeInTheDocument()
})

test('error-states 9: a blocked sign-in window says so and keeps both channels working', async () => {
  firebaseAuth.failGooglePopup('auth/popup-blocked')
  const { user, currentPath } = await arriveAtVerification()

  await user.click(googleButton())

  expect(
    await screen.findByText(/Не удалось открыть окно входа Google/),
  ).toBeInTheDocument()
  expect(currentPath()).toBe('/onboarding/verification')
  expect(googleButton()).toBeEnabled()
  expect(codeInput()).toBeEnabled()
})

test('error-states 10: a Google network failure shows a connection error and a retry starts clean', async () => {
  firebaseAuth.failGooglePopup('auth/network-request-failed')
  const { user, currentPath } = await arriveAtVerification()

  await user.click(googleButton())

  expect(
    await screen.findByText(/Не удалось войти через Google/),
  ).toBeInTheDocument()
  expect(currentPath()).toBe('/onboarding/verification')

  firebaseAuth.recoverGooglePopup()
  await user.click(googleButton())

  await waitFor(() => expect(currentPath()).toBe('/home'))
})

test('error-states 11: a registration failure after Google offers a retry that reuses the session', async () => {
  trpcServer.use(trpcMutationError('resident.register'))
  const { user, currentPath } = await arriveAtVerification()

  await user.click(googleButton())

  expect(
    await screen.findByText(/Не удалось завершить регистрацию/),
  ).toBeInTheDocument()
  expect(currentPath()).toBe('/onboarding/verification')

  trpcServer.resetHandlers()
  await user.click(screen.getByRole('button', { name: /Повторить попытку/ }))

  await waitFor(() => expect(currentPath()).toBe('/home'))
  expect(firebaseAuth.googlePopupCount()).toBe(1)
})

test('edge-cases 2: visiting verification without a pending code redirects to welcome', async () => {
  const { currentPath } = renderApp('/onboarding/verification')

  await screen.findByLabelText('Имя')
  expect(currentPath()).toBe('/onboarding/welcome')
})

test('edge-cases 4: a signed-in resident visiting onboarding lands on home', async () => {
  firebaseAuth.signIn()
  const { currentPath } = renderApp('/onboarding/welcome')

  await waitFor(() => expect(currentPath()).toBe('/home'))
  expect(await screen.findByText(/Привет/)).toBeInTheDocument()
})

test('edge-cases 3: unauthenticated direct navigation to home redirects to welcome', async () => {
  const { currentPath } = renderApp('/home')

  await screen.findByLabelText('Имя')
  expect(currentPath()).toBe('/onboarding/welcome')
})
