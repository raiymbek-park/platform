import { createFileRoute, redirect } from '@tanstack/react-router'

import { OtpVerificationPage } from '@/pages/onboarding'
import { useConfirmationStore } from '@/shared/auth'

export const Route = createFileRoute('/onboarding/verification')({
  beforeLoad: () => {
    if (useConfirmationStore.getState().confirmation === null) {
      throw redirect({ to: '/onboarding/welcome' })
    }
  },
  component: OtpVerificationPage,
})
