import type { QueryClient } from '@tanstack/react-query'

import { act } from 'react'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'

// Mock the tRPC client at the network boundary so refreshSession can be
// tested without a real HTTP connection. vi.hoisted ensures the fn reference
// is created before vi.mock's factory runs (vi.mock is hoisted to the top).
const { mockRefreshMutate } = vi.hoisted(() => ({
  mockRefreshMutate: vi.fn(),
}))
vi.mock('@/shared/api', () => ({
  trpcClient: { auth: { refresh: { mutate: mockRefreshMutate } } },
}))

import {
  getLockRemaining,
  hasValidAccessToken,
  hasValidRefreshToken,
  isLocked,
  refreshSession,
} from './session-guard'
import { useAuthStore } from './use-auth-store'

const NOW = 1_700_000_000_000

const tokenPair = (accessExpiry: number, refreshExpiry: number) => ({
  accessToken: 'access',
  accessTokenExpiresAt: accessExpiry,
  refreshToken: 'refresh',
  refreshTokenExpiresAt: refreshExpiry,
})

beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(NOW)
  act(() => useAuthStore.getState().clear())
  mockRefreshMutate.mockReset()
})

afterEach(() => {
  vi.useRealTimers()
})

// ---------------------------------------------------------------------------
// hasValidAccessToken
// ---------------------------------------------------------------------------

describe('hasValidAccessToken', () => {
  test('returns false when no tokens are stored', () => {
    expect(hasValidAccessToken()).toBe(false)
  })

  test('returns false when access token is expired', () => {
    act(() => useAuthStore.getState().setTokens(tokenPair(NOW - 1, NOW + 1)))
    expect(hasValidAccessToken()).toBe(false)
  })

  test('returns true when access token expires in the future', () => {
    act(() =>
      useAuthStore.getState().setTokens(tokenPair(NOW + 1000, NOW + 9999)),
    )
    expect(hasValidAccessToken()).toBe(true)
  })

  test('returns false when access token expires exactly now (not strictly future)', () => {
    act(() => useAuthStore.getState().setTokens(tokenPair(NOW, NOW + 9999)))
    expect(hasValidAccessToken()).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// hasValidRefreshToken
// ---------------------------------------------------------------------------

describe('hasValidRefreshToken', () => {
  test('returns false when no tokens are stored', () => {
    expect(hasValidRefreshToken()).toBe(false)
  })

  test('returns false when refresh token is expired', () => {
    act(() => useAuthStore.getState().setTokens(tokenPair(NOW - 5000, NOW - 1)))
    expect(hasValidRefreshToken()).toBe(false)
  })

  test('returns true when refresh token expires in the future', () => {
    act(() =>
      useAuthStore
        .getState()
        .setTokens(tokenPair(NOW - 1000, NOW + 86_400_000)),
    )
    expect(hasValidRefreshToken()).toBe(true)
  })

  test('returns true even when access token is already expired', () => {
    act(() =>
      useAuthStore
        .getState()
        .setTokens(tokenPair(NOW - 1000, NOW + 86_400_000)),
    )
    expect(hasValidRefreshToken()).toBe(true)
    expect(hasValidAccessToken()).toBe(false)
  })

  test('returns false when refresh token expires exactly now (not strictly future)', () => {
    act(() => useAuthStore.getState().setTokens(tokenPair(NOW - 1, NOW)))
    expect(hasValidRefreshToken()).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// isLocked
// ---------------------------------------------------------------------------

describe('isLocked', () => {
  test('returns false for null', () => {
    expect(isLocked(null)).toBe(false)
  })

  test('returns false when lockedUntil is in the past', () => {
    expect(isLocked(NOW - 1)).toBe(false)
  })

  test('returns false when lockedUntil equals now', () => {
    expect(isLocked(NOW)).toBe(false)
  })

  test('returns true when lockedUntil is in the future', () => {
    expect(isLocked(NOW + 1)).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// refreshSession
// ---------------------------------------------------------------------------

describe('refreshSession', () => {
  test('returns false immediately when no tokens are stored', async () => {
    const result = await refreshSession()
    expect(result).toBe(false)
    expect(mockRefreshMutate).not.toHaveBeenCalled()
  })

  test('calls auth.refresh with the stored refresh token on success', async () => {
    const initial = tokenPair(NOW - 1000, NOW + 86_400_000)
    act(() => useAuthStore.getState().setTokens(initial))

    const fresh = tokenPair(NOW + 3600_000, NOW + 86_400_000 * 2)
    mockRefreshMutate.mockResolvedValue(fresh)

    const result = await refreshSession()

    expect(result).toBe(true)
    expect(mockRefreshMutate).toHaveBeenCalledWith({
      refreshToken: initial.refreshToken,
    })
    expect(useAuthStore.getState().tokens).toEqual(fresh)
  })

  test('clears tokens and returns false when auth.refresh throws', async () => {
    act(() =>
      useAuthStore
        .getState()
        .setTokens(tokenPair(NOW - 1000, NOW + 86_400_000)),
    )
    mockRefreshMutate.mockRejectedValue(new Error('UNAUTHORIZED'))

    const result = await refreshSession()

    expect(result).toBe(false)
    expect(useAuthStore.getState().tokens).toBeNull()
  })
})

// ---------------------------------------------------------------------------
// getLockRemaining
// ---------------------------------------------------------------------------

describe('getLockRemaining', () => {
  test('returns lockedUntil from otp.status', async () => {
    const lockedUntil = NOW + 86_400_000
    const mockQueryClient = {
      fetchQuery: vi.fn().mockResolvedValue({ lockedUntil }),
    } as unknown as QueryClient

    const mockQueryOptions = vi.fn().mockReturnValue('query-key-options')
    const mockTrpc = {
      otp: { status: { queryOptions: mockQueryOptions } },
    } as unknown as typeof import('@/shared/api').trpc

    const result = await getLockRemaining(
      mockQueryClient,
      mockTrpc,
      '+77071234567',
    )

    expect(result).toBe(lockedUntil)
    expect(mockQueryOptions).toHaveBeenCalledWith({ phone: '+77071234567' })
    expect(mockQueryClient.fetchQuery).toHaveBeenCalledWith('query-key-options')
  })

  test('returns null when server reports no lock', async () => {
    const mockQueryClient = {
      fetchQuery: vi.fn().mockResolvedValue({ lockedUntil: null }),
    } as unknown as QueryClient

    const mockTrpc = {
      otp: { status: { queryOptions: vi.fn().mockReturnValue({}) } },
    } as unknown as typeof import('@/shared/api').trpc

    const result = await getLockRemaining(
      mockQueryClient,
      mockTrpc,
      '+77071234567',
    )

    expect(result).toBeNull()
  })
})
