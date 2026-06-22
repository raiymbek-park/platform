import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type LockedPhoneState = {
  lockedPhone: string | null
  setLockedPhone: (phone: string) => void
  clearLockedPhone: () => void
}

// Persisted separately from the onboarding draft so clearing the `onboarding`
// store does not bypass an active server lock (edge case S17). The route guards
// resolve the phone to check as `lockedPhone ?? draft.phone`.
export const useLockedPhoneStore = create<LockedPhoneState>()(
  persist(
    set => ({
      lockedPhone: null,
      setLockedPhone: lockedPhone => set({ lockedPhone }),
      clearLockedPhone: () => set({ lockedPhone: null }),
    }),
    { name: 'locked-phone' },
  ),
)
