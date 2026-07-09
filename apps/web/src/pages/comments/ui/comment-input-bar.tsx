import type { Comment } from '@raiymbek-park/api'
import type { CommentTarget } from '@raiymbek-park/shared/validation-schemas'
import type { ChangeEvent, FormEvent } from 'react'

import { useLingui } from '@lingui/react/macro'
import { COMMENT_TEXT_MAX } from '@raiymbek-park/shared/validation-schemas'
import { Button, Icon, Input } from '@raiymbek-park/ui'
import { useEffect, useRef, useState } from 'react'

import { useMediaPicker } from '@/shared/media'
import { showToastMessage } from '@/shared/toast'

import { useCreateComment } from '../model/use-create-comment'
import { useUpdateComment } from '../model/use-update-comment'
import css from './comment-input-bar.module.scss'

export type CommentInputBarProps = {
  editing: Comment | null
  target: CommentTarget
  onDoneEditing: () => void
  onSent: () => void
}

export const CommentInputBar = ({
  editing,
  target,
  onDoneEditing,
  onSent,
}: CommentInputBarProps) => {
  const { t } = useLingui()
  const [text, setText] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)
  const media = useMediaPicker()
  const { createComment, isPending: isSending } = useCreateComment(target)
  const { isPending: isSaving, updateComment } = useUpdateComment(target)

  const isEditing = editing !== null

  useEffect(() => {
    setText(editing?.text ?? '')
  }, [editing])

  const isPending = isSending || isSaving
  const trimmed = text.trim()
  const canSend = isEditing
    ? trimmed.length > 0 || editing.media.length > 0
    : trimmed.length > 0 || media.files.length > 0

  const send = () => {
    createComment(
      { files: media.files, text: trimmed },
      {
        onFailure: () =>
          showToastMessage({
            kind: 'error',
            text: t`Не удалось отправить сообщение. Попробуйте ещё раз.`,
          }),
        onSuccess: failedCount => {
          setText('')
          media.reset()
          if (failedCount > 0)
            showToastMessage({
              kind: 'info',
              text: t`Сообщение отправлено. Файлов не загрузилось: ${failedCount}`,
            })
          onSent()
        },
      },
    )
  }

  const save = () => {
    if (!editing) return
    updateComment(
      { id: editing.id, media: editing.media, text: trimmed },
      {
        onFailure: () =>
          showToastMessage({
            kind: 'error',
            text: t`Не удалось сохранить изменения. Попробуйте ещё раз.`,
          }),
        onSuccess: onDoneEditing,
      },
    )
  }

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    if (!canSend || isPending) return
    if (isEditing) save()
    else send()
  }

  const pickFiles = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0)
      media.add(event.target.files)
    event.target.value = ''
  }

  return (
    <form className={css.bar} onSubmit={handleSubmit}>
      {!isEditing && media.items.length > 0 && (
        <div className={css.previews}>
          {media.items.map(item => (
            <div key={item.id} className={css.preview}>
              {item.isVideo ? (
                <video className={css.thumb} muted src={item.url} />
              ) : (
                <img alt='' className={css.thumb} src={item.url} />
              )}
              <button
                aria-label={t`Удалить`}
                className={css.remove}
                type='button'
                onClick={() => media.remove(item.id)}
              >
                <Icon glyph='x' size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
      <div className={css.row}>
        <Input
          disabled={isPending}
          icon={isEditing ? 'pen-line' : 'image-plus'}
          maxLength={COMMENT_TEXT_MAX}
          placeholder={t`Наберите текст`}
          trailing={
            isEditing ? (
              <button
                aria-label={t`Отмена`}
                className={css.cancel}
                type='button'
                onClick={onDoneEditing}
              >
                <Icon glyph='x' size={18} />
              </button>
            ) : undefined
          }
          value={text}
          onChange={event => setText(event.target.value)}
          onIconClick={isEditing ? undefined : () => fileRef.current?.click()}
        />
        <Button
          aria-label={isEditing ? t`Сохранить` : t`Отправить`}
          disabled={!canSend}
          icon={isEditing ? 'save' : 'send-horizontal'}
          isIconOnly
          isLoading={isPending}
          type='submit'
        />
      </div>
      <input
        ref={fileRef}
        accept='image/*,video/*'
        hidden
        multiple
        type='file'
        onChange={pickFiles}
      />
    </form>
  )
}
