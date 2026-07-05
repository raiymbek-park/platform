import type { ReactNode } from 'react'
import type { MediaPicker } from './use-media-picker'

import { useLingui } from '@lingui/react/macro'
import { ImageForm } from '@raiymbek-park/ui'

import css from './media-field.module.scss'

export type MediaFieldProps = {
  label: ReactNode
  media: MediaPicker
}

export const MediaField = ({ label, media }: MediaFieldProps) => {
  const { t } = useLingui()

  return (
    <div className={css.field}>
      <span className={css.label}>{label}</span>
      <ImageForm
        activeIndex={media.activeIndex}
        addLabel={t`Добавить`}
        photos={media.photos}
        removeLabel={t`Удалить`}
        onAdd={media.add}
        onRemove={media.removeCurrent}
        onSelect={media.select}
      />
    </div>
  )
}
