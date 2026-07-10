import type { Comment } from '@raiymbek-park/api'
import type { CommentTarget } from '@raiymbek-park/shared/validation-schemas'

import { useLingui } from '@lingui/react/macro'
import { Button, EmptyState, Spinner } from '@raiymbek-park/ui'
import { useEffect, useRef } from 'react'

import { useIntersectionObserver } from '@/shared/lib'

import { useCommentsData } from '../model/use-comments-data'
import { CommentMessage } from './comment-message'
import css from './comment-thread.module.scss'

const emptyImage = `${import.meta.env.BASE_URL}images/no-data.png`

export type CommentThreadProps = {
  canAct: (comment: Comment) => boolean
  scrollSignal: number
  target: CommentTarget
  onActions: (comment: Comment) => void
}

export const CommentThread = ({
  canAct,
  scrollSignal,
  target,
  onActions,
}: CommentThreadProps) => {
  const { t } = useLingui()
  const {
    comments,
    fetchNextPage,
    hasNextPage,
    isError,
    isFetchingNextPage,
    isPending,
    refetch,
  } = useCommentsData(target)
  const bottomRef = useRef<HTMLDivElement>(null)
  const didInit = useRef(false)
  const sentinelRef = useIntersectionObserver<HTMLDivElement>({
    enabled: hasNextPage,
    onChange: isIntersecting => {
      if (isIntersecting && !isFetchingNextPage) fetchNextPage()
    },
  })

  useEffect(() => {
    if (isPending || didInit.current) return
    bottomRef.current?.scrollIntoView()
    didInit.current = true
  }, [isPending])

  useEffect(() => {
    if (scrollSignal > 0)
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [scrollSignal])

  if (isPending)
    return (
      <div className={css.state}>
        <Spinner label={t`Загрузка…`} />
      </div>
    )

  if (isError)
    return (
      <div className={css.state} data-testid='comment-error'>
        <Button icon='refresh-cw' variant='secondary' onClick={() => refetch()}>
          {t`Повторить`}
        </Button>
      </div>
    )

  if (comments.length === 0)
    return (
      <div className={css.state}>
        <EmptyState
          image={emptyImage}
          message={t`Будьте первым, кто оставит комментарий.`}
          title={t`Пока нет комментариев`}
        />
      </div>
    )

  return (
    <div className={css.thread}>
      {comments.map(comment => (
        <CommentMessage
          key={comment.id}
          comment={comment}
          target={target}
          onActions={canAct(comment) ? () => onActions(comment) : undefined}
        />
      ))}
      <div ref={sentinelRef} />
      <div ref={bottomRef} />
    </div>
  )
}
