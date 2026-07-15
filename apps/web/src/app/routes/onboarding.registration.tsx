import { createFileRoute, redirect } from '@tanstack/react-router'

import { useAuthMethodStore } from '@/features/onboarding'
import { RegistrationPage } from '@/pages/onboarding'
import { hasLocaleChoice } from '@/shared/i18n'
import { isSignedIn } from '@/shared/session'

export const Route = createFileRoute('/onboarding/registration')({
  beforeLoad: async () => {
    if (await isSignedIn()) return
    if (!hasLocaleChoice()) throw redirect({ to: '/onboarding/language' })
    if (useAuthMethodStore.getState().method !== 'phone') {
      throw redirect({ to: '/onboarding/auth-method' })
    }
  },
  component: RegistrationPage,
})
