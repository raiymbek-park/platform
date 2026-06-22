import { render, screen } from '@testing-library/react'
import { act } from 'react'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'

// Mock at network + navigation boundaries — real lib/hook logic stays.
const mockOtpStatus = {
  data: null as { lockedUntil: number | null } | null,
  isLoading: false,
}
vi.mock('@/features/onboarding/otp-verification', () => ({
  useOtpStatus: () => mockOtpStatus,
}))

const mockNavigate = vi.fn()
vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => mockNavigate,
}))

const mockUseOnboardingStore = vi.fn()
vi.mock('@/features/onboarding/registration-form', () => ({
  useOnboardingStore: (
    selector: (state: { draft: { phone: string } }) => unknown,
  ) => mockUseOnboardingStore(selector),
}))

import { AccountLocked } from './account-locked'

const PENDING_PHONE = '+77071234567'

const seedPhone = () => {
  mockUseOnboardingStore.mockImplementation(
    (selector: (state: { draft: { phone: string } }) => unknown) =>
      selector({ draft: { phone: PENDING_PHONE } }),
  )
}

const FUTURE_LOCKED_UNTIL = Date.now() + 86_399_000 // ~24h remaining

beforeEach(() => {
  vi.useFakeTimers()
  mockNavigate.mockReset()
  mockOtpStatus.data = { lockedUntil: FUTURE_LOCKED_UNTIL }
  mockOtpStatus.isLoading = false
  seedPhone()
})

afterEach(() => {
  vi.useRealTimers()
})

test('lockout S12 — renders illustration, "Доступ заблокирован" heading, and used-up-attempts subtitle', () => {
  render(<AccountLocked />)

  expect(document.querySelector('img')).toBeInTheDocument()
  expect(
    screen.getByRole('heading', { name: 'Доступ заблокирован' }),
  ).toBeInTheDocument()
  expect(
    screen.getByText(/Вы использовали все попытки ввода кода/),
  ).toBeInTheDocument()
})

test('lockout S13 — timer output shows HH:MM:SS derived from server lockedUntil', () => {
  vi.setSystemTime(FUTURE_LOCKED_UNTIL - 3_661_000) // 1h 1m 1s remaining
  render(<AccountLocked />)

  const timer = screen.getByRole('status')
  expect(timer).toHaveTextContent('01:01:01')
})

test('lockout S15 — timer reflects remaining time from server, not a fixed 24-hour reset', () => {
  const partialRemaining = 3_599_000 // 59m 59s (mid-lockout)
  vi.setSystemTime(FUTURE_LOCKED_UNTIL - partialRemaining)
  render(<AccountLocked />)

  const timer = screen.getByRole('status')
  expect(timer).toHaveTextContent('00:59:59')
})

test('lockout S14 — no button, no resend control, and no back control are rendered', () => {
  render(<AccountLocked />)

  expect(screen.queryByRole('button')).not.toBeInTheDocument()
  expect(screen.queryByRole('link')).not.toBeInTheDocument()
})

test('lockout S5 nav — countdown reaching 0 navigates to /onboarding/verification', () => {
  const twoSecondsLeft = 2_000
  vi.setSystemTime(FUTURE_LOCKED_UNTIL - twoSecondsLeft)
  render(<AccountLocked />)

  expect(mockNavigate).not.toHaveBeenCalled()

  act(() => vi.advanceTimersByTime(2000))

  expect(mockNavigate).toHaveBeenCalledWith({ to: '/onboarding/verification' })
})

test('lockout S16 — lockedUntil already elapsed on arrival navigates to /onboarding/verification', () => {
  // Server lock time is in the past — remaining will be 0 immediately.
  mockOtpStatus.data = { lockedUntil: Date.now() - 1000 }
  render(<AccountLocked />)

  expect(mockNavigate).toHaveBeenCalledWith({ to: '/onboarding/verification' })
})

test('lockout S16 — lockedUntil null on arrival navigates to /onboarding/verification', () => {
  mockOtpStatus.data = { lockedUntil: null }
  render(<AccountLocked />)

  expect(mockNavigate).toHaveBeenCalledWith({ to: '/onboarding/verification' })
})

test('lockout S16 — does not navigate while status is still loading', () => {
  mockOtpStatus.data = null
  mockOtpStatus.isLoading = true
  render(<AccountLocked />)

  expect(mockNavigate).not.toHaveBeenCalled()
})
