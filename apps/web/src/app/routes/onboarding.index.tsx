import { createFileRoute, redirect } from '@tanstack/react-router'

import { useOnboardingStore } from '@/features/onboarding/registration-form'
import {
  hasValidRefreshToken,
  isLocked,
  refreshSession,
  useLockedPhoneStore,
} from '@/shared/auth'

const isCoolingDown = (resendAvailableAt: number | null) =>
  resendAvailableAt !== null && resendAvailableAt > Date.now()

export const Route = createFileRoute('/onboarding/')({
  beforeLoad: async ({ context }) => {
    if (hasValidRefreshToken() && (await refreshSession())) {
      throw redirect({ to: '/home' })
    }

    const { lockedPhone, clearLockedPhone } = useLockedPhoneStore.getState()
    const phone = lockedPhone ?? useOnboardingStore.getState().draft.phone
    if (phone === '') throw redirect({ to: '/onboarding/welcome' })

    const status = await context.queryClient.fetchQuery(
      context.trpc.otp.status.queryOptions({ phone }),
    )

    if (isLocked(status.lockedUntil)) {
      throw redirect({ to: '/onboarding/locked' })
    }
    // No active lock — drop the stale pin so it can't strand the user.
    if (lockedPhone !== null) clearLockedPhone()
    if (status.hasActiveCode || isCoolingDown(status.resendAvailableAt)) {
      throw redirect({ to: '/onboarding/verification' })
    }
    throw redirect({ to: '/onboarding/welcome' })
  },
})
