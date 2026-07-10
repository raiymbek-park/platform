import type {
  IssueStatus,
  ReactionKind,
} from '@raiymbek-park/shared/validation-schemas'
import type { IssueCardContact } from '@raiymbek-park/ui'
import type { IssueView } from '../model/use-issues-data'

import { i18n } from '@lingui/core'
import { useLingui } from '@lingui/react/macro'
import {
  CommentCount,
  InlineButton,
  IssueCard,
  Reaction,
} from '@raiymbek-park/ui'
import { useNavigate } from '@tanstack/react-router'
import { useState } from 'react'

import { TranslationNote } from '@/shared/i18n'

import { formatIssueDate } from '../model/format-issue-date'
import { useIssueBadges } from '../model/use-issue-badges'

export type IssueCardItemProps = {
  canChangeStatus: boolean
  canDelete: boolean
  canEdit: boolean
  canReact: boolean
  issue: IssueView
  onDelete: (issueId: string) => void
  onReact: (
    issueId: string,
    kind: ReactionKind,
    current: ReactionKind | null,
  ) => void
}

export const IssueCardItem = ({
  canChangeStatus,
  canDelete,
  canEdit,
  canReact,
  issue,
  onDelete,
  onReact,
}: IssueCardItemProps) => {
  const { t } = useLingui()
  const navigate = useNavigate()
  const { cardStatusLabel, cardTags, statusGlyph, statusTone } =
    useIssueBadges()
  const [isExpanded, setExpanded] = useState(false)
  const [isShowingOriginal, setShowingOriginal] = useState(false)

  const original = isShowingOriginal ? issue.original : null

  const toggleExpand = () => {
    setShowingOriginal(false)
    setExpanded(expanded => !expanded)
  }

  const status: IssueStatus = issue.status
  const meta = t`Заявка №${issue.number} · ${cardStatusLabel(status)}`

  const editIssue = () =>
    navigate({ params: { issueId: issue.id }, to: '/issues/edit/$issueId' })

  const changeStatus = () =>
    navigate({ params: { issueId: issue.id }, to: '/issues/status/$issueId' })

  const openComments = () =>
    navigate({ params: { issueId: issue.id }, to: '/issues/$issueId/comments' })

  const hasActions = canEdit || canChangeStatus || canDelete

  const contacts: IssueCardContact[] = [
    ...(issue.authorName
      ? [
          {
            glyph: 'user-round',
            isEmphasis: true,
            text: issue.authorName,
          } satisfies IssueCardContact,
        ]
      : []),
    ...(issue.authorPhone
      ? [
          {
            glyph: 'phone',
            isAction: true,
            text: issue.authorPhone,
          } satisfies IssueCardContact,
        ]
      : []),
    { glyph: 'calendar', text: formatIssueDate(issue.createdAt, i18n.locale) },
    {
      glyph: 'map-pin',
      text: t`Блок ${issue.block} · Квартира ${issue.apartment}`,
    },
  ]

  return (
    <IssueCard
      actions={
        hasActions ? (
          <>
            {canEdit && (
              <InlineButton
                glyph='square-pen'
                label={t`Редактировать`}
                tone='info'
                onClick={editIssue}
              />
            )}
            {canChangeStatus && (
              <InlineButton
                glyph='refresh-cw'
                label={t`Сменить статус`}
                tone='success'
                onClick={changeStatus}
              />
            )}
            {canDelete && (
              <InlineButton
                glyph='trash-2'
                label={t`Удалить`}
                tone='danger'
                onClick={() => onDelete(issue.id)}
              />
            )}
          </>
        ) : undefined
      }
      badgeGlyph={statusGlyph(status)}
      badgeTone={statusTone(status)}
      collapseLabel={t`Свернуть`}
      contacts={contacts}
      data-testid='issue-card'
      description={original?.description ?? issue.description}
      expandLabel={t`Подробнее`}
      isExpanded={isExpanded}
      media={issue.media}
      meta={meta}
      reactions={
        <>
          <Reaction
            aria-label={t`Нравится`}
            count={issue.likeCount}
            disabled={!canReact}
            isActive={issue.myReaction === 'like'}
            kind='like'
            onClick={() => onReact(issue.id, 'like', issue.myReaction)}
          />
          <Reaction
            aria-label={t`Не нравится`}
            count={issue.dislikeCount}
            disabled={!canReact}
            isActive={issue.myReaction === 'dislike'}
            kind='dislike'
            onClick={() => onReact(issue.id, 'dislike', issue.myReaction)}
          />
          <CommentCount
            aria-label={t`Комментарии: ${issue.commentCount}`}
            count={issue.commentCount}
            onClick={openComments}
          />
        </>
      }
      tags={cardTags(issue)}
      title={original?.title ?? issue.title}
      translation={
        issue.original && (
          <TranslationNote
            isShowingOriginal={isShowingOriginal}
            lang={issue.originalLang}
            onToggle={() => setShowingOriginal(showing => !showing)}
          />
        )
      }
      onToggleExpand={toggleExpand}
    />
  )
}
