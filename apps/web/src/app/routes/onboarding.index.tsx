import { createFileRoute, redirect } from '@tanstack/react-router'

import { isSignedIn } from '@/shared/session'

export const Route = createFileRoute('/onboarding/')({
  beforeLoad: async () => {
    if (await isSignedIn()) throw redirect({ to: '/home' })
    throw redirect({ to: '/onboarding/welcome' })
  },
})
