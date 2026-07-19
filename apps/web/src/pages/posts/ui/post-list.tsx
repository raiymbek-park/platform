import type { PostTab } from '@raiymbek-park/shared/validation-schemas'

import { useLingui } from '@lingui/react/macro'
import { SkeletonCard } from '@raiymbek-park/ui'

import { InfiniteListStates, useInfiniteSentinel } from '@/shared/list'
import { useReactionAccess } from '@/shared/session'

import { usePostActionsAccess } from '../model/use-post-actions-access'
import { usePostDeletion } from '../model/use-post-deletion'
import { usePostsData } from '../model/use-posts-data'
import { useUpdatePostReaction } from '../model/use-update-post-reaction'
import { PostCardItem } from './post-card-item'
import { PostDeleteConfirm } from './post-delete-confirm'

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
  const sentinelRef = useInfiniteSentinel({
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  })

  return (
    <InfiniteListStates
      emptyMessage={t`Пока нет ни одного объявления.`}
      errorToast={t`Не удалось загрузить ленту`}
      isEmpty={posts.length === 0}
      isError={isError}
      isPending={isPending}
      isSettling={isFetching || query !== search}
      testIds={{
        empty: 'post-empty',
        error: 'post-error',
        skeletons: 'post-skeletons',
      }}
      onRetry={() => refetch()}
    >
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
    </InfiniteListStates>
  )
}
