import { create } from 'zustand'

type OtpRequestState = {
  attemptedPhone: string | null
  markAttempted: (phone: string) => void
  clear: () => void
}

export const useOtpRequestStore = create<OtpRequestState>()(set => ({
  attemptedPhone: null,
  markAttempted: phone => set({ attemptedPhone: phone }),
  clear: () => set({ attemptedPhone: null }),
}))
