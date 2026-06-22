import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { act } from 'react'
import { beforeEach, expect, test, vi } from 'vitest'

import { useOnboardingStore } from '@/features/onboarding/registration-form'
import { useAuthStore } from '@/shared/auth'

// Mock at the network boundary (model hooks); real stores and lib stay.
const mockVerifyMutate = vi.fn()
const mockVerifyReset = vi.fn()
const mockVerifyOtp = {
  error: null as unknown,
  isError: false,
  isPending: false,
  mutate: mockVerifyMutate,
  reset: mockVerifyReset,
}
vi.mock('../model/use-verify-otp', () => ({
  useVerifyOtp: () => mockVerifyOtp,
}))

const mockRegisterMutate = vi.fn()
const mockRegisterReset = vi.fn()
const mockRegisterResident = {
  isError: false,
  isPending: false,
  mutate: mockRegisterMutate,
  reset: mockRegisterReset,
}
vi.mock('../model/use-register-resident', () => ({
  useRegisterResident: () => mockRegisterResident,
}))

const mockResendMutate = vi.fn()
const mockResendOtp = {
  isError: false,
  isPending: false,
  mutate: mockResendMutate,
  reset: vi.fn(),
}
vi.mock('../model/use-resend-otp', () => ({
  useResendOtp: () => mockResendOtp,
}))

const mockOtpStatus = {
  data: null as {
    resendAvailableAt: number
    verifyUsed?: boolean
    hasActiveCode?: boolean
    sendCount?: number
  } | null,
}
vi.mock('../model/use-otp-status', () => ({
  useOtpStatus: () => mockOtpStatus,
}))

vi.mock('../lib/use-clipboard-code', () => ({
  useClipboardCode: () => mockClipboardCode,
}))
let mockClipboardCode: string | null = null

const mockNavigate = vi.fn()
vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => mockNavigate,
}))

import { OtpVerification } from './otp-verification'

const PENDING_PHONE = '+77071234567'

const tokenPair = {
  accessToken: 'access-tok',
  accessTokenExpiresAt: Date.now() + 3600_000,
  refreshToken: 'refresh-tok',
  refreshTokenExpiresAt: Date.now() + 86400_000,
}

const cells = () => screen.getAllByRole('textbox')

const cellAt = (index: number) => {
  const cell = cells()[index]
  if (!cell) throw new Error(`No OTP cell at index ${index}`)
  return cell
}

const expectCellsDisabled = () => {
  cells().forEach(cell => {
    expect(cell).toBeDisabled()
  })
}

const expectCellsEmpty = () => {
  cells().forEach(cell => {
    expect(cell).toHaveValue('')
  })
}

const expectCellValues = (code: string) => {
  code.split('').forEach((digit, i) => {
    expect(cellAt(i)).toHaveValue(digit)
  })
}

const seedStore = () => {
  act(() => {
    useOnboardingStore.getState().setDraft({
      name: 'Алиса',
      phone: PENDING_PHONE,
      block: 1,
      apartment: 42,
      role: 'owner',
    })
  })
}

const renderVerify = () => {
  seedStore()
  const user = userEvent.setup()
  const { rerender } = render(<OtpVerification />)
  return { rerender: () => rerender(<OtpVerification />), user }
}

const typeDigit = (
  user: ReturnType<typeof userEvent.setup>,
  index: number,
  digit: string,
) => user.type(cellAt(index), digit)

const fillCells = (user: ReturnType<typeof userEvent.setup>, digits: string) =>
  digits
    .split('')
    .reduce(
      (chain, digit, index) => chain.then(() => typeDigit(user, index, digit)),
      Promise.resolve(),
    )

// Settle the verify mutation inline via its onSuccess/onError callbacks.
const makeVerifySucceed = (result = { verified: true }) => {
  mockVerifyMutate.mockImplementation(
    (_args: unknown, callbacks: { onSuccess?: (r: unknown) => void }) => {
      Promise.resolve().then(() => callbacks?.onSuccess?.(result))
    },
  )
}

const makeVerifyFail = (error: unknown) => {
  mockVerifyMutate.mockImplementation(
    (_args: unknown, callbacks: { onError?: (e: unknown) => void }) => {
      mockVerifyOtp.isError = true
      mockVerifyOtp.error = error
      Promise.resolve().then(() => callbacks?.onError?.(error))
    },
  )
}

const makeRegisterSucceed = () => {
  mockRegisterMutate.mockImplementation(
    (_args: unknown, callbacks: { onSuccess?: (r: unknown) => void }) => {
      Promise.resolve().then(() => {
        useAuthStore.getState().setTokens(tokenPair)
        callbacks?.onSuccess?.(tokenPair)
      })
    },
  )
}

const WRONG_CODE_ERR = { data: { code: 'BAD_REQUEST' } }

beforeEach(() => {
  mockVerifyOtp.isPending = false
  mockVerifyOtp.isError = false
  mockVerifyOtp.error = null
  mockVerifyMutate.mockReset()
  mockVerifyReset.mockReset()
  mockRegisterResident.isPending = false
  mockRegisterResident.isError = false
  mockRegisterMutate.mockReset()
  mockRegisterReset.mockReset()
  mockResendOtp.isPending = false
  mockResendOtp.isError = false
  mockResendMutate.mockReset()
  mockOtpStatus.data = null
  mockNavigate.mockReset()
  mockClipboardCode = null

  act(() => {
    useOnboardingStore.getState().reset()
    useAuthStore.getState().clear()
  })

  mockOtpStatus.data = { resendAvailableAt: Date.now() + 60_000 }
})

test('happy S3 — displays pending phone in format +7 707 123 45 67', () => {
  renderVerify()

  expect(screen.getByText('+7 707 123 45 67')).toBeInTheDocument()
})

test('happy S3 — shows 4 empty cells and countdown label on load', () => {
  renderVerify()

  expect(cells()).toHaveLength(4)
  expectCellsEmpty()
  expect(screen.getByText(/Повторно через/)).toBeInTheDocument()
  expect(
    screen.getByRole('button', { name: /Вставить код из буфера/ }),
  ).toBeInTheDocument()
})

test('happy S4 — typing a digit advances focus to the next cell', async () => {
  const { user } = renderVerify()

  await typeDigit(user, 0, '1')
  expect(cellAt(1)).toHaveFocus()
})

test('happy S4 — after the fourth digit focus stays on the fourth cell', async () => {
  // verify hangs so cells stay filled and focus stays on 4th
  mockVerifyMutate.mockImplementation(() => {})
  const { user } = renderVerify()

  await fillCells(user, '1234')

  expect(cellAt(3)).toHaveFocus()
})

test('validation S6 — non-digit character is ignored, cell stays empty', () => {
  renderVerify()

  fireEvent.change(cellAt(0), { target: { value: 'a' } })

  expect(cellAt(0)).toHaveValue('')
})

test('happy S10 — backspace on empty second cell moves focus to first cell', async () => {
  const { user } = renderVerify()

  await user.click(cellAt(1))
  await user.keyboard('{Backspace}')

  expect(cellAt(0)).toHaveFocus()
})

test('happy S10 — backspace on empty first cell keeps focus on first cell', async () => {
  const { user } = renderVerify()

  cellAt(0).focus()
  await user.keyboard('{Backspace}')

  expect(cellAt(0)).toHaveFocus()
})

test('happy S5 — entering 4 digits triggers verify automatically', async () => {
  makeVerifySucceed()
  makeRegisterSucceed()
  const { user } = renderVerify()

  await fillCells(user, '1234')

  await waitFor(() =>
    expect(mockVerifyMutate).toHaveBeenCalledWith(
      { code: '1234', phone: PENDING_PHONE },
      expect.any(Object),
    ),
  )
})

test('happy S5 — after verify succeeds, resident is registered with draft data', async () => {
  makeVerifySucceed()
  makeRegisterSucceed()
  const { user } = renderVerify()

  await fillCells(user, '5678')

  await waitFor(() =>
    expect(mockRegisterMutate).toHaveBeenCalledWith(
      {
        apartment: 42,
        block: 1,
        name: 'Алиса',
        phone: PENDING_PHONE,
        role: 'owner',
      },
      expect.any(Object),
    ),
  )
})

test('happy S5 — tokens are saved to authStore and app navigates to /home', async () => {
  makeVerifySucceed()
  makeRegisterSucceed()
  const { user } = renderVerify()

  await fillCells(user, '1234')

  await waitFor(() => {
    expect(useAuthStore.getState().tokens).toEqual(tokenPair)
    expect(mockNavigate).toHaveBeenCalledWith({ to: '/home' })
  })
})

test('happy S7 — paste button fills cells with clipboard code and triggers verify', async () => {
  mockClipboardCode = '4321'
  makeVerifySucceed()
  makeRegisterSucceed()
  const { user } = renderVerify()

  await user.click(
    screen.getByRole('button', { name: /Вставить код из буфера/ }),
  )

  expectCellValues('4321')

  await waitFor(() =>
    expect(mockVerifyMutate).toHaveBeenCalledWith(
      { code: '4321', phone: PENDING_PHONE },
      expect.any(Object),
    ),
  )
})

test('validation S7 — paste button is disabled when clipboard has no 4-digit code', () => {
  mockClipboardCode = null
  renderVerify()

  expect(
    screen.getByRole('button', { name: /Вставить код из буфера/ }),
  ).toBeDisabled()
})

test('validation S7 — paste button is enabled when clipboard holds exactly 4 digits', () => {
  mockClipboardCode = '9876'
  renderVerify()

  expect(
    screen.getByRole('button', { name: /Вставить код из буфера/ }),
  ).not.toBeDisabled()
})

test('error S2 — paste cannot bypass the lock while the attempt is spent', () => {
  // A spent attempt (e.g. a wrong code surviving a reload) locks the cells; the paste
  // action must respect that lock even with a valid code on the clipboard.
  mockClipboardCode = '9876'
  mockOtpStatus.data = {
    resendAvailableAt: Date.now() + 60_000,
    verifyUsed: true,
  }
  renderVerify()

  expectCellsDisabled()
  expect(
    screen.getByRole('button', { name: /Вставить код из буфера/ }),
  ).toBeDisabled()
})

test('happy S9 — cells are disabled while verify is pending', () => {
  mockVerifyOtp.isPending = true
  renderVerify()

  expectCellsDisabled()
})

test('happy S9 — cells are disabled while register is pending', () => {
  mockRegisterResident.isPending = true
  renderVerify()

  expectCellsDisabled()
})

test('validation S8 — Resend button appears when timer ends, paste button disappears', () => {
  // remaining = 0 when resendAvailableAt is in the past
  mockOtpStatus.data = { resendAvailableAt: Date.now() - 1000 }
  renderVerify()

  expect(
    screen.getByRole('button', { name: /Отправить повторно/ }),
  ).toBeInTheDocument()
  expect(screen.queryByText(/Повторно через/)).not.toBeInTheDocument()
})

test('error S1 — wrong code (server rejection) locks cells and keeps the entered digits', async () => {
  makeVerifyFail(WRONG_CODE_ERR)
  const { rerender, user } = renderVerify()

  await fillCells(user, '9999')
  await waitFor(() => expect(mockVerifyMutate).toHaveBeenCalledTimes(1))

  // The failed verify invalidates otp.status; the refetch reports the spent
  // attempt, which is what locks the cells (server-driven, not a local flag).
  mockOtpStatus.data = {
    resendAvailableAt: Date.now() + 60_000,
    verifyUsed: true,
  }
  act(() => rerender())

  expect(screen.getByText(/Неверный код/)).toBeInTheDocument()
  expect(mockNavigate).not.toHaveBeenCalled()

  // Cells keep the digits and lock (the spent code cannot be retyped).
  expectCellValues('9999')
  expectCellsDisabled()
})

test('error S2 — spent attempt keeps cells locked until a fresh code is requested', async () => {
  makeVerifyFail(WRONG_CODE_ERR)
  const { rerender, user } = renderVerify()

  await fillCells(user, '1111')
  await waitFor(() => expect(mockVerifyMutate).toHaveBeenCalledTimes(1))

  // Refetched status reports the spent attempt — this is what keeps cells locked.
  mockOtpStatus.data = {
    resendAvailableAt: Date.now() + 60_000,
    verifyUsed: true,
  }
  act(() => rerender())

  expect(screen.getByText(/Неверный код/)).toBeInTheDocument()
  expectCellsDisabled()

  // Resend button is not visible (wait hasn't ended)
  expect(
    screen.queryByRole('button', { name: /Отправить повторно/ }),
  ).not.toBeInTheDocument()
  expect(mockNavigate).not.toHaveBeenCalled()
})

test('error S3 — tapping Resend calls resendOtp and clears cells', async () => {
  mockOtpStatus.data = { resendAvailableAt: Date.now() - 1000 }
  mockResendMutate.mockImplementation(
    (
      _args: unknown,
      callbacks: { onSuccess?: (r: { lockedUntil: null }) => void },
    ) => {
      Promise.resolve().then(() =>
        callbacks?.onSuccess?.({ lockedUntil: null }),
      )
    },
  )
  const { user } = renderVerify()

  await user.click(screen.getByRole('button', { name: /Отправить повторно/ }))

  await waitFor(() => {
    expect(mockResendMutate).toHaveBeenCalledWith(
      { phone: PENDING_PHONE },
      expect.any(Object),
    )
  })

  expectCellsEmpty()
})

test('error S5 — network verify failure clears cells and shows error', async () => {
  makeVerifyFail(new Error('Network error'))
  const { user } = renderVerify()

  await fillCells(user, '5555')

  await waitFor(() => {
    expect(screen.getByText(/Не удалось проверить код/)).toBeInTheDocument()
  })

  // Cells clear on network failure (attempt is NOT spent — code can be retried)
  expectCellsEmpty()
})

test('error S5 — after network failure, re-completing the cells triggers verify again', async () => {
  const networkErr = new Error('Network error')
  let callCount = 0
  mockVerifyMutate.mockImplementation(
    (
      _args: unknown,
      callbacks: { onSuccess?: () => void; onError?: (e: unknown) => void },
    ) => {
      callCount++
      if (callCount === 1) {
        mockVerifyOtp.error = networkErr
        mockVerifyOtp.isError = true
        Promise.resolve().then(() => callbacks?.onError?.(networkErr))
      } else {
        Promise.resolve().then(() => callbacks?.onSuccess?.())
      }
    },
  )
  makeRegisterSucceed()
  const { user } = renderVerify()

  // First fill — triggers verify (fails with network error, cells clear)
  await fillCells(user, '5555')
  await waitFor(() => expect(mockVerifyMutate).toHaveBeenCalledTimes(1))
  await waitFor(() => expect(cellAt(0)).toHaveValue(''))

  // User re-enters all 4 digits — verify fires again
  await fillCells(user, '5555')
  await waitFor(() => expect(mockVerifyMutate).toHaveBeenCalledTimes(2))
})

test('error S6 — register network error stores no tokens and keeps user on verify', async () => {
  makeVerifySucceed()
  // register() does not pass onError to mutate, so the failure is only visible
  // via registerResident.isError on the next render.
  mockRegisterMutate.mockImplementation(() => {
    mockRegisterResident.isError = true
  })
  const { rerender, user } = renderVerify()

  await fillCells(user, '1234')

  await waitFor(() => expect(mockRegisterMutate).toHaveBeenCalledTimes(1))
  act(() => rerender())

  expect(useAuthStore.getState().tokens).toBeNull()
  expect(mockNavigate).not.toHaveBeenCalled()
  expect(
    screen.getByText(/Не удалось завершить регистрацию/),
  ).toBeInTheDocument()
})

test('error S6 — after register fails, retry re-runs registration and navigates on success', async () => {
  makeVerifySucceed()
  let registerCallCount = 0
  mockRegisterMutate.mockImplementation(
    (_args: unknown, callbacks: { onSuccess?: (r: unknown) => void }) => {
      registerCallCount++
      if (registerCallCount === 1) {
        mockRegisterResident.isError = true
      } else {
        mockRegisterResident.isError = false
        Promise.resolve().then(() => {
          useAuthStore.getState().setTokens(tokenPair)
          callbacks?.onSuccess?.(tokenPair)
        })
      }
    },
  )
  const { rerender, user } = renderVerify()

  await fillCells(user, '1234')

  await waitFor(() => expect(mockRegisterMutate).toHaveBeenCalledTimes(1))
  act(() => rerender())

  await user.click(screen.getByRole('button', { name: /Повторить попытку/ }))

  await waitFor(() => {
    expect(mockRegisterMutate).toHaveBeenCalledTimes(2)
    expect(mockVerifyMutate).toHaveBeenCalledTimes(1)
    expect(useAuthStore.getState().tokens).toEqual(tokenPair)
    expect(mockNavigate).toHaveBeenCalledWith({ to: '/home' })
  })
})

test('error S4 — FORBIDDEN (locked) shows network error and clears the cells', async () => {
  makeVerifyFail({ data: { code: 'FORBIDDEN' } })
  const { user } = renderVerify()

  await fillCells(user, '1234')

  await waitFor(() =>
    expect(screen.getByText(/Не удалось проверить код/)).toBeInTheDocument(),
  )

  // Not a wrong-code rejection: "Неверный код" is not shown
  expect(screen.queryByText(/Неверный код/)).not.toBeInTheDocument()

  // Cells clear (treated as network error, not a spent attempt)
  expectCellsEmpty()
})

test('edge S1 — countdown label shows time derived from resendAvailableAt', () => {
  mockOtpStatus.data = { resendAvailableAt: Date.now() + 120_000 }
  renderVerify()

  // The exact seconds may vary by 1 due to ceil, but minutes part is 2
  expect(screen.getByText(/Повторно через 2:/)).toBeInTheDocument()
})

test('lockout S2 — resend returning lockedUntil navigates to /onboarding/locked', async () => {
  mockOtpStatus.data = { resendAvailableAt: Date.now() - 1000 }
  const lockedUntil = Date.now() + 86_400_000
  mockResendMutate.mockImplementation(
    (_args: unknown, callbacks: { onSuccess?: (r: unknown) => void }) => {
      Promise.resolve().then(() => callbacks?.onSuccess?.({ lockedUntil }))
    },
  )
  const { user } = renderVerify()

  await user.click(screen.getByRole('button', { name: /Отправить повторно/ }))

  await waitFor(() =>
    expect(mockNavigate).toHaveBeenCalledWith({ to: '/onboarding/locked' }),
  )
})

test('lockout S5 CTA — fresh session (hasActiveCode false, sendCount 0) labels primary action "Отправить код"', () => {
  mockOtpStatus.data = {
    resendAvailableAt: Date.now() - 1000,
    hasActiveCode: false,
    sendCount: 0,
  }
  renderVerify()

  expect(
    screen.getByRole('button', { name: /Отправить код/ }),
  ).toBeInTheDocument()
  expect(
    screen.queryByRole('button', { name: /Отправить повторно/ }),
  ).not.toBeInTheDocument()
})
