import type { ReactionKind } from '@raiymbek-park/shared/validation-schemas'
import type { IssueView } from '../model/use-issues-data'

import { useLingui } from '@lingui/react/macro'
import { IssueCard, Reaction } from '@raiymbek-park/ui'

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
  const { cardBadges, cardTags } = useIssueBadges()

  const author = t`${issue.authorName} · Блок ${issue.block}, кв. ${issue.apartment}`

  return (
    <IssueCard
      author={author}
      badges={cardBadges(issue)}
      data-testid='issue-card'
      description={issue.description}
      number={`#${issue.number}`}
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
    />
  )
}
