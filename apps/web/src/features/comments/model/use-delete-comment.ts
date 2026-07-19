import type { CommentTarget } from '@raiymbek-park/shared/validation-schemas'

import { useMutation } from '@tanstack/react-query'

import { isNotFoundError, trpcClient } from '@/shared/api'

import { useInvalidateCommentQueries } from './use-invalidate-comment-queries'
import { useStoreDeletedComments } from './use-store-deleted-comments'

type Callbacks = {
  onFailure: () => void
  onSuccess: () => void
}

export const useDeleteComment = ({ parent, parentId }: CommentTarget) => {
  const { invalidateAll } = useInvalidateCommentQueries(parent)
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
        await invalidateAll()
        restore(id)
      },
    })
  }

  return { deleteComment, isPending: mutation.isPending }
}
