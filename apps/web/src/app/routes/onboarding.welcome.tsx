import { createFileRoute } from '@tanstack/react-router'

import { OnboardingWelcomePage } from '@/pages/onboarding-welcome'

export const Route = createFileRoute('/onboarding/welcome')({
  component: OnboardingWelcomePage,
})
