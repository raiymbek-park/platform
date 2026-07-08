import { createFileRoute, redirect } from '@tanstack/react-router'

import { hasLocaleChoice } from '@/shared/i18n'
import { isSignedIn } from '@/shared/session'

export const Route = createFileRoute('/onboarding/')({
  beforeLoad: async () => {
    if (await isSignedIn()) throw redirect({ to: '/home' })
    if (!hasLocaleChoice()) throw redirect({ to: '/onboarding/language' })
    throw redirect({ to: '/onboarding/welcome' })
  },
})
