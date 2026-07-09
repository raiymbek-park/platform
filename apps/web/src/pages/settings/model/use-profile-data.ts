import { useQuery } from '@tanstack/react-query'

import { useTRPC } from '@/shared/api'

export const useProfileData = () => {
  const trpc = useTRPC()
  return useQuery(trpc.resident.me.queryOptions())
}
