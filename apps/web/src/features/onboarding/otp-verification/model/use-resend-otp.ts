import { useMutation, useQueryClient } from '@tanstack/react-query'

import { useTRPC } from '@/shared/api'

export const useResendOtp = () => {
  const trpc = useTRPC()
  const queryClient = useQueryClient()

  return useMutation({
    ...trpc.otp.send.mutationOptions(),
    onSettled: () =>
      queryClient.invalidateQueries({ queryKey: trpc.otp.status.queryKey() }),
  })
}
