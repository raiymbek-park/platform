import type { CommentTarget } from '@raiymbek-park/shared/validation-schemas'

import { commentUpdateInputSchema } from '@raiymbek-park/shared/validation-schemas'
import { useMutation } from '@tanstack/react-query'

import { trpcClient } from '@/shared/api'

import { useInvalidateCommentQueries } from './use-invalidate-comment-queries'
import { useStoreEditedComments } from './use-store-edited-comments'

type UpdateArgs = {
  id: string
  media: string[]
  text: string
}

type Callbacks = {
  onFailure: () => void
  onSuccess: () => void
}

export const useUpdateComment = ({ parent, parentId }: CommentTarget) => {
  const { invalidateList } = useInvalidateCommentQueries(parent)
  const apply = useStoreEditedComments(store => store.apply)
  const clear = useStoreEditedComments(store => store.clear)

  const mutation = useMutation({
    mutationFn: async ({ id, media, text }: UpdateArgs) => {
      const payload = commentUpdateInputSchema.parse({
        id,
        media,
        parent,
        parentId,
        text,
      })
      await trpcClient.comments.update.mutate(payload)
    },
  })

  const updateComment = (
    { id, media, text }: UpdateArgs,
    { onFailure, onSuccess }: Callbacks,
  ) => {
    apply(id, { editedAt: Date.now(), media, text })
    mutation.mutate(
      { id, media, text },
      {
        onError: () => {
          clear(id)
          onFailure()
        },
        onSuccess,
        onSettled: async () => {
          await invalidateList()
          clear(id)
        },
      },
    )
  }

  return { isPending: mutation.isPending, updateComment }
}
