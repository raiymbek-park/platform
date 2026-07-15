import { createFileRoute, redirect } from '@tanstack/react-router'

import { useOtpRequestStore } from '@/features/onboarding'
import { AccountLockedPage } from '@/pages/onboarding'

export const Route = createFileRoute('/onboarding/locked')({
  beforeLoad: () => {
    if (useOtpRequestStore.getState().attemptedPhone === null) {
      throw redirect({ to: '/onboarding/registration' })
    }
  },
  component: AccountLockedPage,
})
