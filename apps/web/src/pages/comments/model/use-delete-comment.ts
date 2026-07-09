import type { CommentTarget } from '@raiymbek-park/shared/validation-schemas'

import { useMutation, useQueryClient } from '@tanstack/react-query'

import { isNotFoundError, trpcClient, useTRPC } from '@/shared/api'

type Callbacks = {
  onFailure: () => void
  onSuccess: () => void
}

export const useDeleteComment = ({ parent, parentId }: CommentTarget) => {
  const trpc = useTRPC()
  const queryClient = useQueryClient()
  const listKey = trpc.comments.list.pathKey()
  const parentKey =
    parent === 'post' ? trpc.posts.list.pathKey() : trpc.issues.list.pathKey()

  const mutation = useMutation({
    mutationFn: (id: string) =>
      trpcClient.comments.delete.mutate({ id, parent, parentId }),
    onSettled: () =>
      Promise.all([
        queryClient.invalidateQueries({
          queryKey: listKey,
          refetchType: 'all',
        }),
        queryClient.invalidateQueries({
          queryKey: parentKey,
          refetchType: 'all',
        }),
      ]),
  })

  const deleteComment = (id: string, { onFailure, onSuccess }: Callbacks) =>
    mutation.mutate(id, {
      onError: error => (isNotFoundError(error) ? onSuccess() : onFailure()),
      onSuccess,
    })

  return { deleteComment, isPending: mutation.isPending }
}
