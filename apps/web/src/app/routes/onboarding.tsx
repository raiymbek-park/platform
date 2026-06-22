import { ScreenHeader } from '@raiymbek-park/ui'
import { createFileRoute, Outlet, redirect } from '@tanstack/react-router'

import { useOnboardingStore } from '@/features/onboarding/registration-form'
import {
  getLockRemaining,
  hasValidRefreshToken,
  isLocked,
  useLockedPhoneStore,
} from '@/shared/auth'

import css from './onboarding.module.scss'

const OnboardingLayout = () => (
  <>
    <ScreenHeader className={css.header} />
    <Outlet />
  </>
)

export const Route = createFileRoute('/onboarding')({
  beforeLoad: async ({ context, location }) => {
    // A valid session beats the lock — let the index/home guards route to /home.
    if (hasValidRefreshToken()) return
    // The locked screen is exempt, otherwise the redirect would loop on itself.
    if (location.pathname === '/onboarding/locked') return

    // Resolve from the persisted lock pin first so a wiped onboarding draft
    // still drives a fresh otp.status check — the lock survives clearing local
    // storage (S17).
    const { lockedPhone, clearLockedPhone } = useLockedPhoneStore.getState()
    const phone = lockedPhone ?? useOnboardingStore.getState().draft.phone
    if (phone === '') return

    const lockedUntil = await getLockRemaining(
      context.queryClient,
      context.trpc,
      phone,
    )
    if (isLocked(lockedUntil)) {
      throw redirect({ to: '/onboarding/locked' })
    }
    // The server lock lifted — drop the stale pin so it can't strand the user.
    if (lockedPhone !== null) clearLockedPhone()
  },
  component: OnboardingLayout,
})
