import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type TokenPair = {
  accessToken: string
  accessTokenExpiresAt: number
  refreshToken: string
  refreshTokenExpiresAt: number
}

type AuthState = {
  tokens: TokenPair | null
  setTokens: (tokens: TokenPair) => void
  clear: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    set => ({
      tokens: null,
      setTokens: tokens => set({ tokens }),
      clear: () => set({ tokens: null }),
    }),
    { name: 'auth' },
  ),
)
