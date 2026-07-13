import { create } from 'zustand'

type OtpRequestState = {
  sentPhone: string | null
  markSent: (phone: string) => void
  clear: () => void
}

export const useOtpRequestStore = create<OtpRequestState>()(set => ({
  sentPhone: null,
  markSent: phone => set({ sentPhone: phone }),
  clear: () => set({ sentPhone: null }),
}))
