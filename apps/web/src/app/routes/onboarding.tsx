import { ScreenHeader } from '@raiymbek-park/ui'
import { createFileRoute, Outlet } from '@tanstack/react-router'

const OnboardingLayout = () => (
  <>
    <ScreenHeader />
    <Outlet />
  </>
)

export const Route = createFileRoute('/onboarding')({
  component: OnboardingLayout,
})
