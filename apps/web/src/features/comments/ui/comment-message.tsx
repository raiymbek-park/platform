import type { Comment, CommentTranslation } from '@raiymbek-park/api'
import type { CommentTarget } from '@raiymbek-park/shared/validation-schemas'

import { i18n } from '@lingui/core'
import { useLingui } from '@lingui/react/macro'
import { MessageBubble } from '@raiymbek-park/ui'
import { useState } from 'react'

import { showToastMessage } from '@/shared/toast'

import { formatCommentTime } from '../model/format-comment-time'
import { useTranslateComment } from '../model/use-translate-comment'

export type CommentMessageProps = {
  comment: Comment
  target: CommentTarget
  onActions?: () => void
}

export const CommentMessage = ({
  comment,
  target,
  onActions,
}: CommentMessageProps) => {
  const { t } = useLingui()
  const [isShowingTranslation, setShowingTranslation] = useState(false)
  const [result, setResult] = useState<CommentTranslation | null>(null)
  const { isTranslating, translateComment } = useTranslateComment(
    target,
    comment.id,
  )

  const lang = result?.lang ?? comment.lang
  const translation = result?.text ?? comment.translation
  const isTranslatable =
    !comment.isMine && comment.text !== '' && lang !== i18n.locale

  const requestTranslation = () =>
    translateComment({
      onFailure: () =>
        showToastMessage({
          kind: 'error',
          text: t`Не удалось перевести сообщение. Попробуйте ещё раз.`,
        }),
      onSuccess: translated => {
        setResult(translated)
        setShowingTranslation(true)
      },
    })

  const toggleTranslation = () => {
    if (isTranslating) return
    if (isShowingTranslation) return setShowingTranslation(false)
    if (translation !== null) return setShowingTranslation(true)
    requestTranslation()
  }

  const translateLabel = () => {
    if (isTranslating) return t`Переводим…`
    if (isShowingTranslation) return t`Показать оригинал`
    return t`Перевести`
  }

  const translateProps = isTranslatable
    ? { translateLabel: translateLabel(), onTranslate: toggleTranslation }
    : {}

  return (
    <MessageBubble
      actionsLabel={t`Действия с сообщением`}
      authorAvatar={comment.author.avatarUrl ?? undefined}
      authorName={comment.author.name}
      editedLabel={t`изменено`}
      isEdited={comment.editedAt !== null}
      isOwn={comment.isMine}
      isTranslating={isTranslating}
      media={comment.media}
      text={
        isShowingTranslation && translation !== null
          ? translation
          : comment.text
      }
      time={formatCommentTime(comment.createdAt, i18n.locale)}
      onActions={onActions}
      {...translateProps}
    />
  )
}
