import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type AuthMethod = 'phone' | 'google' | 'facebook'

type AuthMethodState = {
  method: AuthMethod | null
  setMethod: (method: AuthMethod) => void
}

export const useAuthMethodStore = create<AuthMethodState>()(
  persist(set => ({ method: null, setMethod: method => set({ method }) }), {
    name: 'auth-method',
  }),
)
