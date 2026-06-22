import { useMutation } from '@tanstack/react-query'

import { useTRPC } from '@/shared/api'

export const useRegisterResident = () => {
  const trpc = useTRPC()
  return useMutation(trpc.resident.register.mutationOptions())
}
