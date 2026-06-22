import { useMutation, useQueryClient } from '@tanstack/react-query'

import { useTRPC } from '@/shared/api'

export const useVerifyOtp = () => {
  const trpc = useTRPC()
  const queryClient = useQueryClient()

  return useMutation({
    ...trpc.otp.verify.mutationOptions(),
    onSettled: () =>
      queryClient.invalidateQueries({ queryKey: trpc.otp.status.queryKey() }),
  })
}
