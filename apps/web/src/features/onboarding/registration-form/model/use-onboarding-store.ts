import { create } from 'zustand'
import { persist } from 'zustand/middleware'

import type { BlockId } from '../lib/apartment-ranges'
import type { Role } from '../lib/validators'

export type OnboardingDraft = {
  name: string
  phone: string
  block: BlockId | null
  apartment: string
  role: Role | null
}

type OnboardingState = {
  draft: OnboardingDraft
  pendingPhone: string | null
  setDraft: (draft: OnboardingDraft) => void
  setPendingPhone: (phone: string) => void
  reset: () => void
}

const emptyDraft: OnboardingDraft = {
  name: '',
  phone: '',
  block: null,
  apartment: '',
  role: null,
}

export const useOnboardingStore = create<OnboardingState>()(
  persist(
    set => ({
      draft: emptyDraft,
      pendingPhone: null,
      setDraft: draft => set({ draft }),
      setPendingPhone: pendingPhone => set({ pendingPhone }),
      reset: () => set({ draft: emptyDraft, pendingPhone: null }),
    }),
    { name: 'onboarding' },
  ),
)
