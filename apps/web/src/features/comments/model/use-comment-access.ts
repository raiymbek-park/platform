import type { Comment } from '@raiymbek-park/api'

import { useQuery } from '@tanstack/react-query'

import { useTRPC } from '@/shared/api'

export const useCommentAccess = () => {
  const trpc = useTRPC()
  const { data } = useQuery(trpc.resident.me.queryOptions())
  const role = data?.role
  const isAdministration = role === 'administration'

  return {
    canDelete: (comment: Comment) => comment.isMine || isAdministration,
    canEdit: (comment: Comment) => comment.isMine,
    canWrite: role !== undefined && role !== 'viewer',
  }
}
