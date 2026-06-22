import { useMutation } from '@tanstack/react-query'

import { useTRPC } from '@/shared/api'

export const useSendOtp = () => {
  const trpc = useTRPC()
  return useMutation(trpc.otp.send.mutationOptions())
}
