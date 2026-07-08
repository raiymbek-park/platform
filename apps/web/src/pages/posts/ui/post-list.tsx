import type { PostTab } from '@raiymbek-park/shared/validation-schemas'

import { useLingui } from '@lingui/react/macro'
import { Button, EmptyState, SkeletonCard } from '@raiymbek-park/ui'
import { useEffect } from 'react'

import { useIntersectionObserver } from '@/shared/lib'
import { useReactionAccess } from '@/shared/session'
import { showToastMessage } from '@/shared/toast'

import { usePostActionsAccess } from '../model/use-post-actions-access'
import { usePostDeletion } from '../model/use-post-deletion'
import { usePostsData } from '../model/use-posts-data'
import { useUpdatePostReaction } from '../model/use-update-post-reaction'
import { PostCardItem } from './post-card-item'
import { PostDeleteConfirm } from './post-delete-confirm'
import css from './post-list.module.scss'

const SKELETON_KEYS = ['a', 'b', 'c', 'd']

const emptyImage = `${import.meta.env.BASE_URL}images/no-data.png`

export type PostListProps = {
  query: string
  search: string
  tab: PostTab
}

export const PostList = ({ query, search, tab }: PostListProps) => {
  const { t } = useLingui()
  const {
    fetchNextPage,
    hasNextPage,
    isError,
    isFetching,
    isFetchingNextPage,
    isPending,
    posts,
    refetch,
  } = usePostsData({ query, search, tab })
  const { canReact } = useReactionAccess()
  const { react } = useUpdatePostReaction()
  const access = usePostActionsAccess()
  const deletion = usePostDeletion()
  const sentinelRef = useIntersectionObserver<HTMLDivElement>({
    enabled: hasNextPage,
    onChange: isIntersecting => {
      if (isIntersecting && !isFetchingNextPage) fetchNextPage()
    },
  })

  useEffect(() => {
    if (isError)
      showToastMessage({ kind: 'error', text: t`Не удалось загрузить ленту` })
  }, [isError, t])

  const skeletons = (
    <div className={css.list} data-testid='post-skeletons'>
      {SKELETON_KEYS.map(key => (
        <SkeletonCard key={key} />
      ))}
    </div>
  )

  if (isPending) return skeletons

  if (isError) {
    return (
      <div className={css.state} data-testid='post-error'>
        <Button icon='refresh-cw' variant='secondary' onClick={() => refetch()}>
          {t`Повторить`}
        </Button>
      </div>
    )
  }

  if (posts.length === 0) {
    return isFetching || query !== search ? (
      skeletons
    ) : (
      <EmptyState
        data-testid='post-empty'
        image={emptyImage}
        message={t`Пока нет ни одного объявления.`}
        title={t`Нет данных`}
      />
    )
  }

  return (
    <div className={css.list}>
      {posts.map(post => (
        <PostCardItem
          key={post.id}
          canDelete={access.canDelete(post)}
          canEdit={access.canEdit(post)}
          canReact={canReact}
          post={post}
          onDelete={deletion.request}
          onReact={react}
        />
      ))}
      {isFetchingNextPage && <SkeletonCard data-testid='post-more-skeleton' />}
      <div ref={sentinelRef} data-testid='post-sentinel' />
      <PostDeleteConfirm
        isOpen={deletion.isConfirmOpen}
        onCancel={deletion.cancel}
        onConfirm={deletion.confirm}
      />
    </div>
  )
}
