import { createFileRoute, redirect } from '@tanstack/react-router'

import { useOnboardingStore } from '@/features/onboarding/registration-form'
import { OtpVerificationPage } from '@/pages/onboarding'

export const Route = createFileRoute('/onboarding/verification')({
  beforeLoad: () => {
    if (useOnboardingStore.getState().draft.phone === '') {
      throw redirect({ to: '/onboarding/welcome' })
    }
  },
  component: OtpVerificationPage,
})
