import { createFileRoute, redirect } from '@tanstack/react-router'

import { useOnboardingStore } from '@/features/onboarding/registration-form'
import { AccountLockedPage } from '@/pages/onboarding'
import {
  getLockRemaining,
  hasValidRefreshToken,
  isLocked,
  useLockedPhoneStore,
} from '@/shared/auth'

export const Route = createFileRoute('/onboarding/locked')({
  beforeLoad: async ({ context }) => {
    if (hasValidRefreshToken()) throw redirect({ to: '/home' })

    const { lockedPhone, clearLockedPhone } = useLockedPhoneStore.getState()
    const phone = lockedPhone ?? useOnboardingStore.getState().draft.phone
    if (phone === '') throw redirect({ to: '/onboarding/welcome' })

    const lockedUntil = await getLockRemaining(
      context.queryClient,
      context.trpc,
      phone,
    )
    if (!isLocked(lockedUntil)) {
      // Lock elapsed — drop the pin before returning to verification (S5/S16).
      clearLockedPhone()
      throw redirect({ to: '/onboarding/verification' })
    }
  },
  component: AccountLockedPage,
})
