import { useMutation, useQueryClient } from '@tanstack/react-query'

import { useTRPC } from '@/shared/api'

export const useRegisterResident = () => {
  const trpc = useTRPC()
  const queryClient = useQueryClient()
  return useMutation({
    ...trpc.resident.register.mutationOptions(),
    onSuccess: () =>
      queryClient.removeQueries({ queryKey: trpc.resident.me.queryKey() }),
  })
}
