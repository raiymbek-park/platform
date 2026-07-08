import type { IssueFilter } from '@raiymbek-park/shared/validation-schemas'

import { useLingui } from '@lingui/react/macro'
import { Button, EmptyState, SkeletonCard } from '@raiymbek-park/ui'
import { useEffect } from 'react'

import { showToastMessage } from '@/shared/toast'

import { useIntersectionObserver } from '../model/use-intersection-observer'
import { useIssueActionsAccess } from '../model/use-issue-actions-access'
import { useIssueDeletion } from '../model/use-issue-deletion'
import { useIssuesData } from '../model/use-issues-data'
import { useReactionAccess } from '../model/use-reaction-access'
import { useUpdateIssueReaction } from '../model/use-update-issue-reaction'
import { IssueCardItem } from './issue-card-item'
import { IssueDeleteConfirm } from './issue-delete-confirm'
import css from './issue-list.module.scss'

const SKELETON_KEYS = ['a', 'b', 'c', 'd']

const emptyImage = `${import.meta.env.BASE_URL}images/no-data.png`

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
  const access = useIssueActionsAccess()
  const deletion = useIssueDeletion()
  const sentinelRef = useIntersectionObserver<HTMLDivElement>({
    enabled: hasNextPage,
    onChange: isIntersecting => {
      if (isIntersecting && !isFetchingNextPage) fetchNextPage()
    },
  })

  useEffect(() => {
    if (isError)
      showToastMessage({ kind: 'error', text: t`Не удалось загрузить заявки` })
  }, [isError, t])

  const skeletons = (
    <div className={css.list} data-testid='issue-skeletons'>
      {SKELETON_KEYS.map(key => (
        <SkeletonCard key={key} />
      ))}
    </div>
  )

  if (isPending) return skeletons

  if (isError) {
    return (
      <div className={css.state} data-testid='issue-error'>
        <Button icon='refresh-cw' variant='secondary' onClick={() => refetch()}>
          {t`Повторить`}
        </Button>
      </div>
    )
  }

  if (issues.length === 0) {
    return isFetching || query !== search ? (
      skeletons
    ) : (
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
          canChangeStatus={access.canChangeStatus}
          canDelete={access.canDelete(issue)}
          canEdit={access.canEdit(issue)}
          canReact={canReact}
          issue={issue}
          onDelete={deletion.request}
          onReact={react}
        />
      ))}
      {isFetchingNextPage && <SkeletonCard data-testid='issue-more-skeleton' />}
      <div ref={sentinelRef} data-testid='issue-sentinel' />
      <IssueDeleteConfirm
        isOpen={deletion.isConfirmOpen}
        onCancel={deletion.cancel}
        onConfirm={deletion.confirm}
      />
    </div>
  )
}
