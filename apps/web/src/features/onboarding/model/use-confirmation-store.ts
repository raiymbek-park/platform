import type { ConfirmationResult } from 'firebase/auth'

import { create } from 'zustand'

type ConfirmationState = {
  confirmation: ConfirmationResult | null
  setConfirmation: (confirmation: ConfirmationResult) => void
  clear: () => void
}

export const useConfirmationStore = create<ConfirmationState>()(set => ({
  confirmation: null,
  setConfirmation: confirmation => set({ confirmation }),
  clear: () => set({ confirmation: null }),
}))
