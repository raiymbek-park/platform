import type { PostView } from './use-posts-data'

import { creatablePostKinds } from '@raiymbek-park/shared/validation-schemas'
import { useQuery } from '@tanstack/react-query'

import { useTRPC } from '@/shared/api'

export const usePostActionsAccess = () => {
  const trpc = useTRPC()
  const { data } = useQuery(trpc.resident.me.queryOptions())
  const role = data?.role
  const isAdministration = role === 'administration'

  const canManage = (post: PostView) => post.isMine || isAdministration

  return {
    canCreate: role !== undefined && creatablePostKinds(role).length > 0,
    canDelete: canManage,
    canEdit: canManage,
  }
}
