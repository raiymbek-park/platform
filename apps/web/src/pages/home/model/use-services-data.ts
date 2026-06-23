import { useQuery } from '@tanstack/react-query'

import { useTRPC } from '@/shared/api'

export const useServicesData = () => {
  const trpc = useTRPC()
  return useQuery(trpc.home.services.queryOptions())
}
