import type { ChangeEvent } from 'react'

import { useLingui } from '@lingui/react/macro'
import { Avatar, InlineButton } from '@raiymbek-park/ui'
import { useRef } from 'react'

import css from './avatar-upload.module.scss'

export type AvatarUploadProps = {
  disabled?: boolean
  name: string
  src: string | null
  onPick: (file: File) => void
  onRemove: () => void
}

export const AvatarUpload = ({
  disabled,
  name,
  src,
  onPick,
  onRemove,
}: AvatarUploadProps) => {
  const { t } = useLingui()
  const inputRef = useRef<HTMLInputElement>(null)

  const openPicker = () => inputRef.current?.click()

  const handleFile = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (file) onPick(file)
  }

  return (
    <div className={css.upload}>
      <button
        className={css.frame}
        disabled={disabled}
        type='button'
        onClick={openPicker}
      >
        <Avatar name={name} size={150} src={src ?? undefined} />
      </button>
      <input
        ref={inputRef}
        accept='image/*'
        className={css.file}
        disabled={disabled}
        type='file'
        onChange={handleFile}
      />
      {src ? (
        <InlineButton
          disabled={disabled}
          glyph='trash-2'
          label={t`Удалить фото`}
          tone='danger'
          onClick={onRemove}
        />
      ) : (
        <InlineButton
          disabled={disabled}
          glyph='image-plus'
          label={t`Добавить фото`}
          tone='info'
          onClick={openPicker}
        />
      )}
    </div>
  )
}
