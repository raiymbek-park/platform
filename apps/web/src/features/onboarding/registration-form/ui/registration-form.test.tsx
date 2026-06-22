import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { act } from 'react'
import { beforeEach, expect, test, vi } from 'vitest'

import { useOnboardingStore } from '../model/use-onboarding-store'
import { RegistrationForm } from './registration-form'

// Mock at the network boundary (useSendOtp); real store/validators/form stay.
const mockSendMutate = vi.fn()
const mockSendOtp = {
  isError: false,
  isPending: false,
  mutate: mockSendMutate,
}
vi.mock('../model/use-send-otp', () => ({
  useSendOtp: () => mockSendOtp,
}))

const mockNavigate = vi.fn()
vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => mockNavigate,
}))

// fireEvent.change sets the raw masked value directly — userEvent.type would
// accumulate through the progressive mask.
const VALID_PHONE_RAW = '+77071234567'
const NORMALIZED_PHONE = '+77071234567'

const setPhoneValue = (value: string) => {
  fireEvent.change(screen.getByPlaceholderText('+7 (___) ___-__-__'), {
    target: { value },
  })
}

const renderForm = () => {
  const user = userEvent.setup()
  render(<RegistrationForm />)
  return user
}

const next = () => screen.getByRole('button', { name: /Далее/ })

type FormOverrides = {
  name?: string
  phone?: string
  block?: RegExp
  apartment?: string
  role?: RegExp
}

const fillForm = async (
  user: ReturnType<typeof userEvent.setup>,
  {
    name = 'Алиса',
    phone = VALID_PHONE_RAW,
    block = /Блок 1/,
    apartment = '42',
    role = /Собственник/,
  }: FormOverrides = {},
) => {
  await user.type(screen.getByPlaceholderText('Введите ваше имя'), name)
  setPhoneValue(phone)
  await user.click(screen.getByRole('button', { name: block }))
  await user.type(screen.getByPlaceholderText('142'), apartment)
  await user.click(screen.getByRole('button', { name: role }))
}

beforeEach(() => {
  mockSendOtp.isError = false
  mockSendOtp.isPending = false
  mockSendMutate.mockReset()
  mockNavigate.mockReset()
  act(() => useOnboardingStore.getState().reset())
})

test('validation S1 — a single invalid field keeps Next disabled', async () => {
  const user = renderForm()
  await fillForm(user, { name: 'А' })
  expect(next()).toBeDisabled()
})

test('happy S1 — Next becomes enabled when all fields are valid', async () => {
  const user = renderForm()
  await fillForm(user)
  expect(next()).not.toBeDisabled()
})

test('validation S2 — name of 1 char (trim) keeps Next disabled', async () => {
  const user = renderForm()
  await fillForm(user, { name: 'А' })
  expect(next()).toBeDisabled()
})

test('validation S10 — name of exactly 2 chars enables Next (with other fields valid)', async () => {
  const user = renderForm()
  await fillForm(user, { name: 'Аб' })
  expect(next()).not.toBeDisabled()
})

test('validation S11 — name of 61 chars keeps Next disabled', async () => {
  const user = renderForm()
  await fillForm(user, { name: 'А'.repeat(61) })
  expect(next()).toBeDisabled()
})

test('validation S12 — whitespace-only name keeps Next disabled', async () => {
  const user = renderForm()
  await fillForm(user, { name: '   ' })
  expect(next()).toBeDisabled()
})

test('validation S3 — phone with fewer than 10 local digits keeps Next disabled', async () => {
  const user = renderForm()
  // '+7912345678' → phoneDigits strips leading 7 → '912345678' (9 local digits) → invalid
  await fillForm(user, { phone: '+7912345678' })
  expect(next()).toBeDisabled()
})

test('validation S5 — selecting block 2 deselects block 1', async () => {
  const user = renderForm()

  await user.click(screen.getByRole('button', { name: /Блок 1/ }))
  await user.click(screen.getByRole('button', { name: /Блок 2/ }))

  expect(screen.getByRole('button', { name: /Блок 1/ })).toHaveAttribute(
    'aria-pressed',
    'false',
  )
  expect(screen.getByRole('button', { name: /Блок 2/ })).toHaveAttribute(
    'aria-pressed',
    'true',
  )
})

test('validation S5 — selecting Арендатор deselects Собственник', async () => {
  const user = renderForm()

  await user.click(screen.getByRole('button', { name: /Собственник/ }))
  await user.click(screen.getByRole('button', { name: /Арендатор/ }))

  expect(screen.getByRole('button', { name: /Собственник/ })).toHaveAttribute(
    'aria-pressed',
    'false',
  )
  expect(screen.getByRole('button', { name: /Арендатор/ })).toHaveAttribute(
    'aria-pressed',
    'true',
  )
})

test('validation S4 — apartment 99 outside block 1 range (1–70) keeps Next disabled', async () => {
  const user = renderForm()
  await fillForm(user, { apartment: '99' })
  expect(next()).toBeDisabled()
})

test('validation S14 — switching from block 1 to block 2 invalidates apartment 70', async () => {
  const user = renderForm()
  await fillForm(user, { apartment: '70' })

  await waitFor(() => expect(next()).not.toBeDisabled())

  // Switch to block 2 (range 71–139): apartment 70 auto-revalidates as out of
  // range without touching the apartment field (onChangeListenTo: ['block'])
  await user.click(screen.getByRole('button', { name: /Блок 2/ }))

  await waitFor(() => expect(next()).toBeDisabled())
})

test('happy S2 — submit sends normalized phone, saves draft, navigates to /onboarding/verification', async () => {
  mockSendMutate.mockImplementation(
    (
      _vars: unknown,
      { onSuccess }: { onSuccess: (r: { lockedUntil: null }) => void },
    ) => {
      onSuccess({ lockedUntil: null })
    },
  )
  const user = renderForm()

  await fillForm(user)
  await user.click(next())

  await waitFor(() => {
    expect(mockSendMutate).toHaveBeenCalledWith(
      { phone: NORMALIZED_PHONE },
      expect.any(Object),
    )
  })

  const { draft } = useOnboardingStore.getState()
  expect(draft.name).toBe('Алиса')
  expect(draft.phone).toBe(NORMALIZED_PHONE)
  expect(draft.block).toBe(1)
  expect(draft.apartment).toBe(42)
  expect(draft.role).toBe('owner')

  expect(mockNavigate).toHaveBeenCalledWith({ to: '/onboarding/verification' })
})

test('happy S8 — Next is disabled while otp.send is pending', () => {
  mockSendOtp.isPending = true
  render(<RegistrationForm />)

  expect(next()).toBeDisabled()
})

test('error S4 — a failed otp.send keeps the form and does not navigate', async () => {
  mockSendMutate.mockImplementation(
    (_vars: unknown, { onError }: { onError: (e: unknown) => void }) => {
      onError(new Error('Network error'))
    },
  )
  // Static mock can't self-update — reflect the failed mutation manually.
  mockSendOtp.isError = true
  const user = renderForm()

  await fillForm(user)
  await user.click(next())

  await waitFor(() => {
    expect(mockSendMutate).toHaveBeenCalledWith(
      { phone: NORMALIZED_PHONE },
      expect.any(Object),
    )
  })
  expect(mockNavigate).not.toHaveBeenCalled()
  expect(screen.getByText(/Не удалось отправить код/)).toBeInTheDocument()
})
