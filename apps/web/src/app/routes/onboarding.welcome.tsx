import { createFileRoute, redirect } from '@tanstack/react-router'

import { WelcomePage } from '@/pages/onboarding'
import { hasLocaleChoice } from '@/shared/i18n'
import { isSignedIn } from '@/shared/session'

export const Route = createFileRoute('/onboarding/welcome')({
  beforeLoad: async () => {
    if (await isSignedIn()) return
    if (!hasLocaleChoice()) throw redirect({ to: '/onboarding/language' })
  },
  component: WelcomePage,
})
