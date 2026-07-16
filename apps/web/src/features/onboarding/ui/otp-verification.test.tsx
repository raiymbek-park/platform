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

import { useAuthMethodStore } from '../model/use-auth-method-store'
import { useOnboardingStore } from '../model/use-onboarding-store'
import { useOtpRequestStore } from '../model/use-otp-request-store'

const phone = '+77071234567'

const codeInput = () =>
  screen.getByRole('textbox', { name: 'Код подтверждения' })

const typeCode = (user: UserEvent, code: string) => user.type(codeInput(), code)

const resendButton = () =>
  screen.getByRole('button', { name: /Запросить код повторно/ })

const backButton = () => screen.getByRole('button', { name: 'Назад' })

const fillRegistrationForm = async (user: UserEvent) => {
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
}

const arriveAtVerification = async () => {
  const app = renderApp('/onboarding/registration')
  await fillRegistrationForm(app.user)
  await screen.findByText('Введите код из SMS')
  return app
}

beforeEach(() => {
  firebaseAuth.reset()
  useOnboardingStore.getState().reset()
  useOtpRequestStore.getState().clear()
  useAuthMethodStore.setState({ method: 'phone' })
  sessionStorage.clear()
})

afterEach(() => {
  vi.useRealTimers()
})

test('happy-path 5: the verification screen shows the number, an empty field, and a resend on cooldown', async () => {
  vi.useFakeTimers({ shouldAdvanceTime: true })
  await arriveAtVerification()

  expect(screen.getByText('+7 707 123 45 67')).toBeInTheDocument()
  expect(codeInput()).toHaveValue('')
  expect(codeInput()).toHaveFocus()
  expect(resendButton()).toBeDisabled()
  expect(resendButton()).toHaveTextContent('1:00')
})

test('happy-path 6: the verification screen carries no social sign-in control', async () => {
  await arriveAtVerification()

  expect(
    screen.queryByRole('button', { name: /Продолжить с Google/ }),
  ).not.toBeInTheDocument()
  expect(
    screen.queryByRole('button', { name: /Google/ }),
  ).not.toBeInTheDocument()
  expect(
    screen.queryByRole('button', { name: /Facebook/ }),
  ).not.toBeInTheDocument()
  expect(backButton()).toBeInTheDocument()
})

test('happy-path 7: the code field masks the digits as "xxx - xxx"', async () => {
  const { user } = await arriveAtVerification()

  await user.type(codeInput(), '12345')

  expect(codeInput()).toHaveValue('123 - 45')
})

test('validation 21: the code field accepts digits only, capped at six', async () => {
  const { user } = await arriveAtVerification()

  await user.type(codeInput(), '1a2b3')

  expect(codeInput()).toHaveValue('123')
})

test('happy-path 8: a correct code registers the resident and lands on home', async () => {
  const { user, currentPath } = await arriveAtVerification()

  await typeCode(user, '123456')

  await waitFor(() => expect(currentPath()).toBe('/home'))
  expect(await screen.findByText(/Привет/)).toBeInTheDocument()
})

test('happy-path 8: the sixth digit checks the code with no button tap', async () => {
  const verifications: unknown[] = []
  trpcServer.use(
    trpcMutation('otp.verify', input => {
      verifications.push(input)
      return { token: 'custom-token' }
    }),
  )
  const { user } = await arriveAtVerification()

  await typeCode(user, '12345')
  expect(verifications).toHaveLength(0)

  await typeCode(user, '6')

  await waitFor(() => expect(verifications).toHaveLength(1))
  expect(verifications[0]).toMatchObject({ code: '123456', phone })
})

test('happy-path 8: the registered resident carries the form details to the backend', async () => {
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

test('happy-path 15: a progress notice shows and the actions are disabled while the code is checked', async () => {
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
  expect(backButton()).toBeDisabled()
  expect(resendButton()).toBeDisabled()
})

test('the clipboard-paste affordance no longer exists', async () => {
  await arriveAtVerification()

  expect(
    screen.queryByRole('button', { name: /Вставить/ }),
  ).not.toBeInTheDocument()
})

test('error-states 6: a wrong code shows the wrong-code error and clears the field', async () => {
  trpcServer.use(trpcMutationError('otp.verify', 'BAD_REQUEST', 400))
  const { user, currentPath } = await arriveAtVerification()

  await typeCode(user, '999999')

  expect(await screen.findByText(/Неверный код/)).toBeInTheDocument()
  await waitFor(() => expect(codeInput()).toHaveValue(''))
  expect(currentPath()).toBe('/onboarding/verification')
})

test('error-states 7: a network failure during the check shows the connection error and clears the field', async () => {
  trpcServer.use(http.post('*/otp.verify', () => HttpResponse.error()))
  const { user } = await arriveAtVerification()

  await typeCode(user, '555555')

  expect(
    await screen.findByText(/Не удалось проверить код/),
  ).toBeInTheDocument()
  await waitFor(() => expect(codeInput()).toHaveValue(''))
})

test('error-states 6: after a wrong code, re-entering a correct code confirms again', async () => {
  trpcServer.use(trpcMutationError('otp.verify', 'BAD_REQUEST', 400))
  const { user, currentPath } = await arriveAtVerification()

  await typeCode(user, '111111')
  await screen.findByText(/Неверный код/)
  await waitFor(() => expect(codeInput()).toHaveValue(''))

  trpcServer.resetHandlers()
  await typeCode(user, '123456')

  await waitFor(() => expect(currentPath()).toBe('/home'))
})

test('error-states 8: a failed session sign-in keeps the screen and retries into home', async () => {
  firebaseAuth.failCustomTokenSignIn()
  const { user, currentPath } = await arriveAtVerification()

  await typeCode(user, '123456')

  expect(
    await screen.findByText(/Не удалось выполнить вход/),
  ).toBeInTheDocument()
  expect(currentPath()).toBe('/onboarding/verification')

  firebaseAuth.reset()
  await user.click(screen.getByRole('button', { name: /Повторить попытку/ }))

  await waitFor(() => expect(currentPath()).toBe('/home'))
})

test('error-states 9: a registration failure keeps the verification screen with a retry that recovers', async () => {
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

test('error-states 11: a resend failure keeps the screen and lets the user retry', async () => {
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

test('error-states 12: a too-many-requests resend routes to the locked screen', async () => {
  vi.useFakeTimers({ shouldAdvanceTime: true })
  const { user, currentPath } = await arriveAtVerification()

  await act(() => vi.advanceTimersByTimeAsync(60_000))
  trpcServer.use(trpcMutationError('otp.send', 'TOO_MANY_REQUESTS', 429))
  await user.click(resendButton())

  await waitFor(() => expect(currentPath()).toBe('/onboarding/locked'))
  expect(await screen.findByText('Доступ заблокирован')).toBeInTheDocument()
})

test('error-states 12: a too-many-requests code check routes to the locked screen', async () => {
  trpcServer.use(trpcMutationError('otp.verify', 'TOO_MANY_REQUESTS', 429))
  const { user, currentPath } = await arriveAtVerification()

  await typeCode(user, '999999')

  await waitFor(() => expect(currentPath()).toBe('/onboarding/locked'))
  expect(await screen.findByText('Доступ заблокирован')).toBeInTheDocument()
})

test('error-states 4: a failed send lands on verification and a later resend delivers a code', async () => {
  vi.useFakeTimers({ shouldAdvanceTime: true })
  trpcServer.use(trpcMutationError('otp.send', 'BAD_GATEWAY', 502))
  const app = renderApp('/onboarding/registration')
  await fillRegistrationForm(app.user)

  await screen.findByText('Введите код из SMS')
  expect(
    await screen.findByText(/Не удалось отправить SMS/),
  ).toBeInTheDocument()
  expect(resendButton()).toBeInTheDocument()
  expect(backButton()).toBeEnabled()

  trpcServer.resetHandlers()
  await act(() => vi.advanceTimersByTimeAsync(60_000))
  await app.user.click(resendButton())

  await waitFor(() =>
    expect(app.currentPath()).toBe('/onboarding/verification'),
  )
  expect(codeInput()).toBeEnabled()
})

test('error-states 5: a failed send leaves the resend cooldown counting from 1:00', async () => {
  vi.useFakeTimers({ shouldAdvanceTime: true })
  trpcServer.use(trpcMutationError('otp.send', 'BAD_GATEWAY', 502))
  const app = renderApp('/onboarding/registration')
  await fillRegistrationForm(app.user)
  await screen.findByText('Введите код из SMS')

  expect(resendButton()).toBeDisabled()
  expect(resendButton()).toHaveTextContent('1:00')
})

test('error-states 13: a failed resend re-arms the cooldown at the same step without advancing or locking', async () => {
  vi.useFakeTimers({ shouldAdvanceTime: true })
  const { user, currentPath } = await arriveAtVerification()

  trpcServer.use(trpcMutationError('otp.send', 'BAD_GATEWAY', 502))
  await act(() => vi.advanceTimersByTimeAsync(60_000))
  await user.click(resendButton())
  await screen.findByText(/Не удалось отправить SMS/)

  expect(currentPath()).toBe('/onboarding/verification')
  expect(resendButton()).toBeDisabled()
  expect(resendButton()).toHaveTextContent('1:00')

  trpcServer.resetHandlers()
  await act(() => vi.advanceTimersByTimeAsync(60_000))
  await user.click(resendButton())

  await act(() => vi.advanceTimersByTimeAsync(0))
  expect(resendButton()).toHaveTextContent('2:00')
})

test('edge-cases 3: a successful resend clears the entered code and returns focus', async () => {
  vi.useFakeTimers({ shouldAdvanceTime: true })
  const { user } = await arriveAtVerification()

  await user.type(codeInput(), '12')
  await act(() => vi.advanceTimersByTimeAsync(60_000))
  await user.click(resendButton())

  await waitFor(() => expect(codeInput()).toHaveValue(''))
  await waitFor(() => expect(codeInput()).toHaveFocus())
})

test('edge-cases 1: the resend control is disabled during the cooldown and enables at 0:00', async () => {
  vi.useFakeTimers({ shouldAdvanceTime: true })
  await arriveAtVerification()

  expect(resendButton()).toBeDisabled()
  expect(resendButton()).toHaveTextContent('1:00')

  await act(() => vi.advanceTimersByTimeAsync(60_000))

  expect(resendButton()).toBeEnabled()
})

test('edge-cases 2: the resend cooldown escalates 60 → 120 → 300 → 600 and caps there', async () => {
  vi.useFakeTimers({ shouldAdvanceTime: true })
  const { user } = await arriveAtVerification()

  const resendAfter = async (seconds: number) => {
    await act(() => vi.advanceTimersByTimeAsync(seconds * 1000))
    expect(resendButton()).toBeEnabled()
    await user.click(resendButton())
    await act(() => vi.advanceTimersByTimeAsync(0))
  }

  await resendAfter(60)
  expect(resendButton()).toHaveTextContent('2:00')

  await resendAfter(120)
  expect(resendButton()).toHaveTextContent('5:00')

  await resendAfter(300)
  expect(resendButton()).toHaveTextContent('10:00')

  await resendAfter(600)
  expect(resendButton()).toHaveTextContent('10:00')
})

test('validation 23: the resend control cannot be tapped twice while the request is in flight', async () => {
  vi.useFakeTimers({ shouldAdvanceTime: true })
  const { user } = await arriveAtVerification()

  const resends: unknown[] = []
  trpcServer.use(
    http.post('*/otp.send', async () => {
      resends.push('send')
      await delay('infinite')
      return HttpResponse.json([{ result: { data: { ok: true } } }])
    }),
  )

  await act(() => vi.advanceTimersByTimeAsync(60_000))
  await user.click(resendButton())
  await waitFor(() => expect(resendButton()).toBeDisabled())
  await user.click(resendButton())

  expect(resends).toHaveLength(1)
  expect(resendButton()).toBeDisabled()
})

test('edge-cases 20: the cooldown restarts at 60 s each time the verification screen opens', async () => {
  vi.useFakeTimers({ shouldAdvanceTime: true })
  const { user } = await arriveAtVerification()

  await act(() => vi.advanceTimersByTimeAsync(60_000))
  await user.click(resendButton())
  await act(() => vi.advanceTimersByTimeAsync(0))
  await act(() => vi.advanceTimersByTimeAsync(120_000))
  await user.click(resendButton())
  await act(() => vi.advanceTimersByTimeAsync(0))
  expect(resendButton()).toHaveTextContent('5:00')

  await user.click(backButton())
  await screen.findByLabelText('Имя')
  await user.click(screen.getByRole('button', { name: /Далее/ }))
  await screen.findByText('Введите код из SMS')

  expect(resendButton()).toBeDisabled()
  expect(resendButton()).toHaveTextContent('1:00')
})

test('edge-cases 7: visiting verification without a pending code redirects to the registration form', async () => {
  const { currentPath } = renderApp('/onboarding/verification')

  await screen.findByLabelText('Имя')
  expect(currentPath()).toBe('/onboarding/registration')
})

test('edge-cases 8: a signed-in registered resident visiting onboarding lands on home', async () => {
  firebaseAuth.signIn()
  const { currentPath } = renderApp('/onboarding/registration')

  await waitFor(() => expect(currentPath()).toBe('/home'))
  expect(await screen.findByText(/Привет/)).toBeInTheDocument()
})

test('edge-cases 10: unauthenticated direct navigation to home redirects into onboarding', async () => {
  useAuthMethodStore.setState({ method: null })
  const { currentPath } = renderApp('/home')

  await waitFor(() => expect(currentPath()).toBe('/onboarding/auth-method'))
  expect(screen.queryByText(/Привет/)).not.toBeInTheDocument()
})
