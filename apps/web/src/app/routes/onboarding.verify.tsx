import { createFileRoute } from '@tanstack/react-router'

import { OtpVerify } from '@/features/onboarding/otp-verify'

export const Route = createFileRoute('/onboarding/verify')({
  component: OtpVerify,
})
