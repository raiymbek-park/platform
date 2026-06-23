import { useQuery } from '@tanstack/react-query'

import { useTRPC } from '@/shared/api'

export const useChangesData = () => {
  const trpc = useTRPC()
  return useQuery(trpc.home.changes.queryOptions())
}
