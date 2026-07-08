import type { PostView } from './use-posts-data'

import { useQuery } from '@tanstack/react-query'

import { useTRPC } from '@/shared/api'

export const usePostActionsAccess = () => {
  const trpc = useTRPC()
  const { data } = useQuery(trpc.resident.me.queryOptions())
  const role = data?.role
  const isAdministration = role === 'administration'

  const canManage = (post: PostView) => post.isMine || isAdministration

  return {
    canDelete: canManage,
    canEdit: canManage,
  }
}
