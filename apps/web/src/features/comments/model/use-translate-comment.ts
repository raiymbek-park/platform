import type { CommentTranslation } from '@raiymbek-park/api'
import type { CommentTarget } from '@raiymbek-park/shared/validation-schemas'

import { commentTranslateInputSchema } from '@raiymbek-park/shared/validation-schemas'
import { useMutation } from '@tanstack/react-query'

import { trpcClient } from '@/shared/api'

type Callbacks = {
  onFailure: () => void
  onSuccess: (translation: CommentTranslation) => void
}

export const useTranslateComment = (
  { parent, parentId }: CommentTarget,
  id: string,
) => {
  const mutation = useMutation({
    mutationFn: () => {
      const payload = commentTranslateInputSchema.parse({
        id,
        parent,
        parentId,
      })
      return trpcClient.comments.translate.mutate(payload)
    },
    mutationKey: ['comments', 'translate', id],
  })

  const translateComment = ({ onFailure, onSuccess }: Callbacks) =>
    mutation.mutate(undefined, { onError: onFailure, onSuccess })

  return { isTranslating: mutation.isPending, translateComment }
}
