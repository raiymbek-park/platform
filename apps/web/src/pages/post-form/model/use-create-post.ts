import type {
  PostCategory,
  PostKind,
} from '@raiymbek-park/shared/validation-schemas'

import { useLingui } from '@lingui/react/macro'
import { randomId } from '@raiymbek-park/shared'
import { postCreatePayloadSchema } from '@raiymbek-park/shared/validation-schemas'

import { trpcClient } from '@/shared/api'
import { uploadPostMedia } from '@/shared/media'

import { tabForKind } from '../lib/tab-for-kind'
import { usePostMutation } from './use-post-mutation'

type CreatePostVariables = {
  category: PostCategory
  description: string
  files: File[]
  kind: PostKind
  title: string
}

export const useCreatePost = () => {
  const { t } = useLingui()
  const { isPending, submit } = usePostMutation<CreatePostVariables>(
    async ({ files, ...values }) => {
      const id = randomId()
      const { failedCount, urls } = await uploadPostMedia(id, files)
      const payload = postCreatePayloadSchema.parse({
        id,
        ...values,
        media: urls,
      })
      await trpcClient.posts.create.mutate(payload)
      return failedCount
    },
    {
      error: t`Не удалось опубликовать объявление. Попробуйте ещё раз.`,
      notFound: t`Объявление не найдено.`,
      partial: count =>
        t`Объявление опубликовано. Файлов не загрузилось: ${count}`,
      success: t`Объявление опубликовано.`,
    },
    ({ kind }) => tabForKind(kind),
  )

  return { createPost: submit, isPending }
}
