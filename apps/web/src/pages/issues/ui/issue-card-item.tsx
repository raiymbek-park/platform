import type {
  IssueStatus,
  ReactionKind,
} from '@raiymbek-park/shared/validation-schemas'
import type { IssueCardContact } from '@raiymbek-park/ui'
import type { IssueView } from '../model/use-issues-data'

import { i18n } from '@lingui/core'
import { useLingui } from '@lingui/react/macro'
import { CommentCount, IssueCard, Reaction } from '@raiymbek-park/ui'
import { useState } from 'react'

import { formatIssueDate } from '../model/format-issue-date'
import { useIssueBadges } from '../model/use-issue-badges'
import { IssueActionsMenu } from './issue-actions-menu'

export type IssueCardItemProps = {
  canDelete: boolean
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
  canDelete,
  canReact,
  issue,
  onDelete,
  onReact,
}: IssueCardItemProps) => {
  const { t } = useLingui()
  const { cardStatusLabel, cardTags, statusGlyph, statusTone } =
    useIssueBadges()
  const [isExpanded, setExpanded] = useState(false)

  const status: IssueStatus = issue.status
  const meta = t`Заявка №${issue.number} · ${cardStatusLabel(status)}`

  const contacts: IssueCardContact[] = [
    { glyph: 'user-round', isEmphasis: true, text: issue.authorName },
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
        canDelete ? (
          <IssueActionsMenu onDelete={() => onDelete(issue.id)} />
        ) : undefined
      }
      badgeGlyph={statusGlyph(status)}
      badgeTone={statusTone(status)}
      collapseLabel={t`Свернуть`}
      contacts={contacts}
      data-testid='issue-card'
      description={issue.description}
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
          <CommentCount count={issue.commentCount} />
        </>
      }
      tags={cardTags(issue)}
      title={issue.title}
      onToggleExpand={() => setExpanded(expanded => !expanded)}
    />
  )
}
