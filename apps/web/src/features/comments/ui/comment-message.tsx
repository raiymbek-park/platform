import type { Comment } from '@raiymbek-park/api'

import { i18n } from '@lingui/core'
import { useLingui } from '@lingui/react/macro'
import { MessageBubble } from '@raiymbek-park/ui'
import { useState } from 'react'

import { formatCommentTime } from '../model/format-comment-time'

export type CommentMessageProps = {
  comment: Comment
  onActions?: () => void
}

export const CommentMessage = ({ comment, onActions }: CommentMessageProps) => {
  const { t } = useLingui()
  const [isShowingOriginal, setShowingOriginal] = useState(false)

  const translateProps =
    !comment.isMine && comment.original !== null
      ? {
          translateLabel: isShowingOriginal
            ? t`Показать перевод`
            : t`Показать оригинальный текст`,
          onTranslate: () => setShowingOriginal(showing => !showing),
        }
      : {}

  return (
    <MessageBubble
      actionsLabel={t`Действия с сообщением`}
      authorAvatar={comment.author.avatarUrl ?? undefined}
      authorName={comment.author.name}
      editedLabel={t`изменено`}
      isEdited={comment.editedAt !== null}
      isOwn={comment.isMine}
      media={comment.media}
      text={
        isShowingOriginal && comment.original !== null
          ? comment.original
          : comment.text
      }
      time={formatCommentTime(comment.createdAt, i18n.locale)}
      onActions={onActions}
      {...translateProps}
    />
  )
}
