import { creatablePostKinds } from '@raiymbek-park/shared/validation-schemas'
import { useQuery } from '@tanstack/react-query'

import { useTRPC } from '@/shared/api'

export const usePostCreateAccess = () => {
  const trpc = useTRPC()
  const { data, isError, isPending, refetch } = useQuery(
    trpc.resident.me.queryOptions(),
  )
  const role = data?.role

  return {
    isError,
    isPending,
    kinds: role ? creatablePostKinds(role) : [],
    refetch,
  }
}
