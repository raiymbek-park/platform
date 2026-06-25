import type { UserEvent } from '@testing-library/user-event'

import { act, fireEvent, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'

import { stubClipboard } from '@/shared/test/clipboard'
import { firebaseAuth } from '@/shared/test/firebase-auth'
import { renderApp } from '@/shared/test/render-app'
import {
  trpcMutation,
  trpcMutationError,
  trpcServer,
} from '@/shared/test/trpc-server'

import { useConfirmationStore } from '../model/use-confirmation-store'
import { useOnboardingStore } from '../model/use-onboarding-store'

const phone = '+77071234567'

const cells = () => screen.getAllByRole('textbox')

const cell = (index: number) => {
  const node = cells()[index]
  if (!node) throw new Error(`No OTP cell at index ${index}`)
  return node
}

const expectCellsEmpty = () =>
  cells().forEach(node => {
    expect(node).toHaveValue('')
  })

const typeCode = (user: UserEvent, code: string) =>
  [...code].reduce(
    (chain, digit, index) => chain.then(() => user.type(cell(index), digit)),
    Promise.resolve(),
  )

const resendButton = () =>
  screen.getByRole('button', { name: /Запросить пин повторно/ })

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

const revealClipboardCode = (code: string) => {
  stubClipboard(code)
  fireEvent(window, new Event('focus'))
}

beforeEach(() => {
  firebaseAuth.reset()
  stubClipboard(null)
  useOnboardingStore.getState().reset()
  useConfirmationStore.getState().clear()
  sessionStorage.clear()
})

afterEach(() => {
  vi.useRealTimers()
})

test('happy-path 4: the verification screen shows the number and six empty cells', async () => {
  await arriveAtVerification()

  expect(screen.getByText('+7 707 123 45 67')).toBeInTheDocument()
  expect(cells()).toHaveLength(6)
  expectCellsEmpty()
})

test('happy-path 5: typing a digit advances focus to the next cell', async () => {
  const { user } = await arriveAtVerification()

  await user.type(cell(0), '1')

  expect(cell(1)).toHaveFocus()
})

test('happy-path 6: backspace on an empty cell moves focus to the previous cell', async () => {
  const { user } = await arriveAtVerification()

  await user.click(cell(1))
  await user.keyboard('{Backspace}')

  expect(cell(0)).toHaveFocus()
})

test('validation 14: a code cell holds only one digit', async () => {
  await arriveAtVerification()

  fireEvent.change(cell(0), { target: { value: '12' } })

  expect(cell(0)).toHaveValue('2')
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

test('happy-path 9: pasting a clipboard code fills the cells, confirms, and lands on home', async () => {
  const { user, currentPath } = await arriveAtVerification()
  revealClipboardCode('432109')

  await user.click(
    await screen.findByRole('button', { name: /Вставить код из буфера/ }),
  )

  await waitFor(() => expect(currentPath()).toBe('/home'))
  expect(await screen.findByText(/Привет/)).toBeInTheDocument()
})

test('error-states 2: a wrong code shows the wrong-code error and clears the cells', async () => {
  firebaseAuth.rejectCodeAsWrong()
  const { user, currentPath } = await arriveAtVerification()

  await typeCode(user, '999999')

  expect(await screen.findByText(/Неверный код/)).toBeInTheDocument()
  await waitFor(() => expectCellsEmpty())
  expect(currentPath()).toBe('/onboarding/verification')
})

test('error-states 3: a network failure during the check shows the connection error and clears the cells', async () => {
  firebaseAuth.rejectCodeWithNetworkError()
  const { user } = await arriveAtVerification()

  await typeCode(user, '555555')

  expect(
    await screen.findByText(/Не удалось проверить код/),
  ).toBeInTheDocument()
  await waitFor(() => expectCellsEmpty())
})

test('error-states 2: after a wrong code, re-entering a correct code confirms again', async () => {
  firebaseAuth.rejectCodeAsWrong()
  const { user, currentPath } = await arriveAtVerification()

  await typeCode(user, '111111')
  await screen.findByText(/Неверный код/)
  await waitFor(() => expect(cell(0)).toHaveValue(''))

  firebaseAuth.reset()
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
  firebaseAuth.failSend()

  await user.click(resendButton())

  expect(
    await screen.findByText(/Не удалось проверить код/),
  ).toBeInTheDocument()
  expect(currentPath()).toBe('/onboarding/verification')
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

test('edge-cases 4: a successful resend clears the entered cells', async () => {
  vi.useFakeTimers({ shouldAdvanceTime: true })
  const { user } = await arriveAtVerification()

  await user.type(cell(0), '1')
  await user.type(cell(1), '2')

  await act(() => vi.advanceTimersByTimeAsync(60_000))
  await user.click(resendButton())
  await act(() => vi.advanceTimersByTimeAsync(0))

  expectCellsEmpty()
})

test('edge-cases 5: a detected clipboard code replaces the resend control with the paste action', async () => {
  await arriveAtVerification()
  revealClipboardCode('246802')

  expect(
    await screen.findByRole('button', { name: /Вставить код из буфера/ }),
  ).toBeInTheDocument()
  expect(
    screen.queryByRole('button', { name: /Запросить пин повторно/ }),
  ).not.toBeInTheDocument()
})

test('edge-cases 8: visiting verification without a pending code redirects to welcome', async () => {
  const { currentPath } = renderApp('/onboarding/verification')

  await screen.findByLabelText('Имя')
  expect(currentPath()).toBe('/onboarding/welcome')
})

test('edge-cases 10: a signed-in resident visiting onboarding lands on home', async () => {
  firebaseAuth.signIn()
  const { currentPath } = renderApp('/onboarding/welcome')

  await waitFor(() => expect(currentPath()).toBe('/home'))
  expect(await screen.findByText(/Привет/)).toBeInTheDocument()
})

test('edge-cases 9: unauthenticated direct navigation to home redirects to welcome', async () => {
  const { currentPath } = renderApp('/home')

  await screen.findByLabelText('Имя')
  expect(currentPath()).toBe('/onboarding/welcome')
})
