import { createFileRoute, redirect } from '@tanstack/react-router'

import { useConfirmationStore } from '@/features/onboarding'
import { OtpVerificationPage } from '@/pages/onboarding'

export const Route = createFileRoute('/onboarding/verification')({
  beforeLoad: () => {
    if (useConfirmationStore.getState().confirmation === null) {
      throw redirect({ to: '/onboarding/welcome' })
    }
  },
  component: OtpVerificationPage,
})
