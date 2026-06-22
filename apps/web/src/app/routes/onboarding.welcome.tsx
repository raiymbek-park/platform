import { createFileRoute } from '@tanstack/react-router'

import { WelcomePage } from '@/pages/onboarding'

export const Route = createFileRoute('/onboarding/welcome')({
  component: WelcomePage,
})
