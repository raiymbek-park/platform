import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { act } from 'react'
import { beforeEach, expect, test, vi } from 'vitest'

import { useOnboardingStore } from '../model/use-onboarding-store'
import { RegistrationForm } from './registration-form'

// Mock at the network boundary: useSendOtp wraps the tRPC call.
// Real store, real validators, real TanStack Form logic remain.
const mockMutateAsync = vi.fn()
const mockSendOtp = {
  isError: false,
  isPending: false,
  mutateAsync: mockMutateAsync,
}
vi.mock('../model/use-send-otp', () => ({
  useSendOtp: () => mockSendOtp,
}))

const mockNavigate = vi.fn()
vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => mockNavigate,
}))

// The phone field is a controlled masked input. fireEvent.change sets the raw
// stored value directly, bypassing progressive-mask accumulation from userEvent.type.
// Raw value '+77071234567': phoneDigits strips leading 7 → '7071234567' (10 local
// digits) → validatePhone passes, normalizePhone = '+77071234567'.
const VALID_PHONE_RAW = '+77071234567'
const NORMALIZED_PHONE = '+77071234567'

const setPhoneValue = (value: string) => {
  const phoneInput = screen.getByPlaceholderText('+7 (___) ___-__-__')
  fireEvent.change(phoneInput, { target: { value } })
}

const fillValidForm = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.type(screen.getByPlaceholderText('Имя'), 'Алиса')
  setPhoneValue(VALID_PHONE_RAW)
  await user.click(screen.getByRole('button', { name: /Блок 1/ }))
  await user.type(screen.getByPlaceholderText('Номер квартиры'), '42')
  await user.click(screen.getByRole('button', { name: /Собственник/ }))
}

beforeEach(() => {
  mockSendOtp.isError = false
  mockSendOtp.isPending = false
  mockMutateAsync.mockReset()
  mockNavigate.mockReset()
  act(() => useOnboardingStore.getState().reset())
})

// validation S1 — filling one invalid field triggers an error and disables Next
test('validation S1 — a single invalid field keeps Next disabled', async () => {
  const user = userEvent.setup()
  render(<RegistrationForm />)

  // Type a 1-char name (invalid) then fill everything else valid
  await user.type(screen.getByPlaceholderText('Имя'), 'А')
  setPhoneValue(VALID_PHONE_RAW)
  await user.click(screen.getByRole('button', { name: /Блок 1/ }))
  await user.type(screen.getByPlaceholderText('Номер квартиры'), '42')
  await user.click(screen.getByRole('button', { name: /Собственник/ }))

  expect(screen.getByRole('button', { name: /Далее/ })).toBeDisabled()
})

// happy S1 — filling all fields with valid values enables Next
test('happy S1 — Next becomes enabled when all fields are valid', async () => {
  const user = userEvent.setup()
  render(<RegistrationForm />)

  await fillValidForm(user)

  expect(screen.getByRole('button', { name: /Далее/ })).not.toBeDisabled()
})

// validation S2 — name length boundaries
test('validation S2 — name of 1 char (trim) keeps Next disabled', async () => {
  const user = userEvent.setup()
  render(<RegistrationForm />)

  await user.type(screen.getByPlaceholderText('Имя'), 'А')
  setPhoneValue(VALID_PHONE_RAW)
  await user.click(screen.getByRole('button', { name: /Блок 1/ }))
  await user.type(screen.getByPlaceholderText('Номер квартиры'), '42')
  await user.click(screen.getByRole('button', { name: /Собственник/ }))

  expect(screen.getByRole('button', { name: /Далее/ })).toBeDisabled()
})

// validation S10 — name at lower boundary (2 chars) is accepted
test('validation S10 — name of exactly 2 chars enables Next (with other fields valid)', async () => {
  const user = userEvent.setup()
  render(<RegistrationForm />)

  await user.type(screen.getByPlaceholderText('Имя'), 'Аб')
  setPhoneValue(VALID_PHONE_RAW)
  await user.click(screen.getByRole('button', { name: /Блок 1/ }))
  await user.type(screen.getByPlaceholderText('Номер квартиры'), '42')
  await user.click(screen.getByRole('button', { name: /Собственник/ }))

  expect(screen.getByRole('button', { name: /Далее/ })).not.toBeDisabled()
})

// validation S11 — name at upper boundary (61 chars) is rejected
test('validation S11 — name of 61 chars keeps Next disabled', async () => {
  const user = userEvent.setup()
  render(<RegistrationForm />)

  await user.type(screen.getByPlaceholderText('Имя'), 'А'.repeat(61))
  setPhoneValue(VALID_PHONE_RAW)
  await user.click(screen.getByRole('button', { name: /Блок 1/ }))
  await user.type(screen.getByPlaceholderText('Номер квартиры'), '42')
  await user.click(screen.getByRole('button', { name: /Собственник/ }))

  expect(screen.getByRole('button', { name: /Далее/ })).toBeDisabled()
})

// validation S12 — whitespace-only name is rejected
test('validation S12 — whitespace-only name keeps Next disabled', async () => {
  const user = userEvent.setup()
  render(<RegistrationForm />)

  await user.type(screen.getByPlaceholderText('Имя'), '   ')
  setPhoneValue(VALID_PHONE_RAW)
  await user.click(screen.getByRole('button', { name: /Блок 1/ }))
  await user.type(screen.getByPlaceholderText('Номер квартиры'), '42')
  await user.click(screen.getByRole('button', { name: /Собственник/ }))

  expect(screen.getByRole('button', { name: /Далее/ })).toBeDisabled()
})

// validation S3 — phone digit count
test('validation S3 — phone with fewer than 10 local digits keeps Next disabled', async () => {
  const user = userEvent.setup()
  render(<RegistrationForm />)

  await user.type(screen.getByPlaceholderText('Имя'), 'Алиса')
  // '+7912345678' → phoneDigits strips leading 7 → '912345678' (9 local digits) → invalid
  setPhoneValue('+7912345678')
  await user.click(screen.getByRole('button', { name: /Блок 1/ }))
  await user.type(screen.getByPlaceholderText('Номер квартиры'), '42')
  await user.click(screen.getByRole('button', { name: /Собственник/ }))

  expect(screen.getByRole('button', { name: /Далее/ })).toBeDisabled()
})

// validation S5 — single-select block: picking another block deselects the previous
test('validation S5 — selecting block 2 deselects block 1', async () => {
  const user = userEvent.setup()
  render(<RegistrationForm />)

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

// validation S5 — single-select role: picking another role deselects the previous
test('validation S5 — selecting Арендатор deselects Собственник', async () => {
  const user = userEvent.setup()
  render(<RegistrationForm />)

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

// validation S4 — apartment outside block range keeps Next disabled
test('validation S4 — apartment 99 outside block 1 range (1–70) keeps Next disabled', async () => {
  const user = userEvent.setup()
  render(<RegistrationForm />)

  await user.type(screen.getByPlaceholderText('Имя'), 'Алиса')
  setPhoneValue(VALID_PHONE_RAW)
  await user.click(screen.getByRole('button', { name: /Блок 1/ }))
  await user.type(screen.getByPlaceholderText('Номер квартиры'), '99')
  await user.click(screen.getByRole('button', { name: /Собственник/ }))

  expect(screen.getByRole('button', { name: /Далее/ })).toBeDisabled()
})

// validation S14 — changing block re-validates the apartment number
test('validation S14 — switching from block 1 to block 2 invalidates apartment 70', async () => {
  const user = userEvent.setup()
  render(<RegistrationForm />)

  await user.type(screen.getByPlaceholderText('Имя'), 'Алиса')
  setPhoneValue(VALID_PHONE_RAW)
  await user.click(screen.getByRole('button', { name: /Блок 1/ }))
  await user.type(screen.getByPlaceholderText('Номер квартиры'), '70')
  await user.click(screen.getByRole('button', { name: /Собственник/ }))

  // All valid for block 1 (range 1–70)
  await waitFor(() => {
    expect(screen.getByRole('button', { name: /Далее/ })).not.toBeDisabled()
  })

  // Switch to block 2 (range 71–139): apartment 70 auto-revalidates as out of
  // range without touching the apartment field (onChangeListenTo: ['block'])
  await user.click(screen.getByRole('button', { name: /Блок 2/ }))

  await waitFor(() => {
    expect(screen.getByRole('button', { name: /Далее/ })).toBeDisabled()
  })
})

// happy S2 — submit calls otp.send with normalized phone, stores draft+pendingPhone, navigates
test('happy S2 — submit sends normalized phone, saves draft+pendingPhone, navigates to /onboarding/verify', async () => {
  mockMutateAsync.mockResolvedValue({})
  const user = userEvent.setup()
  render(<RegistrationForm />)

  await fillValidForm(user)
  await user.click(screen.getByRole('button', { name: /Далее/ }))

  await waitFor(() => {
    expect(mockMutateAsync).toHaveBeenCalledWith({ phone: NORMALIZED_PHONE })
  })

  const { draft, pendingPhone } = useOnboardingStore.getState()
  expect(draft.name).toBe('Алиса')
  expect(draft.phone).toBe(NORMALIZED_PHONE)
  expect(draft.block).toBe(1)
  expect(draft.apartment).toBe('42')
  expect(draft.role).toBe('owner')
  expect(pendingPhone).toBe(NORMALIZED_PHONE)

  expect(mockNavigate).toHaveBeenCalledWith({ to: '/onboarding/verify' })
})

// happy S8 — Next is disabled while otp.send is in flight
test('happy S8 — Next is disabled while otp.send is pending', async () => {
  mockSendOtp.isPending = true
  render(<RegistrationForm />)

  expect(screen.getByRole('button', { name: /Далее/ })).toBeDisabled()
})

// error S4 — network error: stays on page, shows error callout, Next is re-enabled
test('error S4 — network error shows error callout and does not navigate', async () => {
  // Simulate isError=true from the start (as if a previous attempt failed)
  mockSendOtp.isError = true
  mockMutateAsync.mockRejectedValue(new Error('Network error'))

  render(<RegistrationForm />)

  // Error callout should be visible
  expect(screen.getByText(/Не удалось отправить код/)).toBeInTheDocument()

  // No navigation happened
  expect(mockNavigate).not.toHaveBeenCalled()
})
