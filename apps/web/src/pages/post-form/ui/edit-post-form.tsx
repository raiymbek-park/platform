import type { Post } from '@raiymbek-park/api'

import { useLingui } from '@lingui/react/macro'

import { useMediaPicker } from '@/shared/media'

import { illustrationUrl } from '../lib/illustration'
import { useUpdatePost } from '../model/use-update-post'
import { PostFormFields } from './post-form-fields'
import { PostLoader } from './post-loader'

const EditPostFormReady = ({ post }: { post: Post }) => {
  const { t } = useLingui()
  const media = useMediaPicker({ initialUrls: post.media })
  const { isPending, updatePost } = useUpdatePost(post.id)

  const isOffer = post.kind === 'offer'

  return (
    <PostFormFields
      defaultValues={{
        category: post.category,
        description: post.description,
        title: post.title,
      }}
      illustration={illustrationUrl(post.kind)}
      isPending={isPending}
      kind={post.kind}
      media={media}
      submitIcon='check'
      submitLabel={t`Сохранить`}
      subtitle={
        isOffer
          ? t`Измените объявление и сохраните изменения.`
          : t`Измените уведомление и сохраните изменения.`
      }
      title={
        isOffer ? t`Редактировать объявление` : t`Редактировать уведомление`
      }
      onSubmit={values =>
        updatePost({ ...values, items: media.items, kind: post.kind })
      }
    />
  )
}

export const EditPostForm = ({ postId }: { postId: string }) => (
  <PostLoader postId={postId}>
    {post => <EditPostFormReady post={post} />}
  </PostLoader>
)
