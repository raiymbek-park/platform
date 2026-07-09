import type { ReactionKind } from '@raiymbek-park/shared/validation-schemas'
import type { PostCardContact } from '@raiymbek-park/ui'
import type { PostView } from '../model/use-posts-data'

import { i18n } from '@lingui/core'
import { useLingui } from '@lingui/react/macro'
import {
  CommentCount,
  InlineButton,
  PostCard,
  Reaction,
} from '@raiymbek-park/ui'
import { useNavigate } from '@tanstack/react-router'
import { useState } from 'react'

import { formatPostDate } from '../model/format-post-date'
import { usePostBadges } from '../model/use-post-badges'

export type PostCardItemProps = {
  canDelete: boolean
  canEdit: boolean
  canReact: boolean
  post: PostView
  onDelete: (postId: string) => void
  onReact: (
    postId: string,
    kind: ReactionKind,
    current: ReactionKind | null,
  ) => void
}

export const PostCardItem = ({
  canDelete,
  canEdit,
  canReact,
  post,
  onDelete,
  onReact,
}: PostCardItemProps) => {
  const { t } = useLingui()
  const navigate = useNavigate()
  const { authorLabel, cardTags, categoryGlyph, categoryTone } = usePostBadges()
  const [isExpanded, setExpanded] = useState(false)

  const dateLabel = formatPostDate(post.createdAt, i18n.locale, {
    today: t`Сегодня`,
    yesterday: t`Вчера`,
  })
  const meta = `${dateLabel} · ${authorLabel(post)}`

  const editPost = () =>
    navigate({ params: { postId: post.id }, to: '/posts/edit/$postId' })

  const openComments = () =>
    navigate({ params: { postId: post.id }, to: '/posts/$postId/comments' })

  const hasActions = canEdit || canDelete

  const contacts: PostCardContact[] =
    post.kind === 'offer'
      ? [
          ...(post.authorName
            ? [
                {
                  glyph: 'user-round',
                  isEmphasis: true,
                  text: post.authorName,
                } satisfies PostCardContact,
              ]
            : []),
          ...(post.authorPhone
            ? [
                {
                  glyph: 'phone',
                  isAction: true,
                  text: post.authorPhone,
                } satisfies PostCardContact,
              ]
            : []),
          {
            glyph: 'map-pin',
            text: t`Блок ${post.block} · Квартира ${post.apartment}`,
          },
        ]
      : []

  return (
    <PostCard
      actions={
        hasActions ? (
          <>
            {canEdit && (
              <InlineButton
                glyph='square-pen'
                label={t`Редактировать`}
                tone='info'
                onClick={editPost}
              />
            )}
            {canDelete && (
              <InlineButton
                glyph='trash-2'
                label={t`Удалить`}
                tone='danger'
                onClick={() => onDelete(post.id)}
              />
            )}
          </>
        ) : undefined
      }
      badgeGlyph={categoryGlyph(post)}
      badgeTone={categoryTone(post)}
      collapseLabel={t`Свернуть`}
      contacts={contacts}
      data-testid='post-card'
      description={post.description}
      expandLabel={
        post.kind === 'announcement' ? t`Читать далее` : t`Подробнее`
      }
      isExpanded={isExpanded}
      media={post.media}
      meta={meta}
      reactions={
        <>
          <Reaction
            aria-label={t`Нравится`}
            count={post.likeCount}
            disabled={!canReact}
            isActive={post.myReaction === 'like'}
            kind='like'
            onClick={() => onReact(post.id, 'like', post.myReaction)}
          />
          <Reaction
            aria-label={t`Не нравится`}
            count={post.dislikeCount}
            disabled={!canReact}
            isActive={post.myReaction === 'dislike'}
            kind='dislike'
            onClick={() => onReact(post.id, 'dislike', post.myReaction)}
          />
          <CommentCount
            aria-label={t`Комментарии: ${post.commentCount}`}
            count={post.commentCount}
            onClick={openComments}
          />
        </>
      }
      tags={cardTags(post)}
      title={post.title}
      onToggleExpand={() => setExpanded(expanded => !expanded)}
    />
  )
}
