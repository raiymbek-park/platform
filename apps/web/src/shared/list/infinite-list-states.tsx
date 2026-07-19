import { useLingui } from '@lingui/react/macro'
import { Button, EmptyState, SkeletonCard } from '@raiymbek-park/ui'
import { type ReactNode, useEffect } from 'react'

import { showToastMessage } from '@/shared/toast'

import css from './infinite-list-states.module.scss'

const SKELETON_KEYS = ['a', 'b', 'c', 'd']

const emptyImage = `${import.meta.env.BASE_URL}images/no-data.png`

type InfiniteListStatesProps = {
  emptyMessage: string
  errorToast: string
  isEmpty: boolean
  isError: boolean
  isPending: boolean
  isSettling: boolean
  testIds: { empty: string; error: string; skeletons: string }
  children: ReactNode
  onRetry: () => void
}

export const InfiniteListStates = ({
  emptyMessage,
  errorToast,
  isEmpty,
  isError,
  isPending,
  isSettling,
  testIds,
  children,
  onRetry,
}: InfiniteListStatesProps) => {
  const { t } = useLingui()

  useEffect(() => {
    if (isError) showToastMessage({ kind: 'error', text: errorToast })
  }, [isError, errorToast])

  const skeletons = (
    <div className={css.list} data-testid={testIds.skeletons}>
      {SKELETON_KEYS.map(key => (
        <SkeletonCard key={key} />
      ))}
    </div>
  )

  if (isPending) return skeletons

  if (isError) {
    return (
      <div className={css.state} data-testid={testIds.error}>
        <Button icon='refresh-cw' variant='secondary' onClick={onRetry}>
          {t`Повторить`}
        </Button>
      </div>
    )
  }

  if (isEmpty) {
    return isSettling ? (
      skeletons
    ) : (
      <EmptyState
        data-testid={testIds.empty}
        image={emptyImage}
        message={emptyMessage}
        title={t`Нет данных`}
      />
    )
  }

  return <div className={css.list}>{children}</div>
}
