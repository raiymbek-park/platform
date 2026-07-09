import type { CommentTarget } from '@raiymbek-park/shared/validation-schemas'

import { commentUpdateInputSchema } from '@raiymbek-park/shared/validation-schemas'
import { useMutation, useQueryClient } from '@tanstack/react-query'

import { trpcClient, useTRPC } from '@/shared/api'

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
  const trpc = useTRPC()
  const queryClient = useQueryClient()
  const listKey = trpc.comments.list.pathKey()

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
    onSettled: () =>
      queryClient.invalidateQueries({ queryKey: listKey, refetchType: 'all' }),
  })

  const updateComment = (
    args: UpdateArgs,
    { onFailure, onSuccess }: Callbacks,
  ) => mutation.mutate(args, { onError: onFailure, onSuccess })

  return { isPending: mutation.isPending, updateComment }
}
