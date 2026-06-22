import { createFileRoute, redirect } from '@tanstack/react-router'

import { HomePage } from '@/pages/home'
import {
  hasValidAccessToken,
  hasValidRefreshToken,
  refreshSession,
} from '@/shared/auth'

export const Route = createFileRoute('/home')({
  beforeLoad: async () => {
    if (hasValidAccessToken()) return
    if (hasValidRefreshToken() && (await refreshSession())) return
    throw redirect({ to: '/onboarding/welcome' })
  },
  component: HomePage,
})
