import type { CommentTarget } from '@raiymbek-park/shared/validation-schemas'

import { randomId } from '@raiymbek-park/shared'
import { commentCreateInputSchema } from '@raiymbek-park/shared/validation-schemas'
import { useMutation, useQueryClient } from '@tanstack/react-query'

import { trpcClient, useTRPC } from '@/shared/api'
import { uploadCommentMedia } from '@/shared/media'

type CreateArgs = {
  files: File[]
  text: string
}

type Callbacks = {
  onFailure: () => void
  onSuccess: (failedCount: number) => void
}

export const useCreateComment = ({ parent, parentId }: CommentTarget) => {
  const trpc = useTRPC()
  const queryClient = useQueryClient()
  const listKey = trpc.comments.list.pathKey()
  const parentKey =
    parent === 'post' ? trpc.posts.list.pathKey() : trpc.issues.list.pathKey()

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

  const createComment = (
    args: CreateArgs,
    { onFailure, onSuccess }: Callbacks,
  ) => mutation.mutate(args, { onError: onFailure, onSuccess })

  return { createComment, isPending: mutation.isPending }
}
