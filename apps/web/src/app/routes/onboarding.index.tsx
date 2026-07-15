import { createFileRoute, redirect } from '@tanstack/react-router'

import { hasLocaleChoice } from '@/shared/i18n'

export const Route = createFileRoute('/onboarding/')({
  beforeLoad: () => {
    if (!hasLocaleChoice()) throw redirect({ to: '/onboarding/language' })
    throw redirect({ to: '/onboarding/welcome' })
  },
})
