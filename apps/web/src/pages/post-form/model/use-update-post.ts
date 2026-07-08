import type {
  PostCategory,
  PostKind,
} from '@raiymbek-park/shared/validation-schemas'
import type { MediaItem } from '@/shared/media'

import { useLingui } from '@lingui/react/macro'
import { postUpdateInputSchema } from '@raiymbek-park/shared/validation-schemas'

import { trpcClient } from '@/shared/api'
import { uploadPostMediaItems } from '@/shared/media'

import { usePostMutation } from './use-post-mutation'

type UpdatePostVariables = {
  category: PostCategory
  description: string
  items: MediaItem[]
  kind: PostKind
  title: string
}

export const useUpdatePost = (postId: string) => {
  const { t } = useLingui()
  const { isPending, submit } = usePostMutation<UpdatePostVariables>(
    async ({ items, ...values }) => {
      const { failedCount, urls } = await uploadPostMediaItems(postId, items)
      const payload = postUpdateInputSchema.parse({
        id: postId,
        ...values,
        media: urls,
      })
      await trpcClient.posts.update.mutate(payload)
      return failedCount
    },
    {
      error: t`Не удалось сохранить изменения. Попробуйте ещё раз.`,
      notFound: t`Объявление не найдено.`,
      partial: count => t`Изменения сохранены. Файлов не загрузилось: ${count}`,
      success: t`Изменения сохранены.`,
    },
    ({ kind }) => (kind === 'offer' ? 'offers' : 'announcements'),
  )

  return { isPending, updatePost: submit }
}
