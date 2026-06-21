import { useMutation } from '@tanstack/react-query'

import { useTRPC } from '@/shared/api'

import { otpKeys } from './otp-keys'

export const useVerifyOtp = () => {
  const trpc = useTRPC()
  return useMutation({
    ...trpc.otp.verify.mutationOptions(),
    mutationKey: otpKeys.verify(),
  })
}
