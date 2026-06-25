import { ScreenHeader } from '@raiymbek-park/ui'
import { createFileRoute, Outlet, redirect } from '@tanstack/react-router'

import { isSignedIn } from '@/shared/session'

const OnboardingLayout = () => (
  <>
    <ScreenHeader />
    <Outlet />
  </>
)

export const Route = createFileRoute('/onboarding')({
  beforeLoad: async () => {
    if (await isSignedIn()) throw redirect({ to: '/home' })
  },
  component: OnboardingLayout,
})
