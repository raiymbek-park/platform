import { ScreenHeader } from '@raiymbek-park/ui'
import { createFileRoute, Outlet, redirect } from '@tanstack/react-router'

import { isRegistered, isSignedIn } from '@/shared/session'

const OnboardingLayout = () => (
  <>
    <ScreenHeader />
    <Outlet />
  </>
)

export const Route = createFileRoute('/onboarding')({
  beforeLoad: async ({ context, location }) => {
    if (!(await isSignedIn())) return
    if (await isRegistered(context)) throw redirect({ to: '/home' })
    if (location.pathname !== '/onboarding/welcome') {
      throw redirect({ to: '/onboarding/welcome' })
    }
  },
  component: OnboardingLayout,
})
