import type { QueryClient } from '@tanstack/react-query'
import type { trpc } from '@/shared/api'

import { trpcClient } from '@/shared/api'

import { useAuthStore } from './use-auth-store'

type OptionsProxy = typeof trpc

export const hasValidAccessToken = () => {
  const { tokens } = useAuthStore.getState()
  return tokens !== null && tokens.accessTokenExpiresAt > Date.now()
}

export const hasValidRefreshToken = () => {
  const { tokens } = useAuthStore.getState()
  return tokens !== null && tokens.refreshTokenExpiresAt > Date.now()
}

// Rotates the refresh token via auth.refresh. On success stores the fresh pair
// and returns true; on any failure (expired/invalid/network) clears the session
// and returns false so callers can fall back to a clean welcome redirect.
export const refreshSession = async () => {
  const { tokens, setTokens, clear } = useAuthStore.getState()
  if (tokens === null) return false
  try {
    const pair = await trpcClient.auth.refresh.mutate({
      refreshToken: tokens.refreshToken,
    })
    setTokens(pair)
    return true
  } catch {
    clear()
    return false
  }
}

export const getLockRemaining = async (
  queryClient: QueryClient,
  trpcProxy: OptionsProxy,
  phone: string,
) => {
  const status = await queryClient.fetchQuery(
    trpcProxy.otp.status.queryOptions({ phone }),
  )
  return status.lockedUntil
}

export const isLocked = (lockedUntil: number | null) =>
  lockedUntil !== null && lockedUntil > Date.now()
