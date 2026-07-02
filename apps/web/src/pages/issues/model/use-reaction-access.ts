import { useQuery } from '@tanstack/react-query'

import { useTRPC } from '@/shared/api'

export const useReactionAccess = () => {
  const trpc = useTRPC()
  const { data } = useQuery(trpc.resident.me.queryOptions())
  return { canReact: data ? data.role !== 'viewer' : false }
}
