import type { CommentTarget } from '@raiymbek-park/shared/validation-schemas'

import { randomId } from '@raiymbek-park/shared'
import { commentCreateInputSchema } from '@raiymbek-park/shared/validation-schemas'
import { useMutation } from '@tanstack/react-query'

import { trpcClient } from '@/shared/api'
import { uploadCommentMedia } from '@/shared/media'

import { useInvalidateCommentQueries } from './use-invalidate-comment-queries'

type CreateArgs = {
  files: File[]
  text: string
}

type Callbacks = {
  onFailure: () => void
  onSuccess: (failedCount: number) => void
}

export const useCreateComment = ({ parent, parentId }: CommentTarget) => {
  const { invalidateAll } = useInvalidateCommentQueries(parent)

  const mutation = useMutation({
    mutationFn: async ({ files, text }: CreateArgs) => {
      const id = randomId()
      const { failedCount, urls } = await uploadCommentMedia(
        parent,
        parentId,
        id,
        files,
      )
      const payload = commentCreateInputSchema.parse({
        id,
        media: urls,
        parent,
        parentId,
        text,
      })
      await trpcClient.comments.create.mutate(payload)
      return failedCount
    },
    onSettled: invalidateAll,
  })

  const createComment = (
    args: CreateArgs,
    { onFailure, onSuccess }: Callbacks,
  ) => mutation.mutate(args, { onError: onFailure, onSuccess })

  return { createComment, isPending: mutation.isPending }
}
