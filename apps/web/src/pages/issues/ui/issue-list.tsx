import type { IssueFilter } from '@raiymbek-park/shared/validation-schemas'

import { useLingui } from '@lingui/react/macro'
import { SkeletonCard } from '@raiymbek-park/ui'

import { InfiniteListStates, useInfiniteSentinel } from '@/shared/list'
import { useReactionAccess } from '@/shared/session'

import { useIssueActionsAccess } from '../model/use-issue-actions-access'
import { useIssueDeletion } from '../model/use-issue-deletion'
import { useIssuesData } from '../model/use-issues-data'
import { useUpdateIssueReaction } from '../model/use-update-issue-reaction'
import { useUpdateIssueWatch } from '../model/use-update-issue-watch'
import { IssueCardItem } from './issue-card-item'
import { IssueDeleteConfirm } from './issue-delete-confirm'

export type IssueListProps = {
  query: string
  search: string
  status: IssueFilter
}

export const IssueList = ({ query, search, status }: IssueListProps) => {
  const { t } = useLingui()
  const {
    fetchNextPage,
    hasNextPage,
    isError,
    isFetching,
    isFetchingNextPage,
    isPending,
    issues,
    refetch,
  } = useIssuesData({ query, search, status })
  const { canReact } = useReactionAccess()
  const { react } = useUpdateIssueReaction()
  const { toggleWatch } = useUpdateIssueWatch()
  const access = useIssueActionsAccess()
  const deletion = useIssueDeletion()
  const sentinelRef = useInfiniteSentinel({
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  })

  return (
    <InfiniteListStates
      emptyMessage={t`Не найдено ни одной заявки.`}
      errorToast={t`Не удалось загрузить заявки`}
      isEmpty={issues.length === 0}
      isError={isError}
      isPending={isPending}
      isSettling={isFetching || query !== search}
      testIds={{
        empty: 'issue-empty',
        error: 'issue-error',
        skeletons: 'issue-skeletons',
      }}
      onRetry={() => refetch()}
    >
      {issues.map(issue => (
        <IssueCardItem
          key={issue.id}
          canChangeStatus={access.canChangeStatus}
          canDelete={access.canDelete(issue)}
          canEdit={access.canEdit(issue)}
          canFollow={access.canFollow}
          canReact={canReact}
          issue={issue}
          onDelete={deletion.request}
          onReact={react}
          onToggleWatch={toggleWatch}
        />
      ))}
      {isFetchingNextPage && <SkeletonCard data-testid='issue-more-skeleton' />}
      <div ref={sentinelRef} data-testid='issue-sentinel' />
      <IssueDeleteConfirm
        isOpen={deletion.isConfirmOpen}
        onCancel={deletion.cancel}
        onConfirm={deletion.confirm}
      />
    </InfiniteListStates>
  )
}
