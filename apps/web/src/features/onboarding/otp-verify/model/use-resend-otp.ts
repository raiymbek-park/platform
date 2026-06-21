import { useMutation } from '@tanstack/react-query'

import { useTRPC } from '@/shared/api'

import { otpKeys } from './otp-keys'

export const useResendOtp = () => {
  const trpc = useTRPC()
  return useMutation({
    ...trpc.otp.send.mutationOptions(),
    mutationKey: otpKeys.resend(),
  })
}
