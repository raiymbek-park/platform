/**
 * Integration tests for route beforeLoad guards (ticket #6).
 *
 * Strategy: call the exported Route.options.beforeLoad functions directly with
 * a synthetic context object. This avoids spinning up a full TanStack Router
 * instance while still exercising real guard logic, real Zustand stores, and
 * the real `redirect` throw semantics from @tanstack/react-router.
 *
 * Mock boundary:
 *   - trpcClient.auth.refresh.mutate — mocked (refreshSession's network call)
 *   - context.queryClient.fetchQuery — mocked per-test (otp.status)
 *   - context.trpc.otp.status.queryOptions — mocked (returns an opaque value
 *     that fetchQuery receives as its argument)
 *   - Zustand stores (useAuthStore, useOnboardingStore, useLockedPhoneStore)
 *     are REAL and seeded per test; reset in beforeEach.
 */

import type { QueryClient } from '@tanstack/react-query'

import { act } from 'react'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'

// ─── network boundary mocks ──────────────────────────────────────────────────

// vi.hoisted creates the fn before vi.mock's factory is hoisted to the top.
const { mockRefreshMutate } = vi.hoisted(() => ({
  mockRefreshMutate: vi.fn(),
}))
vi.mock('@/shared/api', () => ({
  trpcClient: { auth: { refresh: { mutate: mockRefreshMutate } } },
}))

import { useOnboardingStore } from '@/features/onboarding/registration-form'
import { useAuthStore, useLockedPhoneStore } from '@/shared/auth'

// Route modules are imported AFTER the mocks above so the mock is in place.
import { Route as HomeRoute } from './home'
import { Route as RootRoute } from './index'
import { Route as OnboardingLayoutRoute } from './onboarding'
import { Route as OnboardingIndexRoute } from './onboarding.index'
import { Route as OnboardingLockedRoute } from './onboarding.locked'

const NOW = 1_700_000_000_000

// A token pair where both access and refresh are valid.
const validPair = {
  accessToken: 'access',
  accessTokenExpiresAt: NOW + 3_600_000,
  refreshToken: 'refresh',
  refreshTokenExpiresAt: NOW + 86_400_000,
}

// A token pair where access is expired but refresh is still valid.
const expiredAccessPair = {
  accessToken: 'stale-access',
  accessTokenExpiresAt: NOW - 1,
  refreshToken: 'refresh',
  refreshTokenExpiresAt: NOW + 86_400_000,
}

// A fresh pair returned by a successful auth.refresh call.
const freshPair = {
  accessToken: 'fresh-access',
  accessTokenExpiresAt: NOW + 7_200_000,
  refreshToken: 'fresh-refresh',
  refreshTokenExpiresAt: NOW + 86_400_000 * 2,
}

const PHONE = '+77071234567'

// Build a mock router context with a custom fetchQuery implementation.
const makeContext = (fetchQuery: (opts: unknown) => Promise<unknown>) => ({
  queryClient: { fetchQuery } as unknown as QueryClient,
  trpc: {
    otp: {
      status: {
        queryOptions: (params: { phone: string }) => ({ _params: params }),
      },
    },
  } as unknown,
})

// TanStack Router's redirect() throws a Response-like object whose destination
// lives at err.options.to (not err.to directly).
type RedirectError = { options: { to: string } }

const isRedirectError = (err: unknown): err is RedirectError =>
  typeof err === 'object' &&
  err !== null &&
  'options' in err &&
  typeof (err as RedirectError).options?.to === 'string'

// Extracts the redirect destination from a thrown redirect error.
const redirectTo = async (fn: () => Promise<unknown>): Promise<string> => {
  try {
    await fn()
    throw new Error(
      'Expected a redirect to be thrown but guard returned normally',
    )
  } catch (err) {
    if (isRedirectError(err)) return err.options.to
    throw err
  }
}

// Returns true when the guard resolves without throwing a redirect.
// Re-throws unexpected non-redirect errors so they surface as real failures.
const guardPasses = async (fn: () => Promise<unknown>): Promise<boolean> => {
  try {
    await fn()
    return true
  } catch (err) {
    if (isRedirectError(err)) return false
    throw err
  }
}

const seedDraftPhone = (phone: string) => {
  act(() =>
    useOnboardingStore.getState().setDraft({
      name: 'Тест',
      phone,
      block: 1,
      apartment: 1,
      role: 'owner',
    }),
  )
}

beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(NOW)
  mockRefreshMutate.mockReset()
  act(() => {
    useAuthStore.getState().clear()
    useOnboardingStore.getState().reset()
    useLockedPhoneStore.getState().clearLockedPhone()
  })
})

afterEach(() => {
  vi.useRealTimers()
})

// ─── / → /onboarding (index route) ───────────────────────────────────────────
// The root index guard always redirects to /onboarding — tested separately as
// it has no async logic or store reads.

describe('/ root guard', () => {
  test('always redirects to /onboarding', () => {
    const beforeLoad = RootRoute.options.beforeLoad as () => never
    expect(() => beforeLoad()).toThrow()
    try {
      beforeLoad()
    } catch (err) {
      expect(isRedirectError(err) && err.options.to).toBe('/onboarding')
    }
  })
})

// ─── /onboarding index guard (Startup Restore Priority) ──────────────────────

describe('/onboarding index guard — happy S6, S18: valid session → /home', () => {
  test('S6/S18: valid refresh token + successful refresh → redirects to /home', async () => {
    act(() => useAuthStore.getState().setTokens(expiredAccessPair))
    mockRefreshMutate.mockResolvedValue(freshPair)

    const ctx = makeContext(() => Promise.resolve({ lockedUntil: null }))
    const dest = await redirectTo(() =>
      OnboardingIndexRoute.options.beforeLoad({ context: ctx } as never),
    )

    expect(dest).toBe('/home')
    // Session rotated: fresh tokens stored
    expect(useAuthStore.getState().tokens).toEqual(freshPair)
  })

  test('S7-error: refresh token invalid/expired → clears tokens and falls to welcome', async () => {
    act(() => useAuthStore.getState().setTokens(expiredAccessPair))
    mockRefreshMutate.mockRejectedValue(new Error('UNAUTHORIZED'))

    // No pending phone → goes straight to welcome
    const ctx = makeContext(() => Promise.resolve({ lockedUntil: null }))
    const dest = await redirectTo(() =>
      OnboardingIndexRoute.options.beforeLoad({ context: ctx } as never),
    )

    expect(dest).toBe('/onboarding/welcome')
    expect(useAuthStore.getState().tokens).toBeNull()
  })
})

describe('/onboarding index guard — cold-start restore from pending phone', () => {
  test('S20: no session, no pending phone → /onboarding/welcome', async () => {
    const ctx = makeContext(() => Promise.resolve({ lockedUntil: null }))
    const dest = await redirectTo(() =>
      OnboardingIndexRoute.options.beforeLoad({ context: ctx } as never),
    )
    expect(dest).toBe('/onboarding/welcome')
  })

  test('S7-edge: pending phone with active lock → /onboarding/locked', async () => {
    seedDraftPhone(PHONE)
    const ctx = makeContext(() =>
      Promise.resolve({
        lockedUntil: NOW + 86_400_000,
        hasActiveCode: false,
        resendAvailableAt: null,
      }),
    )
    const dest = await redirectTo(() =>
      OnboardingIndexRoute.options.beforeLoad({ context: ctx } as never),
    )
    expect(dest).toBe('/onboarding/locked')
  })

  test('S6-edge: pending phone with active code → /onboarding/verification', async () => {
    seedDraftPhone(PHONE)
    const ctx = makeContext(() =>
      Promise.resolve({
        lockedUntil: null,
        hasActiveCode: true,
        resendAvailableAt: NOW + 60_000,
      }),
    )
    const dest = await redirectTo(() =>
      OnboardingIndexRoute.options.beforeLoad({ context: ctx } as never),
    )
    expect(dest).toBe('/onboarding/verification')
  })

  test('S6-edge: pending phone, code cooling down (no active code, resend future) → /onboarding/verification', async () => {
    seedDraftPhone(PHONE)
    const ctx = makeContext(() =>
      Promise.resolve({
        lockedUntil: null,
        hasActiveCode: false,
        resendAvailableAt: NOW + 60_000,
      }),
    )
    const dest = await redirectTo(() =>
      OnboardingIndexRoute.options.beforeLoad({ context: ctx } as never),
    )
    expect(dest).toBe('/onboarding/verification')
  })

  test('S20: pending phone, no lock, no active code, resend elapsed → /onboarding/welcome', async () => {
    seedDraftPhone(PHONE)
    const ctx = makeContext(() =>
      Promise.resolve({
        lockedUntil: null,
        hasActiveCode: false,
        resendAvailableAt: NOW - 1,
      }),
    )
    const dest = await redirectTo(() =>
      OnboardingIndexRoute.options.beforeLoad({ context: ctx } as never),
    )
    expect(dest).toBe('/onboarding/welcome')
  })
})

describe('/onboarding index guard — S17: lock survives clearing the onboarding draft', () => {
  test('S17: lockedPhone persisted, draft cleared → still routes to /onboarding/locked', async () => {
    // Simulate: lock was active, phone was pinned, then onboarding draft wiped.
    act(() => useLockedPhoneStore.getState().setLockedPhone(PHONE))
    // draft.phone is '' (reset in beforeEach)

    const ctx = makeContext(() =>
      Promise.resolve({
        lockedUntil: NOW + 86_400_000,
        hasActiveCode: false,
        resendAvailableAt: null,
      }),
    )
    const dest = await redirectTo(() =>
      OnboardingIndexRoute.options.beforeLoad({ context: ctx } as never),
    )
    expect(dest).toBe('/onboarding/locked')
  })

  test('S17: lockedPhone cleared once server reports no active lock', async () => {
    act(() => useLockedPhoneStore.getState().setLockedPhone(PHONE))

    const ctx = makeContext(() =>
      Promise.resolve({
        lockedUntil: null,
        hasActiveCode: false,
        resendAvailableAt: NOW - 1,
      }),
    )
    // Lock elapsed → goes to welcome, and the stale pin is cleared.
    await redirectTo(() =>
      OnboardingIndexRoute.options.beforeLoad({ context: ctx } as never),
    )
    expect(useLockedPhoneStore.getState().lockedPhone).toBeNull()
  })
})

// ─── /home guard ─────────────────────────────────────────────────────────────

describe('/home guard', () => {
  test('S6/S18: valid access token → guard passes (no redirect)', async () => {
    act(() => useAuthStore.getState().setTokens(validPair))
    const passed = await guardPasses(() =>
      HomeRoute.options.beforeLoad({} as never),
    )
    expect(passed).toBe(true)
    expect(mockRefreshMutate).not.toHaveBeenCalled()
  })

  test('S8-error: expired access + valid refresh + successful silent refresh → guard passes', async () => {
    act(() => useAuthStore.getState().setTokens(expiredAccessPair))
    mockRefreshMutate.mockResolvedValue(freshPair)

    const passed = await guardPasses(() =>
      HomeRoute.options.beforeLoad({} as never),
    )
    expect(passed).toBe(true)
    expect(useAuthStore.getState().tokens).toEqual(freshPair)
  })

  test('S8-error: expired access + valid refresh + refresh fails → redirects to welcome', async () => {
    act(() => useAuthStore.getState().setTokens(expiredAccessPair))
    mockRefreshMutate.mockRejectedValue(new Error('UNAUTHORIZED'))

    const dest = await redirectTo(() =>
      HomeRoute.options.beforeLoad({} as never),
    )
    expect(dest).toBe('/onboarding/welcome')
    expect(useAuthStore.getState().tokens).toBeNull()
  })

  test('S19: no session → redirects to /onboarding/welcome', async () => {
    const dest = await redirectTo(() =>
      HomeRoute.options.beforeLoad({} as never),
    )
    expect(dest).toBe('/onboarding/welcome')
  })

  test('S7: expired refresh token → redirects to /onboarding/welcome without calling refresh', async () => {
    act(() =>
      useAuthStore.getState().setTokens({
        accessToken: 'stale',
        accessTokenExpiresAt: NOW - 5000,
        refreshToken: 'stale-refresh',
        refreshTokenExpiresAt: NOW - 1,
      }),
    )
    const dest = await redirectTo(() =>
      HomeRoute.options.beforeLoad({} as never),
    )
    expect(dest).toBe('/onboarding/welcome')
    expect(mockRefreshMutate).not.toHaveBeenCalled()
  })
})

// ─── /onboarding layout hard-lock guard ──────────────────────────────────────

describe('/onboarding layout hard-lock guard', () => {
  const makeLocation = (pathname: string) => ({ pathname }) as never

  test('S18: valid session → guard passes immediately (session beats lock)', async () => {
    act(() => useAuthStore.getState().setTokens(expiredAccessPair)) // refresh valid
    const fetchQuery = vi.fn()
    const ctx = makeContext(fetchQuery)

    const passed = await guardPasses(() =>
      OnboardingLayoutRoute.options.beforeLoad({
        context: ctx,
        location: makeLocation('/onboarding/welcome'),
      } as never),
    )
    expect(passed).toBe(true)
    expect(fetchQuery).not.toHaveBeenCalled()
  })

  test('S3/S4: no session, active lock, non-locked path → redirects to /onboarding/locked', async () => {
    seedDraftPhone(PHONE)
    const ctx = makeContext(() =>
      Promise.resolve({ lockedUntil: NOW + 86_400_000 }),
    )
    const dest = await redirectTo(() =>
      OnboardingLayoutRoute.options.beforeLoad({
        context: ctx,
        location: makeLocation('/onboarding/welcome'),
      } as never),
    )
    expect(dest).toBe('/onboarding/locked')
  })

  test('S3/S4: /onboarding/locked destination is exempt (no redirect loop)', async () => {
    seedDraftPhone(PHONE)
    const ctx = makeContext(() =>
      Promise.resolve({ lockedUntil: NOW + 86_400_000 }),
    )
    const passed = await guardPasses(() =>
      OnboardingLayoutRoute.options.beforeLoad({
        context: ctx,
        location: makeLocation('/onboarding/locked'),
      } as never),
    )
    expect(passed).toBe(true)
  })

  test('S17: lockedPhone persisted, draft empty, active lock → redirects to /onboarding/locked', async () => {
    act(() => useLockedPhoneStore.getState().setLockedPhone(PHONE))
    // draft.phone is '' (cleared in beforeEach)
    const ctx = makeContext(() =>
      Promise.resolve({ lockedUntil: NOW + 86_400_000 }),
    )
    const dest = await redirectTo(() =>
      OnboardingLayoutRoute.options.beforeLoad({
        context: ctx,
        location: makeLocation('/onboarding/verification'),
      } as never),
    )
    expect(dest).toBe('/onboarding/locked')
  })

  test('S17: lockedPhone cleared when server reports no active lock', async () => {
    act(() => useLockedPhoneStore.getState().setLockedPhone(PHONE))
    const ctx = makeContext(() => Promise.resolve({ lockedUntil: null }))

    const passed = await guardPasses(() =>
      OnboardingLayoutRoute.options.beforeLoad({
        context: ctx,
        location: makeLocation('/onboarding/welcome'),
      } as never),
    )
    expect(passed).toBe(true)
    expect(useLockedPhoneStore.getState().lockedPhone).toBeNull()
  })

  test('S20: no phone and no session → guard passes (nothing to lock on)', async () => {
    const fetchQuery = vi.fn()
    const ctx = makeContext(fetchQuery)
    const passed = await guardPasses(() =>
      OnboardingLayoutRoute.options.beforeLoad({
        context: ctx,
        location: makeLocation('/onboarding/welcome'),
      } as never),
    )
    expect(passed).toBe(true)
    expect(fetchQuery).not.toHaveBeenCalled()
  })
})

// ─── /onboarding/locked guard ────────────────────────────────────────────────

describe('/onboarding/locked guard', () => {
  test('S18: valid session → redirects to /home (session beats lock)', async () => {
    act(() => useAuthStore.getState().setTokens(expiredAccessPair)) // refresh valid
    const ctx = makeContext(() =>
      Promise.resolve({ lockedUntil: NOW + 86_400_000 }),
    )

    const dest = await redirectTo(() =>
      OnboardingLockedRoute.options.beforeLoad({ context: ctx } as never),
    )
    expect(dest).toBe('/home')
  })

  test('S3/S7: no phone → redirects to /onboarding/welcome', async () => {
    const ctx = makeContext(() =>
      Promise.resolve({ lockedUntil: NOW + 86_400_000 }),
    )
    const dest = await redirectTo(() =>
      OnboardingLockedRoute.options.beforeLoad({ context: ctx } as never),
    )
    expect(dest).toBe('/onboarding/welcome')
  })

  test('S7: active lock with pending phone → guard passes (stays on locked screen)', async () => {
    seedDraftPhone(PHONE)
    const ctx = makeContext(() =>
      Promise.resolve({ lockedUntil: NOW + 86_400_000 }),
    )
    const passed = await guardPasses(() =>
      OnboardingLockedRoute.options.beforeLoad({ context: ctx } as never),
    )
    expect(passed).toBe(true)
  })

  test('S5/S16: lock elapsed → clears pin and redirects to /onboarding/verification', async () => {
    seedDraftPhone(PHONE)
    act(() => useLockedPhoneStore.getState().setLockedPhone(PHONE))
    const ctx = makeContext(() => Promise.resolve({ lockedUntil: null }))

    const dest = await redirectTo(() =>
      OnboardingLockedRoute.options.beforeLoad({ context: ctx } as never),
    )
    expect(dest).toBe('/onboarding/verification')
    expect(useLockedPhoneStore.getState().lockedPhone).toBeNull()
  })

  test('S5/S16: lock elapsed uses lockedPhone when draft was cleared', async () => {
    // draft.phone is '' but lockedPhone is set — guard still resolves the phone
    act(() => useLockedPhoneStore.getState().setLockedPhone(PHONE))
    const ctx = makeContext(() => Promise.resolve({ lockedUntil: null }))

    const dest = await redirectTo(() =>
      OnboardingLockedRoute.options.beforeLoad({ context: ctx } as never),
    )
    expect(dest).toBe('/onboarding/verification')
  })

  test('S17: lockedPhone persisted + active lock → guard passes (lock holds)', async () => {
    act(() => useLockedPhoneStore.getState().setLockedPhone(PHONE))
    // draft cleared (beforeEach)
    const ctx = makeContext(() =>
      Promise.resolve({ lockedUntil: NOW + 86_400_000 }),
    )
    const passed = await guardPasses(() =>
      OnboardingLockedRoute.options.beforeLoad({ context: ctx } as never),
    )
    expect(passed).toBe(true)
  })
})
