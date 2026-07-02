import type {
  IssueStatus,
  ReactionKind,
} from '@raiymbek-park/shared/validation-schemas'
import type { IssueCardContact } from '@raiymbek-park/ui'
import type { IssueView } from '../model/use-issues-data'

import { i18n } from '@lingui/core'
import { useLingui } from '@lingui/react/macro'
import { IssueCard, Reaction } from '@raiymbek-park/ui'
import { useState } from 'react'

import { formatIssueDate } from '../model/format-issue-date'
import { useIssueBadges } from '../model/use-issue-badges'

export type IssueCardItemProps = {
  canReact: boolean
  isReacting: boolean
  issue: IssueView
  onReact: (issueId: string, kind: ReactionKind) => void
}

export const IssueCardItem = ({
  canReact,
  isReacting,
  issue,
  onReact,
}: IssueCardItemProps) => {
  const { t } = useLingui()
  const { cardStatusLabel, cardTags, statusGlyph } = useIssueBadges()
  const [isExpanded, setExpanded] = useState(false)

  const status: IssueStatus = issue.status
  const meta = t`Заявка №${issue.number} · ${cardStatusLabel(status)}`

  const contacts: IssueCardContact[] = [
    { glyph: 'user-round', text: issue.authorName },
    { glyph: 'phone', isAction: true, text: issue.authorPhone },
    { glyph: 'calendar', text: formatIssueDate(issue.createdAt, i18n.locale) },
    {
      glyph: 'map-pin',
      text: t`Блок ${issue.block} · Квартира ${issue.apartment}`,
    },
  ]

  return (
    <IssueCard
      badgeGlyph={statusGlyph(status)}
      collapseLabel={t`Свернуть`}
      contacts={contacts}
      data-testid='issue-card'
      description={issue.description}
      expandLabel={t`Подробнее`}
      isExpanded={isExpanded}
      meta={meta}
      reactions={
        <>
          <Reaction
            count={issue.likeCount}
            disabled={!canReact || isReacting}
            isActive={issue.myReaction === 'like'}
            kind='like'
            onClick={() => onReact(issue.id, 'like')}
          />
          <Reaction
            count={issue.dislikeCount}
            disabled={!canReact || isReacting}
            isActive={issue.myReaction === 'dislike'}
            kind='dislike'
            onClick={() => onReact(issue.id, 'dislike')}
          />
        </>
      }
      tags={cardTags(issue)}
      title={issue.title}
      onToggleExpand={() => setExpanded(expanded => !expanded)}
    />
  )
}
