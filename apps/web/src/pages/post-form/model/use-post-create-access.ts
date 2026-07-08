import { creatablePostKinds } from '@raiymbek-park/shared/validation-schemas'
import { useQuery } from '@tanstack/react-query'

import { useTRPC } from '@/shared/api'

export const usePostCreateAccess = () => {
  const trpc = useTRPC()
  const { data, isPending } = useQuery(trpc.resident.me.queryOptions())
  const role = data?.role

  return { isPending, kinds: role ? creatablePostKinds(role) : [] }
}
