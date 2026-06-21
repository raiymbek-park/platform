import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { act } from 'react'
import { beforeEach, expect, test, vi } from 'vitest'

import { useOnboardingStore } from '@/features/onboarding/registration-form'
import { useAuthStore } from '@/shared/auth'

// ---------------------------------------------------------------------------
// Network boundary mocks — mock at the model hooks, keep real stores and lib
// ---------------------------------------------------------------------------

const mockVerifyMutateAsync = vi.fn()
const mockVerifyOtp = {
  isPending: false,
  mutateAsync: mockVerifyMutateAsync,
}
vi.mock('../model/use-verify-otp', () => ({
  useVerifyOtp: () => mockVerifyOtp,
}))

const mockRegisterMutateAsync = vi.fn()
const mockRegisterResident = {
  isPending: false,
  mutateAsync: mockRegisterMutateAsync,
}
vi.mock('../model/use-register-resident', () => ({
  useRegisterResident: () => mockRegisterResident,
}))

const mockResendMutateAsync = vi.fn()
const mockResendOtp = {
  isPending: false,
  mutateAsync: mockResendMutateAsync,
}
vi.mock('../model/use-resend-otp', () => ({
  useResendOtp: () => mockResendOtp,
}))

const mockStatusRefetch = vi.fn()
const mockOtpStatus = {
  data: null as { resendAvailableAt: number } | null,
  refetch: mockStatusRefetch,
}
vi.mock('../model/use-otp-status', () => ({
  useOtpStatus: () => mockOtpStatus,
}))

// Clipboard — return null by default (button disabled); override per test
vi.mock('../lib/use-clipboard-code', () => ({
  useClipboardCode: () => mockClipboardCode,
}))
let mockClipboardCode: string | null = null

const mockNavigate = vi.fn()
vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => mockNavigate,
}))

import { OtpVerify } from './otp-verify'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const PENDING_PHONE = '+77071234567'

const tokenPair = {
  accessToken: 'access-tok',
  accessTokenExpiresAt: Date.now() + 3600_000,
  refreshToken: 'refresh-tok',
  refreshTokenExpiresAt: Date.now() + 86400_000,
}

/** Fresh-query the OTP cell at position `index`, asserting it exists. */
const cellAt = (index: number) => {
  const cell = screen.getAllByRole('textbox')[index]
  if (!cell) throw new Error(`No OTP cell at index ${index}`)
  return cell
}

/** Seed the onboarding store with a valid draft so OtpVerify has pendingPhone + draft. */
const seedStore = () => {
  act(() => {
    useOnboardingStore.getState().setDraft({
      name: 'Алиса',
      phone: PENDING_PHONE,
      block: 1,
      apartment: '42',
      role: 'owner',
    })
    useOnboardingStore.getState().setPendingPhone(PENDING_PHONE)
  })
}

/** Type one digit into the cell at position `index` (0-based). */
const typeDigit = (
  user: ReturnType<typeof userEvent.setup>,
  index: number,
  digit: string,
) => user.type(cellAt(index), digit)

/** Fill the cells in order, one digit per cell. */
const fillCells = (user: ReturnType<typeof userEvent.setup>, digits: string) =>
  digits
    .split('')
    .reduce(
      (chain, digit, index) => chain.then(() => typeDigit(user, index, digit)),
      Promise.resolve(),
    )

// ---------------------------------------------------------------------------
// Setup / teardown
// ---------------------------------------------------------------------------

beforeEach(() => {
  // Reset mocks
  mockVerifyOtp.isPending = false
  mockVerifyMutateAsync.mockReset()
  mockRegisterResident.isPending = false
  mockRegisterMutateAsync.mockReset()
  mockResendOtp.isPending = false
  mockResendMutateAsync.mockReset()
  mockOtpStatus.data = null
  mockStatusRefetch.mockReset()
  mockNavigate.mockReset()
  mockClipboardCode = null

  // Reset stores
  act(() => {
    useOnboardingStore.getState().reset()
    useAuthStore.getState().clear()
  })

  // Default: status has 60s cooldown remaining
  mockOtpStatus.data = { resendAvailableAt: Date.now() + 60_000 }
})

// ---------------------------------------------------------------------------
// happy S3 — phone display format
// ---------------------------------------------------------------------------

test('happy S3 — displays pending phone in format +7 707 123 45 67', () => {
  seedStore()
  render(<OtpVerify />)

  expect(screen.getByText('+7 707 123 45 67')).toBeInTheDocument()
})

test('happy S3 — shows 4 empty cells and countdown label on load', () => {
  seedStore()
  render(<OtpVerify />)

  const inputs = screen.getAllByRole('textbox')
  expect(inputs).toHaveLength(4)
  inputs.forEach(input => {
    expect(input).toHaveValue('')
  })

  expect(screen.getByText(/Повторная отправка через/)).toBeInTheDocument()
  expect(
    screen.getByRole('button', { name: /Вставить код из буфера/ }),
  ).toBeInTheDocument()
})

// ---------------------------------------------------------------------------
// happy S4 — auto-advance on digit entry
// ---------------------------------------------------------------------------

test('happy S4 — typing a digit advances focus to the next cell', async () => {
  seedStore()
  const user = userEvent.setup()
  render(<OtpVerify />)

  // Type into first cell — focus should move to second
  await typeDigit(user, 0, '1')
  expect(cellAt(1)).toHaveFocus()
})

test('happy S4 — after the fourth digit focus stays on the fourth cell', async () => {
  // Never-resolving promise: verify fires but hangs, so the cells stay filled
  // and focus remains on the 4th cell (no rejection clears or refocuses)
  mockVerifyMutateAsync.mockReturnValue(new Promise(() => {}))
  seedStore()
  const user = userEvent.setup()
  render(<OtpVerify />)

  await fillCells(user, '1234')

  // After typing the 4th digit, focus stays on the 4th cell (auto-advance only goes to next)
  expect(cellAt(3)).toHaveFocus()
})

// ---------------------------------------------------------------------------
// validation S6 — single digit per cell
// ---------------------------------------------------------------------------

test('validation S6 — non-digit character is ignored, cell stays empty', () => {
  seedStore()
  render(<OtpVerify />)

  // OtpInput uses inputMode=numeric and its onChange strips non-digits via lastDigit()
  // Firing change with a non-digit value produces empty string → cell stays empty
  fireEvent.change(cellAt(0), { target: { value: 'a' } })

  expect(cellAt(0)).toHaveValue('')
})

// ---------------------------------------------------------------------------
// happy S10 — backspace focus movement
// ---------------------------------------------------------------------------

test('happy S10 — backspace on empty second cell moves focus to first cell', async () => {
  seedStore()
  const user = userEvent.setup()
  render(<OtpVerify />)

  // Focus second cell manually, then press Backspace
  await user.click(cellAt(1))
  await user.keyboard('{Backspace}')

  expect(cellAt(0)).toHaveFocus()
})

test('happy S10 — backspace on empty first cell keeps focus on first cell', async () => {
  seedStore()
  const user = userEvent.setup()
  render(<OtpVerify />)

  cellAt(0).focus()
  await user.keyboard('{Backspace}')

  expect(cellAt(0)).toHaveFocus()
})

// ---------------------------------------------------------------------------
// happy S5 — auto-check on 4th digit, register, tokens saved, navigate /home
// ---------------------------------------------------------------------------

test('happy S5 — entering 4 digits triggers verify automatically', async () => {
  mockVerifyMutateAsync.mockResolvedValue({ verified: true })
  mockRegisterMutateAsync.mockResolvedValue(tokenPair)
  seedStore()
  const user = userEvent.setup()
  render(<OtpVerify />)

  await fillCells(user, '1234')

  await waitFor(() =>
    expect(mockVerifyMutateAsync).toHaveBeenCalledWith({
      code: '1234',
      phone: PENDING_PHONE,
    }),
  )
})

test('happy S5 — after verify succeeds, resident is registered with draft data', async () => {
  mockVerifyMutateAsync.mockResolvedValue({ verified: true })
  mockRegisterMutateAsync.mockResolvedValue(tokenPair)
  seedStore()
  const user = userEvent.setup()
  render(<OtpVerify />)

  await fillCells(user, '5678')

  await waitFor(() =>
    expect(mockRegisterMutateAsync).toHaveBeenCalledWith({
      apartment: 42,
      block: '1',
      name: 'Алиса',
      phone: PENDING_PHONE,
      role: 'owner',
    }),
  )
})

test('happy S5 — tokens are saved to authStore and app navigates to /home', async () => {
  mockVerifyMutateAsync.mockResolvedValue({ verified: true })
  mockRegisterMutateAsync.mockResolvedValue(tokenPair)
  seedStore()
  const user = userEvent.setup()
  render(<OtpVerify />)

  await fillCells(user, '1234')

  await waitFor(() => {
    expect(useAuthStore.getState().tokens).toEqual(tokenPair)
    expect(mockNavigate).toHaveBeenCalledWith({ to: '/home' })
  })
})

// ---------------------------------------------------------------------------
// happy S7 — paste from clipboard fills cells and triggers auto-check
// ---------------------------------------------------------------------------

test('happy S7 — paste button fills cells with clipboard code and triggers verify', async () => {
  mockClipboardCode = '4321'
  mockVerifyMutateAsync.mockResolvedValue({ verified: true })
  mockRegisterMutateAsync.mockResolvedValue(tokenPair)
  seedStore()
  const user = userEvent.setup()
  render(<OtpVerify />)

  const pasteBtn = screen.getByRole('button', {
    name: /Вставить код из буфера/,
  })
  await user.click(pasteBtn)

  expect(cellAt(0)).toHaveValue('4')
  expect(cellAt(1)).toHaveValue('3')
  expect(cellAt(2)).toHaveValue('2')
  expect(cellAt(3)).toHaveValue('1')

  await waitFor(() =>
    expect(mockVerifyMutateAsync).toHaveBeenCalledWith({
      code: '4321',
      phone: PENDING_PHONE,
    }),
  )
})

// ---------------------------------------------------------------------------
// validation S7 — clipboard button enabled only with 4 digits
// ---------------------------------------------------------------------------

test('validation S7 — paste button is disabled when clipboard has no 4-digit code', () => {
  mockClipboardCode = null
  seedStore()
  render(<OtpVerify />)

  expect(
    screen.getByRole('button', { name: /Вставить код из буфера/ }),
  ).toBeDisabled()
})

test('validation S7 — paste button is enabled when clipboard holds exactly 4 digits', () => {
  mockClipboardCode = '9876'
  seedStore()
  render(<OtpVerify />)

  expect(
    screen.getByRole('button', { name: /Вставить код из буфера/ }),
  ).not.toBeDisabled()
})

// ---------------------------------------------------------------------------
// happy S9 — cells non-interactive while check is in flight
// ---------------------------------------------------------------------------

test('happy S9 — cells are disabled while verify is pending', () => {
  mockVerifyOtp.isPending = true
  seedStore()
  render(<OtpVerify />)

  // The fieldset has disabled, which cascades to each input
  const inputs = screen.getAllByRole('textbox')
  inputs.forEach(input => {
    expect(input).toBeDisabled()
  })
})

test('happy S9 — cells are disabled while register is pending', () => {
  mockRegisterResident.isPending = true
  seedStore()
  render(<OtpVerify />)

  const inputs = screen.getAllByRole('textbox')
  inputs.forEach(input => {
    expect(input).toBeDisabled()
  })
})

// ---------------------------------------------------------------------------
// validation S8 — resend control swaps when timer reaches 0:00
// ---------------------------------------------------------------------------

test('validation S8 — paste button disappears and Resend appears when timer ends', () => {
  // remaining = 0 when resendAvailableAt is in the past
  mockOtpStatus.data = { resendAvailableAt: Date.now() - 1000 }
  seedStore()
  render(<OtpVerify />)

  expect(
    screen.queryByRole('button', { name: /Вставить код из буфера/ }),
  ).not.toBeInTheDocument()
  expect(
    screen.getByRole('button', { name: /Отправить повторно/ }),
  ).toBeInTheDocument()
})

// ---------------------------------------------------------------------------
// error S1 — wrong code burns the attempt: cells clear, error shown, stays
// ---------------------------------------------------------------------------

test('error S1 — wrong code (server rejection) clears cells and shows error message', async () => {
  mockVerifyMutateAsync.mockRejectedValue({ data: { code: 'BAD_REQUEST' } })
  seedStore()
  const user = userEvent.setup()
  render(<OtpVerify />)

  await fillCells(user, '9999')

  await waitFor(() => {
    const inputs = screen.getAllByRole('textbox')
    inputs.forEach(input => {
      expect(input).toHaveValue('')
    })
    expect(screen.getByText(/Неверный код/)).toBeInTheDocument()
    expect(mockNavigate).not.toHaveBeenCalled()
  })
})

// ---------------------------------------------------------------------------
// error S1 (second block) / error S2 — attempt used up is also rejected
// ---------------------------------------------------------------------------

test('error S2 — attempt-used server rejection clears cells and shows error, no navigation', async () => {
  mockVerifyMutateAsync.mockRejectedValue({ data: { code: 'BAD_REQUEST' } })
  seedStore()
  const user = userEvent.setup()
  render(<OtpVerify />)

  await fillCells(user, '1111')

  await waitFor(() => {
    expect(screen.getByText(/Неверный код/)).toBeInTheDocument()
    const inputs = screen.getAllByRole('textbox')
    inputs.forEach(input => {
      expect(input).toHaveValue('')
    })
    expect(mockNavigate).not.toHaveBeenCalled()
  })
})

// ---------------------------------------------------------------------------
// error S3 — resend restores an attempt, resets timer, clears cells
// ---------------------------------------------------------------------------

test('error S3 — tapping Resend calls resendOtp, refetches status, and clears cells', async () => {
  mockOtpStatus.data = { resendAvailableAt: Date.now() - 1000 }
  mockResendMutateAsync.mockResolvedValue({})
  mockStatusRefetch.mockResolvedValue({})
  seedStore()
  const user = userEvent.setup()
  render(<OtpVerify />)

  await user.click(screen.getByRole('button', { name: /Отправить повторно/ }))

  await waitFor(() => {
    expect(mockResendMutateAsync).toHaveBeenCalledWith({ phone: PENDING_PHONE })
    expect(mockStatusRefetch).toHaveBeenCalled()
  })

  const inputs = screen.getAllByRole('textbox')
  inputs.forEach(input => {
    expect(input).toHaveValue('')
  })
})

// ---------------------------------------------------------------------------
// error S5 (CRITICAL REGRESSION) — network verify failure: no auto-retry
// ---------------------------------------------------------------------------

test('error S5 — network verify failure keeps digits, shows error, does NOT auto-retry', async () => {
  // A network error has no .data.code — it is not a server error
  const networkErr = new Error('Network error')
  mockVerifyMutateAsync.mockRejectedValueOnce(networkErr)
  seedStore()
  const user = userEvent.setup()
  render(<OtpVerify />)

  await fillCells(user, '5555')

  await waitFor(() => {
    expect(mockVerifyMutateAsync).toHaveBeenCalledTimes(1)
    expect(screen.getByText(/Не удалось проверить код/)).toBeInTheDocument()
  })

  // Cells retain the digits (network failure does not clear them)
  expect(cellAt(0)).toHaveValue('5')
  expect(cellAt(1)).toHaveValue('5')
  expect(cellAt(2)).toHaveValue('5')
  expect(cellAt(3)).toHaveValue('5')

  // Verify was called exactly once — submittedRef prevents auto-retry
  expect(mockVerifyMutateAsync).toHaveBeenCalledTimes(1)
})

test('error S5 — after network failure, editing a cell and re-completing triggers verify again', async () => {
  const networkErr = new Error('Network error')
  mockVerifyMutateAsync
    .mockRejectedValueOnce(networkErr)
    .mockResolvedValueOnce({ verified: true })
  mockRegisterMutateAsync.mockResolvedValue(tokenPair)
  seedStore()
  const user = userEvent.setup()
  render(<OtpVerify />)

  // First fill — triggers verify (fails with network error)
  await fillCells(user, '5555')
  await waitFor(() => expect(mockVerifyMutateAsync).toHaveBeenCalledTimes(1))

  // User clears cell 3 and retypes it — code goes <4 then back to 4
  fireEvent.change(cellAt(2), { target: { value: '' } })

  await waitFor(() => expect(cellAt(2)).toHaveValue(''))

  await typeDigit(user, 2, '5')

  // submittedRef reset when code < 4, so verify runs again
  await waitFor(() => expect(mockVerifyMutateAsync).toHaveBeenCalledTimes(2))
})

// ---------------------------------------------------------------------------
// error S6 — register network error: no tokens stored, stays on verify
// ---------------------------------------------------------------------------

test('error S6 — register network error stores no tokens and keeps user on verify', async () => {
  mockVerifyMutateAsync.mockResolvedValue({ verified: true })
  mockRegisterMutateAsync.mockRejectedValue(new Error('Network error'))
  seedStore()
  const user = userEvent.setup()
  render(<OtpVerify />)

  await fillCells(user, '1234')

  await waitFor(() => {
    expect(useAuthStore.getState().tokens).toBeNull()
    expect(mockNavigate).not.toHaveBeenCalled()
    expect(
      screen.getByText(/Не удалось завершить регистрацию/),
    ).toBeInTheDocument()
  })
})

test('error S6 — after register fails, retry re-runs registration and navigates on success', async () => {
  mockVerifyMutateAsync.mockResolvedValue({ verified: true })
  mockRegisterMutateAsync
    .mockRejectedValueOnce(new Error('Network error'))
    .mockResolvedValueOnce(tokenPair)
  seedStore()
  const user = userEvent.setup()
  render(<OtpVerify />)

  await fillCells(user, '1234')

  // Verify is spent, but a retry button lets registration run again directly
  const retryBtn = await screen.findByRole('button', {
    name: /Повторить попытку/,
  })
  await user.click(retryBtn)

  await waitFor(() => {
    expect(mockRegisterMutateAsync).toHaveBeenCalledTimes(2)
    expect(mockVerifyMutateAsync).toHaveBeenCalledTimes(1)
    expect(useAuthStore.getState().tokens).toEqual(tokenPair)
    expect(mockNavigate).toHaveBeenCalledWith({ to: '/home' })
  })
})

// ---------------------------------------------------------------------------
// error S7 — incomplete draft surfaces an error instead of stalling silently
// ---------------------------------------------------------------------------

test('error S7 — verified code with incomplete draft shows registration error', async () => {
  mockVerifyMutateAsync.mockResolvedValue({ verified: true })
  act(() => {
    useOnboardingStore.getState().setDraft({
      name: '',
      phone: PENDING_PHONE,
      block: null,
      apartment: '',
      role: null,
    })
    useOnboardingStore.getState().setPendingPhone(PENDING_PHONE)
  })
  const user = userEvent.setup()
  render(<OtpVerify />)

  await fillCells(user, '1234')

  await waitFor(() => {
    expect(
      screen.getByText(/Не удалось завершить регистрацию/),
    ).toBeInTheDocument()
    expect(mockRegisterMutateAsync).not.toHaveBeenCalled()
    expect(mockNavigate).not.toHaveBeenCalled()
  })
})

// ---------------------------------------------------------------------------
// error S4 — locked number (FORBIDDEN) is treated as network/unknown, not wrong code
// ---------------------------------------------------------------------------

test('error S4 — FORBIDDEN (locked) shows network error and keeps the digits', async () => {
  mockVerifyMutateAsync.mockRejectedValue({ data: { code: 'FORBIDDEN' } })
  seedStore()
  const user = userEvent.setup()
  render(<OtpVerify />)

  await fillCells(user, '1234')

  await waitFor(() =>
    expect(screen.getByText(/Не удалось проверить код/)).toBeInTheDocument(),
  )

  // Not a wrong-code rejection: cells are NOT cleared, no "Неверный код"
  expect(cellAt(0)).toHaveValue('1')
  expect(screen.queryByText(/Неверный код/)).not.toBeInTheDocument()
})

// ---------------------------------------------------------------------------
// edge S1 — countdown label shows remaining time from resendAvailableAt
// ---------------------------------------------------------------------------

test('edge S1 — countdown label shows time derived from resendAvailableAt', () => {
  mockOtpStatus.data = { resendAvailableAt: Date.now() + 120_000 }
  seedStore()
  render(<OtpVerify />)

  // The exact seconds may vary by 1 due to ceil, but minutes part is 2
  expect(screen.getByText(/Повторная отправка через 2:/)).toBeInTheDocument()
})
