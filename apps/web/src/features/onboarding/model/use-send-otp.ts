import { useMutation } from '@tanstack/react-query'

import { useTRPC } from '@/shared/api'

import { useOtpRequestStore } from './use-otp-request-store'

export const useSendOtp = () => {
  const trpc = useTRPC()
  return useMutation({
    ...trpc.otp.send.mutationOptions(),
    onSuccess: (_data, { phone }) =>
      useOtpRequestStore.getState().markSent(phone),
  })
}
