import { createFileRoute, redirect } from '@tanstack/react-router'

import { useOtpRequestStore } from '@/features/onboarding'
import { OtpVerificationPage } from '@/pages/onboarding'

export const Route = createFileRoute('/onboarding/verification')({
  beforeLoad: () => {
    if (useOtpRequestStore.getState().attemptedPhone === null) {
      throw redirect({ to: '/onboarding/registration' })
    }
  },
  component: OtpVerificationPage,
})
