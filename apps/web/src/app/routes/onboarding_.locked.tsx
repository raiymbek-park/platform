import { ScreenHeader } from '@raiymbek-park/ui'
import { createFileRoute, redirect } from '@tanstack/react-router'

import { useOnboardingStore } from '@/features/onboarding/registration-form'
import { AccountLockedPage } from '@/pages/onboarding'

const AccountLockedScreen = () => (
  <>
    <ScreenHeader hasSwitcher={false} />
    <AccountLockedPage />
  </>
)

export const Route = createFileRoute('/onboarding_/locked')({
  beforeLoad: () => {
    if (useOnboardingStore.getState().draft.phone === '') {
      throw redirect({ to: '/onboarding/welcome' })
    }
  },
  component: AccountLockedScreen,
})
