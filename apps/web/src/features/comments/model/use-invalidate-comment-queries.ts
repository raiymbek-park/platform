import type { CommentTarget } from '@raiymbek-park/shared/validation-schemas'
import type { QueryKey } from '@tanstack/react-query'

import { useQueryClient } from '@tanstack/react-query'

import { useTRPC } from '@/shared/api'

export const useInvalidateCommentQueries = (
  parent: CommentTarget['parent'],
) => {
  const trpc = useTRPC()
  const queryClient = useQueryClient()
  const listKey = trpc.comments.list.pathKey()
  const parentKey =
    parent === 'post' ? trpc.posts.list.pathKey() : trpc.issues.list.pathKey()

  const invalidate = (queryKey: QueryKey) =>
    queryClient.invalidateQueries({ queryKey, refetchType: 'all' })

  return {
    invalidateAll: () =>
      Promise.all([invalidate(listKey), invalidate(parentKey)]),
    invalidateList: () => invalidate(listKey),
  }
}
