import type { CommentTarget } from '@raiymbek-park/shared/validation-schemas'

import { useMutation, useQueryClient } from '@tanstack/react-query'

import { isNotFoundError, trpcClient, useTRPC } from '@/shared/api'

import { useStoreDeletedComments } from './use-store-deleted-comments'

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
  const remove = useStoreDeletedComments(store => store.remove)
  const restore = useStoreDeletedComments(store => store.restore)

  const mutation = useMutation({
    mutationFn: (id: string) =>
      trpcClient.comments.delete.mutate({ id, parent, parentId }),
  })

  const deleteComment = (id: string, { onFailure, onSuccess }: Callbacks) => {
    remove(id)
    mutation.mutate(id, {
      onError: error => {
        if (isNotFoundError(error)) {
          onSuccess()
          return
        }
        restore(id)
        onFailure()
      },
      onSuccess,
      onSettled: async () => {
        await Promise.all([
          queryClient.invalidateQueries({
            queryKey: listKey,
            refetchType: 'all',
          }),
          queryClient.invalidateQueries({
            queryKey: parentKey,
            refetchType: 'all',
          }),
        ])
        restore(id)
      },
    })
  }

  return { deleteComment, isPending: mutation.isPending }
}
