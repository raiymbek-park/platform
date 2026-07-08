import type { PostKind } from '@raiymbek-park/shared/validation-schemas'
import type { PostFormValues } from '../lib/validators'

import { useLingui } from '@lingui/react/macro'
import { useState } from 'react'

import { useMediaPicker } from '@/shared/media'

import { illustrationUrl } from '../lib/illustration'
import { useCreatePost } from '../model/use-create-post'
import { KindSwitcher } from './kind-switcher'
import { PostFormFields } from './post-form-fields'

const emptyDefaults: PostFormValues = {
  category: null,
  description: '',
  title: '',
}

export type CreatePostFormProps = {
  canSwitchKind: boolean
  initialKind: PostKind
}

export const CreatePostForm = ({
  canSwitchKind,
  initialKind,
}: CreatePostFormProps) => {
  const { t } = useLingui()
  const [kind, setKind] = useState<PostKind>(initialKind)
  const media = useMediaPicker()
  const { createPost, isPending } = useCreatePost()

  const isOffer = kind === 'offer'

  return (
    <PostFormFields
      key={kind}
      defaultValues={emptyDefaults}
      illustration={illustrationUrl(kind)}
      isPending={isPending}
      kind={kind}
      kindSwitcher={
        canSwitchKind ? <KindSwitcher kind={kind} onChange={setKind} /> : null
      }
      media={media}
      submitIcon='send-horizontal'
      submitLabel={t`Опубликовать`}
      subtitle={
        isOffer
          ? t`Разместите частное объявление для жителей нашего ЖК.`
          : t`Опубликуйте уведомление для жителей нашего ЖК.`
      }
      title={isOffer ? t`Новое объявление` : t`Новое уведомление`}
      onSubmit={values => createPost({ ...values, files: media.files, kind })}
    />
  )
}
