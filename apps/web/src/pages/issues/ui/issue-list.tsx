import type { IssueStatus } from '@raiymbek-park/shared/validation-schemas'

import { useLingui } from '@lingui/react/macro'
import {
  Button,
  EmptyState,
  InfoCallout,
  SkeletonCard,
} from '@raiymbek-park/ui'

import { matchIssue } from '../model/match-issue'
import { useIssuesData } from '../model/use-issues-data'
import { useReactionAccess } from '../model/use-reaction-access'
import { useUpdateIssueReaction } from '../model/use-update-issue-reaction'
import { IssueCardItem } from './issue-card-item'
import css from './issue-list.module.scss'

const SKELETON_KEYS = ['a', 'b', 'c', 'd']

const emptyImage = `${import.meta.env.BASE_URL}images/no-data.png`

export type IssueListProps = {
  query: string
  status: IssueStatus
}

export const IssueList = ({ query, status }: IssueListProps) => {
  const { t } = useLingui()
  const { data, isError, isPending, refetch } = useIssuesData(status)
  const { canReact } = useReactionAccess()
  const { isReacting, react } = useUpdateIssueReaction(status)

  if (isPending) {
    return (
      <div className={css.list} data-testid='issue-skeletons'>
        {SKELETON_KEYS.map(key => (
          <SkeletonCard key={key} />
        ))}
      </div>
    )
  }

  if (isError) {
    return (
      <div className={css.state} data-testid='issue-error'>
        <InfoCallout icon='circle-alert' variant='danger'>
          {t`Не удалось загрузить заявки`}
        </InfoCallout>
        <Button icon='refresh-cw' variant='secondary' onClick={() => refetch()}>
          {t`Повторить`}
        </Button>
      </div>
    )
  }

  const issues = data.filter(issue => matchIssue(issue, query))

  if (issues.length === 0) {
    return (
      <EmptyState
        data-testid='issue-empty'
        image={emptyImage}
        message={t`Не найдено ни одной заявки.`}
        title={t`Нет данных`}
      />
    )
  }

  return (
    <div className={css.list}>
      {issues.map(issue => (
        <IssueCardItem
          key={issue.id}
          canReact={canReact}
          isReacting={isReacting(issue.id)}
          issue={issue}
          onReact={react}
        />
      ))}
    </div>
  )
}
