import { ScreenHeader } from '@raiymbek-park/ui'
import { createFileRoute, Outlet, redirect } from '@tanstack/react-router'

import { useOnboardingStore } from '@/features/onboarding/registration-form'
import { getLockRemaining, hasValidRefreshToken, isLocked } from '@/shared/auth'

const OnboardingLayout = () => (
  <>
    <ScreenHeader />
    <Outlet />
  </>
)

export const Route = createFileRoute('/onboarding')({
  beforeLoad: async ({ context, location }) => {
    // A valid session beats the lock — let the index/home guards route to /home.
    if (hasValidRefreshToken()) return
    // The locked screen is exempt, otherwise the redirect would loop on itself.
    if (location.pathname === '/onboarding/locked') return

    const phone = useOnboardingStore.getState().draft.phone
    if (phone === '') return

    const lockedUntil = await getLockRemaining(
      context.queryClient,
      context.trpc,
      phone,
    )
    if (isLocked(lockedUntil)) {
      throw redirect({ to: '/onboarding/locked' })
    }
  },
  component: OnboardingLayout,
})
