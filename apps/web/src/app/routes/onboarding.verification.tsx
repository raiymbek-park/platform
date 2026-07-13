import { createFileRoute, redirect } from '@tanstack/react-router'

import { useOtpRequestStore } from '@/features/onboarding'
import { OtpVerificationPage } from '@/pages/onboarding'

export const Route = createFileRoute('/onboarding/verification')({
  beforeLoad: () => {
    if (useOtpRequestStore.getState().sentPhone === null) {
      throw redirect({ to: '/onboarding/welcome' })
    }
  },
  component: OtpVerificationPage,
})
