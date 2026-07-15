import { createFileRoute, redirect } from '@tanstack/react-router'

import { AuthMethodPage } from '@/pages/onboarding'
import { hasLocaleChoice } from '@/shared/i18n'

export const Route = createFileRoute('/onboarding/auth-method')({
  beforeLoad: () => {
    if (!hasLocaleChoice()) throw redirect({ to: '/onboarding/language' })
  },
  component: AuthMethodPage,
})
