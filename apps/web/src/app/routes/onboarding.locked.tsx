import { createFileRoute, redirect } from '@tanstack/react-router'

import { useOnboardingStore } from '@/features/onboarding/registration-form'
import { AccountLockedPage } from '@/pages/onboarding'
import { getLockRemaining, hasValidRefreshToken, isLocked } from '@/shared/auth'

export const Route = createFileRoute('/onboarding/locked')({
  beforeLoad: async ({ context }) => {
    if (hasValidRefreshToken()) throw redirect({ to: '/home' })

    const phone = useOnboardingStore.getState().draft.phone
    if (phone === '') throw redirect({ to: '/onboarding/welcome' })

    const lockedUntil = await getLockRemaining(
      context.queryClient,
      context.trpc,
      phone,
    )
    if (!isLocked(lockedUntil)) {
      throw redirect({ to: '/onboarding/verification' })
    }
  },
  component: AccountLockedPage,
})
