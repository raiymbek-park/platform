import type { BlockId } from '@raiymbek-park/shared/validation-schemas'
import type { Role } from '../lib/validators'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type OnboardingDraft = {
  name: string
  phone: string
  block: BlockId | null
  apartment: number
  role: Role | null
}

type OnboardingState = {
  draft: OnboardingDraft
  setDraft: (draft: OnboardingDraft) => void
  reset: () => void
}

const emptyDraft: OnboardingDraft = {
  name: '',
  phone: '',
  block: null,
  apartment: Number.NaN,
  role: null,
}

export const useOnboardingStore = create<OnboardingState>()(
  persist(
    set => ({
      draft: emptyDraft,
      setDraft: draft => set({ draft }),
      reset: () => set({ draft: emptyDraft }),
    }),
    { name: 'onboarding' },
  ),
)
