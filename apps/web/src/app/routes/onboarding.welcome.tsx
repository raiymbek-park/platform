import { createFileRoute, redirect } from '@tanstack/react-router'

import { WelcomePage } from '@/pages/onboarding'
import { hasLocaleChoice } from '@/shared/i18n'

export const Route = createFileRoute('/onboarding/welcome')({
  beforeLoad: () => {
    if (!hasLocaleChoice()) throw redirect({ to: '/onboarding/language' })
  },
  component: WelcomePage,
})
