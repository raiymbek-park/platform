import { useMutation } from '@tanstack/react-query'

import { useTRPC } from '@/shared/api'

import { otpKeys } from './otp-keys'

export const useRegisterResident = () => {
  const trpc = useTRPC()
  return useMutation({
    ...trpc.resident.register.mutationOptions(),
    mutationKey: otpKeys.register(),
  })
}
